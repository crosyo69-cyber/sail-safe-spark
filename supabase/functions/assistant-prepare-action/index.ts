import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MODEL = "google/gemini-2.5-flash";

const ACTION_BRIEF: Record<string, string> = {
  campagne_brevo: "campagne marketing générale auprès des clients consentants",
  relance_credits: "relance des clients dont les crédits de séance expirent bientôt (les inciter à réserver avant expiration)",
  relance_inactifs: "réactivation de clients qui n'ont pas réservé depuis plusieurs mois",
  campagne_meteo: "annonce d'une fenêtre météo favorable pour venir naviguer",
  promo_stage: "promotion du Stage 100 % Glisse",
  derniere_minute: "offre dernière minute sur des places restantes",
  export_csv: "export CSV du segment (pas d'email, décrire simplement le contenu de l'export)",
  rapport_pdf: "rapport PDF de synthèse pour le directeur (pas d'email)",
};

const SYSTEM = `Tu rédiges des brouillons d'emails marketing pour KiteSurf Passion, école de kitesurf, wingfoil, pumpfoil et foil tracté à Hyères (Almanarre / Carqueiranne), dirigée par Yoanne Cros.
Ton : expert, chaleureux, vouvoiement, concret (données réelles, pas de superlatifs creux). Français impeccable.
Aucune promesse de remboursement ni d'engagement contractuel. Mentionne la licence FFVL uniquement si c'est pertinent.
Réponds STRICTEMENT en JSON, sans texte autour, avec les clés :
{"title","subject","preheader","text","html","cta_label","cta_url","justification","priority"}
- title : nom interne court de l'action.
- subject : max 60 caractères, sans emoji excessif.
- preheader : max 110 caractères.
- text : version texte brut (4-8 lignes).
- html : HTML email simple et responsive (inline styles, couleurs marque #0F172A navy, #0891B2 bleu océan, #F97316 orange), sans <html> ni <head>, un seul bouton CTA orange.
- cta_url : une URL du site https://www.kitesurfpassion.fr (ex : /reserver, /tarifs, /stage-100-glisse).
- justification : pourquoi cette action est pertinente maintenant (1-2 phrases, appuyée sur le contexte fourni).
- priority : "haute", "normale" ou "basse".`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Authentification requise" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return json(401, { error: "Session invalide" });

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json(403, { error: "Réservé aux administrateurs" });

    const body = await req.json().catch(() => ({}));
    const actionType = String(body.action_type ?? "");
    if (!(actionType in ACTION_BRIEF)) return json(400, { error: `Type d'action inconnu : ${actionType}` });

    const params = (body.params ?? {}) as Record<string, unknown>;
    const context = typeof body.context === "string" ? body.context.slice(0, 2000) : "";

    let content: Record<string, unknown> = {};
    let priority = typeof params.priority === "string" ? params.priority : "normale";
    let justification = typeof params.justification === "string" ? params.justification : "";

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (apiKey) {
      const prompt = `Objectif : ${ACTION_BRIEF[actionType]}.
Contexte fourni par le cockpit : ${context || "aucun"}.
Paramètres : ${JSON.stringify(params)}.
Date du jour : ${new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}.`;

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });

      if (resp.status === 429) return json(429, { error: "Trop de requêtes, réessayez dans un instant." });
      if (resp.status === 402) return json(402, { error: "Crédits IA épuisés. Rechargez l'espace de travail Lovable AI." });

      if (resp.ok) {
        const data = await resp.json();
        const raw = data?.choices?.[0]?.message?.content ?? "{}";
        try {
          content = JSON.parse(raw);
        } catch {
          const m = String(raw).match(/\{[\s\S]*\}/);
          content = m ? JSON.parse(m[0]) : {};
        }
        if (typeof content.priority === "string") priority = content.priority;
        if (typeof content.justification === "string") justification = content.justification;
      } else {
        console.error("AI gateway error", resp.status, await resp.text());
      }
    }

    // Couche unique de préparation : la logique métier (segment, audience, journalisation) reste en base.
    const { data: prepared, error } = await supabase.rpc("assistant_prepare_action", {
      p_action_type: actionType,
      p_params: {
        ...params,
        title: content.title ?? params.title ?? null,
        priority,
        justification,
        source: body.source ?? "cockpit",
        content: {
          subject: content.subject ?? null,
          preheader: content.preheader ?? null,
          text: content.text ?? null,
          html: content.html ?? null,
          cta_label: content.cta_label ?? "Réserver ma session",
          cta_url: content.cta_url ?? "https://www.kitesurfpassion.fr/reserver",
        },
      },
    });

    if (error) {
      console.error("assistant_prepare_action error", error.message);
      return json(400, { error: error.message });
    }

    return json(200, { action: prepared, sent: false });
  } catch (e) {
    console.error("assistant-prepare-action error", e);
    return json(500, { error: e instanceof Error ? e.message : "Erreur inconnue" });
  }
});
