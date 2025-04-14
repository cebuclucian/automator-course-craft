
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY is not set");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified", { keyLength: stripeKey.length });
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Initialize Supabase client with anon key for authentication
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logStep("ERROR: Supabase environment variables not set");
      throw new Error("Supabase environment variables not set");
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    logStep("Supabase client initialized");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header provided");
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep(`ERROR: Authentication error - ${userError.message}`);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("ERROR: User not authenticated or email not available");
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const requestData = await req.json();
    const { packageName } = requestData;
    logStep("Request data", { packageName });

    if (!packageName) {
      logStep("ERROR: No package name provided");
      throw new Error("No package name provided");
    }

    // Map package names to actual prices
    const priceMap: Record<string, { amount: number, interval: string }> = {
      'Basic': { amount: 1900, interval: 'month' },
      'Pro': { amount: 4900, interval: 'month' },
      'Enterprise': { amount: 12900, interval: 'month' },
      'Premium': { amount: 4900, interval: 'month' }, // For English language
      // Add Romanian language options
      'Gratuit': { amount: 0, interval: 'month' },
      'Free': { amount: 0, interval: 'month' }
    };

    const packagePrice = priceMap[packageName];
    if (!packagePrice) {
      logStep(`ERROR: Invalid package name: ${packageName}`);
      throw new Error(`Invalid package name: ${packageName}`);
    }
    logStep("Package pricing", packagePrice);

    // For free packages, don't create a checkout session
    if (packagePrice.amount === 0) {
      logStep("Free package selected, no checkout required");
      return new Response(JSON.stringify({ free: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Find or create a Stripe customer for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = newCustomer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Create a subscription checkout session
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${packageName} Subscription`,
              description: `Automator ${packageName} subscription plan`
            },
            unit_amount: packagePrice.amount,
            recurring: {
              interval: packagePrice.interval as 'month' | 'year'
            }
          },
          quantity: 1,
        }
      ],
      mode: 'subscription',
      success_url: `${origin}/account?checkout_success=true`,
      cancel_url: `${origin}/packages?checkout_canceled=true`,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });
    
    // Initialize Supabase service client for updating the subscribers table
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      logStep("ERROR: SUPABASE_SERVICE_ROLE_KEY is not set");
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }
    
    const supabaseService = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    );

    // Update the subscribers table with the pending subscription
    await supabaseService.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      // Don't set subscribed to true yet - this will happen after successful payment
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });

    logStep("Updated subscribers table with checkout info");

    // Return the checkout session URL
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[CREATE-CHECKOUT] ERROR: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
