import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { globalQuota, publicRateKey } from "../_shared/public-guards.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// F-22-04 : garde de débit sur un endpoint public. Le token reste la protection
// principale ; le guard limite seulement l'abus (fail-open si le guard est HS,
// pour ne jamais empêcher une désinscription légitime).
// F-25-01 : quota global de la surface désinscription, volontairement large
// pour rester utilisable en fonctionnement normal.
const UNSUB_QUOTA_HOUR = 300;
const UNSUB_QUOTA_DAY = 2000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

async function rateGuard(supabase: Db, context: string, key: string, limit: number, window: string) {
  const { data: allowed, error } = await supabase.rpc("public_rate_guard", {
    p_context: context,
    p_key: key && key.trim() ? key : "unknown-key",
    p_limit: limit,
    p_window: window,
  });
  if (error) {
    console.error("rate guard unavailable", context, error.message);
    return null;
  }
  return allowed === true ? null : new Response(
    JSON.stringify({ error: "Trop de demandes. Merci de réessayer plus tard." }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

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
      console.error("Invalid unsubscribe token format");
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ipBlocked = await rateGuard(supabase, "weather_unsubscribe_ip", publicRateKey(req), 30, "1 hour");
    if (ipBlocked) return ipBlocked;
    const tokenBlocked = await rateGuard(supabase, "weather_unsubscribe_token", String(token), 10, "1 hour");
    if (tokenBlocked) return tokenBlocked;

    // F-25-01 : quota global fail-closed, AVANT toute résolution de token / écriture.
    const quota = await globalQuota(supabase, "weather_unsubscribe", UNSUB_QUOTA_HOUR, UNSUB_QUOTA_DAY);
    if (!quota.ok) {
      return new Response(
        JSON.stringify({
          error: quota.reason === "error"
            ? "Service temporairement indisponible"
            : "Trop de demandes. Merci de réessayer plus tard.",
        }),
        {
          status: quota.reason === "error" ? 503 : 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }


    // Token resolution is handled entirely inside the SECURITY DEFINER RPCs
    // (public_link_tokens hash lookup + legacy hash fallback).
    if (action === "delete") {
      const { data: deleteResult, error: deleteError } = await supabase
        .rpc("delete_weather_subscription", { p_token: token });

      if (deleteError) {
        console.error("Error deleting subscription:", deleteError);
        throw deleteError;
      }

      if (!deleteResult) {
        return new Response(
          JSON.stringify({ error: "Abonnement non trouvé" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Weather subscription deleted");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Abonnement supprimé définitivement"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const { data: unsubResult, error: unsubError } = await supabase
        .rpc("unsubscribe_weather_alert", { p_token: token });

      if (unsubError) {
        console.error("Error unsubscribing:", unsubError);
        throw unsubError;
      }

      if (!unsubResult) {
        // Either already disabled or unknown token — never disclose which.
        return new Response(
          JSON.stringify({
            success: true,
            message: "Vous êtes déjà désabonné",
            alreadyUnsubscribed: true
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Weather subscription disabled");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Désabonnement effectué avec succès"
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
