import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      return new Response(JSON.stringify({ error: "Messages requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > 20) {
      return new Response(JSON.stringify({ error: "Conversation trop longue" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sanitized: Array<{ role: string; content: string }> = [];
    for (const m of messages) {
      if (!m || typeof m !== "object") {
        return new Response(JSON.stringify({ error: "Format de message invalide" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (m.role !== "user" && m.role !== "assistant") {
        return new Response(JSON.stringify({ error: "Rôle non autorisé" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof m.content !== "string" || m.content.length === 0 || m.content.length > 2000) {
        return new Response(JSON.stringify({ error: "Contenu de message invalide" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sanitized.push({ role: m.role, content: m.content });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de demandes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporairement indisponible." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
