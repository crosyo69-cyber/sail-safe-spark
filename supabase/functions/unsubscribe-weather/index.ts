import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, action } = await req.json();

    if (!token) {
      console.error("Missing unsubscribe token");
      return new Response(
        JSON.stringify({ error: "Token manquant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      console.error("Invalid token format:", token);
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // First, verify the token exists
    const { data: subscription, error: fetchError } = await supabase
      .from("weather_alert_subscriptions")
      .select("id, email, enabled")
      .eq("unsubscribe_token", token)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching subscription:", fetchError);
      throw fetchError;
    }

    if (!subscription) {
      console.log("Subscription not found for token:", token);
      return new Response(
        JSON.stringify({ error: "Abonnement non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      // Permanently delete subscription
      const { data: deleteResult, error: deleteError } = await supabase
        .rpc("delete_weather_subscription", { p_token: token });

      if (deleteError) {
        console.error("Error deleting subscription:", deleteError);
        throw deleteError;
      }

      console.log("Subscription deleted for email:", subscription.email);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Abonnement supprimé définitivement",
          email: subscription.email.replace(/(.{2}).*(@.*)/, "$1***$2")
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Just disable (pause) the subscription
      const { data: unsubResult, error: unsubError } = await supabase
        .rpc("unsubscribe_weather_alert", { p_token: token });

      if (unsubError) {
        console.error("Error unsubscribing:", unsubError);
        throw unsubError;
      }

      if (!unsubResult) {
        // Already unsubscribed
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Vous êtes déjà désabonné",
            email: subscription.email.replace(/(.{2}).*(@.*)/, "$1***$2"),
            alreadyUnsubscribed: true
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Subscription disabled for email:", subscription.email);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Désabonnement effectué avec succès",
          email: subscription.email.replace(/(.{2}).*(@.*)/, "$1***$2")
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error in unsubscribe function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
