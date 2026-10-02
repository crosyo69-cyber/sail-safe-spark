import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchWithTimeout, guardedStream, rateLimitKeys } from "../_shared/ai-guards.ts";

// F-23-01/02 — plafonds serveur (le prompt n'est pas une frontière de sécurité).
const MAX_OUTPUT_TOKENS = 400;
const UPSTREAM_TIMEOUT_MS = 20_000;
const STREAM_TIMEOUT_MS = 60_000;
// Quotas globaux : COST NOT VERIFIED (tarif provider inconnu) → bornes techniques
// dimensionnées largement au-dessus du trafic public observé d'une école de kite.
const GLOBAL_HOURLY_LIMIT = 300;
const GLOBAL_DAILY_LIMIT = 1500;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const errorResponse = (status: number, type: string, message: string) =>
  new Response(JSON.stringify({ error: message, type }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// E-2-FIX / F-23-01 : clé de rate-limit jamais vide, et jamais dérivée d'une
// seule valeur contrôlable par le client (cf. ../_shared/ai-guards.ts).




const SYSTEM_PROMPT = `Tu es l'assistant virtuel de Kitesurf Passion, école de kitesurf à Hyères-les-Palmiers (plage de l'Almanarre), Var (83), dirigée par Yohan Cros, moniteur diplômé d'État BPJEPS depuis 2001.

## Activités proposées
- **Kitesurf** : Cours collectifs, stages 100% Glisse (5 jours), cours particuliers, sessions à la carte
- **Wingfoil** : Stage initiation 5 jours, cours 2h30
- **Pump Foil / Dock Start** : Cours 1h30 (3 pers. max)
- **Foil Tracté** : Sessions 20 min ou 40 min
- **Wakeboard** : Sessions 15 min
- **Déposes en Mer** : Déposes bateau pour kitesurfeurs autonomes
- **Location matériel** : Ailes, foils, planches, combis, harnais, casques, gilets

## Tarifs principaux (Haute saison / Basse saison)
### Kitesurf
- Stage 100% Glisse (5 jours) : 499€ / 399€ ⭐ Populaire
- Stage Semi-Privé (2 pers., 5 jours) : 699€ / 599€
- 1 Cours Collectif : 130€ / 120€
- 3 Cours Collectifs : 360€ / 330€
- 5 Cours Collectifs : 570€ / 500€
- Cours Particulier (2h) : 380€ / 230€

### Wingfoil
- Stage Initiation (5 jours) : 520€ / 440€ ⭐ Populaire
- Cours 2h30 : 110€ / 90€

### Pump Foil
- Pump Foil / Dock Start (1h30, 3 pers. max) : 50€ ⭐ Populaire

### Foil Tracté
- 20 min : 50€
- 40 min : 80€ ⭐ Populaire

### Wakeboard
- 15 min : 40€ ⭐ Populaire

### Déposes en Mer
- 1 dépose : 45€
- Location + Dépose : 80€ ⭐ Populaire
- Carnet 10 déposes : 300€

### Location matériel (à la journée)
- Aile kitesurf : 30€, Foil : 20€, Planche Twin Tip : 10€, Combi 5/3 : 10€, Harnais : 5€, Casque : 3€, Gilet : 2€

## Inclus dans tous les cours
- Tout le matériel fourni (aile, planche, combinaison, casque, gilet)
- Bateau d'assistance permanent
- Assurance responsabilité civile
- Moniteur diplômé d'État BPJEPS
- Photos de vos sessions (sur demande)

## Le spot de l'Almanarre
- Plage de l'Almanarre à Hyères, un des meilleurs spots de France
- Vent dominant : Mistral (NW) et vent d'Est
- Plan d'eau plat idéal pour débuter
- Saison : d'avril à novembre

## Infos pratiques
- Contact : page /contact-reservation-kitesurf-hyeres
- Tarifs détaillés : page /tarifs-cours-kitesurf-wingfoil-hyeres
- Pour réserver, diriger vers la page contact ou le téléphone
- Haute saison : juillet-août. Basse saison : avril-juin, septembre-novembre

## Licence FFVL
- **IMPORTANT** : La licence FFVL est OBLIGATOIRE pour toutes les activités. Elle peut être souscrite sur place le jour même.
- Mentionne cette obligation si quelqu'un pose des questions sur les prérequis, ce qu'il faut amener, ou la réservation.

## Règles de réponse
- Réponds UNIQUEMENT en français, de manière chaleureuse et professionnelle
- Sois concis (2-4 phrases max sauf si le détail est demandé)
- Si on te pose des questions hors-sujet (pas liées aux activités nautiques, au spot ou à l'école), réponds poliment que tu ne peux aider que sur les sujets liés à Kitesurf Passion
- Guide vers la réservation quand c'est pertinent
- Utilise des emojis avec parcimonie (🪁 🏄 💨 🌊)
- Ne mentionne JAMAIS que tu es une IA ou un chatbot, présente-toi comme l'assistant de Kitesurf Passion`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    // Input validation: prevent token-burn abuse and prompt injection via roles
    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse(400, "bad_request", "Messages requis");
    }
    if (messages.length > 20) {
      return errorResponse(400, "bad_request", "Conversation trop longue");
    }
    const sanitized: Array<{ role: string; content: string }> = [];
    for (const m of messages) {
      if (!m || typeof m !== "object") {
        return errorResponse(400, "bad_request", "Format de message invalide");
      }
      if (m.role !== "user" && m.role !== "assistant") {
        return errorResponse(400, "bad_request", "Rôle non autorisé");
      }
      if (typeof m.content !== "string" || m.content.length === 0 || m.content.length > 2000) {
        return errorResponse(400, "bad_request", "Contenu de message invalide");
      }
      sanitized.push({ role: m.role, content: m.content });
    }

    // E-2-FIX : rate-limit serveur AVANT tout appel au gateway IA (coût provider).
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const keys = rateLimitKeys(req);
    // F-23-01 : 1) limites par IP déclarée (héritées), 2) limites par dernier
    // proxy observé, 3) quotas globaux insensibles à la rotation d'IP.
    for (const [context, key, limit, window] of [
      ["chatbot_burst", keys.ip, 5, "10 seconds"],
      ["chatbot_msg", keys.ip, 20, "1 minute"],
      ["chatbot_edge_burst", keys.edge, 10, "10 seconds"],
      ["chatbot_edge_msg", keys.edge, 40, "1 minute"],
    ] as const) {
      const { data: allowed, error: guardErr } = await supabase.rpc("public_rate_guard", {
        p_context: context,
        p_key: key,
        p_limit: limit,
        p_window: window,
      });
      if (guardErr) {
        console.error("rate guard unavailable", context, guardErr.message);
        return errorResponse(503, "service_error", "Service temporairement indisponible");
      }
      if (allowed !== true) {
        return errorResponse(429, "rate_limit", "Trop de demandes, réessayez dans quelques instants.");
      }
    }

    // Quota global fail-closed : seconde barrière indépendante de toute valeur
    // fournie par le client (anti Denial of Wallet). COST NOT VERIFIED.
    for (const [context, limit, window] of [
      ["chatbot_global_hour", GLOBAL_HOURLY_LIMIT, "1 hour"],
      ["chatbot_global_day", GLOBAL_DAILY_LIMIT, "24 hours"],
    ] as const) {
      const { data: allowed, error: quotaErr } = await supabase.rpc("public_quota_guard", {
        p_context: context,
        p_limit: limit,
        p_window: window,
      });
      if (quotaErr) {
        console.error("quota guard unavailable", context, quotaErr.message);
        return errorResponse(503, "service_error", "Service temporairement indisponible");
      }
      if (allowed !== true) {
        return errorResponse(429, "rate_limit", "Assistant très sollicité, réessayez plus tard.");
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let response: Response;
    try {
      response = await fetchWithTimeout(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...sanitized,
            ],
            stream: true,
            max_tokens: MAX_OUTPUT_TOKENS,
          }),
        },
        UPSTREAM_TIMEOUT_MS,
      );
    } catch (err) {
      // Timeout / erreur réseau : aucune relance automatique, erreur générique.
      console.error("AI gateway unreachable", err instanceof Error ? err.name : "unknown");
      return errorResponse(504, "service_error", "Le service met trop de temps à répondre.");
    }

    if (!response.ok) {
      if (response.status === 429) {
        return errorResponse(429, "rate_limit", "Trop de demandes, réessayez dans quelques instants.");
      }
      if (response.status === 402) {
        return errorResponse(402, "credits_exhausted", "Crédits IA épuisés");
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return errorResponse(500, "service_error", "Erreur du service IA");
    }

    if (!response.body) {
      return errorResponse(502, "service_error", "Réponse IA invalide");
    }

    // F-23-02 : le flux est borné dans le temps et annulé si le client se déconnecte.
    return new Response(guardedStream(response.body, STREAM_TIMEOUT_MS), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chatbot error:", e);
    // Aucun détail interne (fournisseur, clé, stack) renvoyé au client.
    return errorResponse(500, "technical_error", "Erreur technique de l'assistant");
  }
});
