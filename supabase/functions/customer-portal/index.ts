
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
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    logStep("CORS preflight request received");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    // Validate environment variables
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY is not set");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified", { keyLength: stripeKey.length });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logStep("ERROR: Supabase environment variables not set");
      throw new Error("Supabase environment variables not set");
    }
    logStep("Supabase environment variables verified");
    
    // Initialize services
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    logStep("Services initialized");

    // Get and validate auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header provided");
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    // Authenticate user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep(`ERROR: Authentication error - ${userError.message}`);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!userData?.user) {
      logStep("ERROR: No user found in auth response");
      throw new Error("Authentication failed: No user data found");
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("ERROR: User email not available");
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Find Stripe customer
    try {
      logStep("Searching for Stripe customer with email", { email: user.email });
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length === 0) {
        logStep("ERROR: No Stripe customer found for this user");
        throw new Error("No Stripe customer found for this user. Please subscribe to a plan first.");
      }

      const customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });

      // Create a customer portal session
      const origin = req.headers.get("origin") || "https://automator.ro";
      logStep("Creating customer portal session", { origin });
      
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/account`,
      });

      logStep("Customer portal session created", { sessionId: session.id, url: session.url });
      
      // Return the customer portal session URL
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeError) {
      const errorMessage = stripeError instanceof Error ? stripeError.message : String(stripeError);
      logStep("ERROR: Stripe operation failed", { message: errorMessage, error: stripeError });
      throw new Error(`Stripe error: ${errorMessage}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[CUSTOMER-PORTAL] ERROR: ${errorMessage}`, error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      time: new Date().toISOString(),
      path: "customer-portal"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
