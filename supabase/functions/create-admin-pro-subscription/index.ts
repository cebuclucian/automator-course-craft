
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Hardcoded email for admin
    const adminEmail = "admin@automator.ro";

    // Find the user in Supabase auth
    const { data: { users }, error: userError } = await supabaseClient.auth.admin.listUsers();
    const adminUser = users.find(user => user.email === adminEmail);
    
    if (userError) throw new Error(`User lookup error: ${userError.message}`);
    if (!adminUser) throw new Error("Admin user not found");

    // Check if the user already exists in Stripe
    const existingCustomers = await stripe.customers.list({ email: adminEmail, limit: 1 });
    let customerId;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Create a new Stripe customer if not exists
      const customer = await stripe.customers.create({
        email: adminEmail,
        name: "Admin User"
      });
      customerId = customer.id;
    }

    // Create a Pro subscription that's automatically active
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: "price_1PMZmXKyxqFxRVYEOCRZyOqm" }],
      payment_behavior: 'default_incomplete',
      trial_end: 'now', // This will activate the subscription immediately
      expand: ['latest_invoice.payment_intent'],
      cancel_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).getTime() / 1000, // Set to expire in 1 year
    });

    // Update Supabase subscribers table
    await supabaseClient.from('subscribers').upsert({
      email: adminEmail,
      user_id: adminUser.id,
      stripe_customer_id: customerId,
      subscribed: true,
      subscription_tier: 'Pro',
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString()
    }, { onConflict: 'email' });

    return new Response(JSON.stringify({ 
      message: "Pro subscription created successfully",
      subscriptionId: subscription.id,
      customerId: customerId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Subscription creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

