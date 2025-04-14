
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
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    console.log("Stripe initialized");

    // Initialize Supabase client with service role key for admin access
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
    
    // Either find the admin user or create a placeholder ID
    let adminUserId = "admin-user-placeholder";
    const adminUser = users.find(user => user.email === adminEmail);
    
    if (adminUser) {
      console.log(`Found admin user with ID: ${adminUser.id}`);
      adminUserId = adminUser.id;
    } else {
      console.log("Admin user not found in auth.users, using placeholder ID");
    }

    // Log current subscriber status before update
    const { data: currentSubscriberData, error: currentSubscriberError } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('email', adminEmail)
      .single();

    console.log("Current subscriber data:", currentSubscriberData);
    if (currentSubscriberError) {
      console.log("Current subscriber error (not found is expected for first creation):", currentSubscriberError);
    }
    
    // Set subscription to expire in 1 year
    const subscriptionEnd = new Date();
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    console.log(`Setting subscription end date to: ${subscriptionEnd.toISOString()}`);

    // Prepare subscription data
    const subscriptionData = {
      email: adminEmail,
      user_id: adminUserId,
      stripe_customer_id: 'admin_pro_account',  // Use a placeholder value
      subscribed: true,
      subscription_tier: 'Pro',
      subscription_end: subscriptionEnd.toISOString()
    };

    console.log("Updating Supabase subscribers table with data:", subscriptionData);
    
    // Update Supabase subscribers table
    const { data: subscriberData, error: subscriberError } = await supabaseClient
      .from('subscribers')
      .upsert(subscriptionData, { onConflict: 'email' });
    
    if (subscriberError) {
      console.error("Error updating subscriber record:", subscriberError);
      throw new Error(`Error updating subscriber record: ${subscriberError.message}`);
    }
    
    console.log("Subscriber record updated successfully");

    // Log updated subscriber data after update
    const { data: updatedSubscriberData, error: updatedSubscriberError } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('email', adminEmail)
      .single();

    console.log("Updated subscriber data:", updatedSubscriberData);
    if (updatedSubscriberError) {
      console.error("Error fetching updated subscriber:", updatedSubscriberError);
    }

    // For demonstration purposes, prepare subscription data for response
    const adminProData = {
      subscriptionTier: 'Pro',
      expiresAt: subscriptionEnd.toISOString(),
      active: true
    };
    
    console.log("Returning success response with data:", adminProData);
    return new Response(JSON.stringify({ 
      message: "Pro subscription created successfully",
      customerId: 'admin_pro_account',
      adminProData,
      subscriptionData: updatedSubscriberData || subscriptionData
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
