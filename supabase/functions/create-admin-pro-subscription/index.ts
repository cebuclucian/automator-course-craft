
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting create-admin-pro-subscription function...");
    
    // Check and log environment variables (without revealing secrets)
    const stripeKeyExists = !!Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrlExists = !!Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleExists = !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log(`Environment variables status:
      - STRIPE_SECRET_KEY: ${stripeKeyExists ? "exists" : "missing"}
      - SUPABASE_URL: ${supabaseUrlExists ? "exists" : "missing"}
      - SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleExists ? "exists" : "missing"}`);
    
    if (!stripeKeyExists || !supabaseUrlExists || !supabaseServiceRoleExists) {
      throw new Error("Missing required environment variables");
    }
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    console.log("Stripe initialized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRole,
      { auth: { persistSession: false } }
    );
    console.log("Supabase client initialized");

    // Hardcoded email for admin
    const adminEmail = "admin@automator.ro";
    console.log(`Looking up admin user with email: ${adminEmail}`);

    // Find the user in Supabase auth
    const { data: { users }, error: userError } = await supabaseClient.auth.admin.listUsers();
    
    if (userError) {
      console.error("User lookup error:", userError);
      throw new Error(`User lookup error: ${userError.message}`);
    }
    
    console.log(`Found ${users?.length || 0} users in total`);
    const adminUser = users.find(user => user.email === adminEmail);
    
    if (!adminUser) {
      console.error("Admin user not found");
      throw new Error("Admin user not found");
    }
    
    console.log(`Found admin user with ID: ${adminUser.id}`);

    // Check if the user already exists in Stripe
    console.log("Looking up customer in Stripe by email");
    const existingCustomers = await stripe.customers.list({ email: adminEmail, limit: 1 });
    let customerId;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      console.log(`Found existing Stripe customer with ID: ${customerId}`);
    } else {
      // Create a new Stripe customer if not exists
      console.log("Creating new Stripe customer");
      const customer = await stripe.customers.create({
        email: adminEmail,
        name: "Admin User"
      });
      customerId = customer.id;
      console.log(`Created new Stripe customer with ID: ${customerId}`);
    }

    // Get or create a product and price if needed
    console.log("Checking for Pro subscription price");
    const priceId = "price_1PMZmXKyxqFxRVYEOCRZyOqm";
    
    // Create a Pro subscription that's automatically active
    console.log("Creating Pro subscription");
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      trial_end: 'now', // This will activate the subscription immediately
      expand: ['latest_invoice.payment_intent'],
      cancel_at: Math.floor(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).getTime() / 1000), // Set to expire in 1 year
    });
    
    console.log(`Created subscription with ID: ${subscription.id}`);

    // Update Supabase subscribers table
    console.log("Updating Supabase subscribers table");
    const { data: subscriberData, error: subscriberError } = await supabaseClient
      .from('subscribers')
      .upsert({
        email: adminEmail,
        user_id: adminUser.id,
        stripe_customer_id: customerId,
        subscribed: true,
        subscription_tier: 'Pro',
        subscription_end: new Date(subscription.current_period_end * 1000).toISOString()
      }, { onConflict: 'email' });
    
    if (subscriberError) {
      console.error("Error updating subscriber record:", subscriberError);
      throw new Error(`Error updating subscriber record: ${subscriberError.message}`);
    }
    
    console.log("Subscriber record updated successfully");

    // For demonstration purposes, also store this in localStorage
    console.log("Returning success response");
    return new Response(JSON.stringify({ 
      message: "Pro subscription created successfully",
      subscriptionId: subscription.id,
      customerId: customerId,
      adminProData: {
        subscriptionTier: 'Pro',
        expiresAt: new Date(subscription.current_period_end * 1000).toISOString(),
        active: true
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Subscription creation error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      details: "Check Supabase function logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
