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

const SYSTEM_PROMPT = `Tu es l'Assistant du Directeur de KiteSurf Passion (école de kitesurf, wingfoil, pumpfoil et foil tracté à Hyères).
Tu assistes UNIQUEMENT les administrateurs de l'école.

## Règle absolue : LECTURE SEULE
Tu ne peux QUE lire des données via l'outil \`assistant_query\`. Tu ne peux exécuter AUCUNE action :
pas d'email, pas de SMS, pas de campagne, pas de réservation, pas de recrédit, pas de modification ni de suppression.
Si l'administrateur demande une action (envoyer un email, modifier une réservation, recréditer, supprimer, créer une campagne, lancer une automatisation),
réponds exactement : « Je peux préparer cette action mais je ne peux pas encore l'exécuter. » puis décris précisément ce que tu ferais
(destinataires estimés, contenu proposé, données concernées) en t'appuyant sur les données lues.

## Méthode
- Appelle systématiquement \`assistant_query\` avant de donner un chiffre. N'invente jamais de données.
- Tu peux enchaîner plusieurs appels pour croiser les informations.
- Vocabulaire financier OBLIGATOIRE (via l'intention \`finances\`) : ne dis jamais « CA » sans le qualifier. Distingue toujours :
  1. **Acomptes encaissés** = argent réellement encaissé via Stripe.
  2. **Valeur des prestations réservées** = valeur des réservations confirmées aux tarifs catalogue (hors acomptes).
  3. **Solde restant à encaisser** = prestations − acomptes, avec le nombre de clients concernés.
  4. **Valeur des crédits disponibles** = séances achetées non encore consommées.
  Si l'administrateur demande « quel est mon chiffre d'affaires ? », appelle \`finances\` et donne les trois premiers montants, puis explique la différence en une phrase.
- Réponds en français, en Markdown, avec des tableaux dès qu'il y a plusieurs lignes, et une phrase de synthèse.
- Ne cite les données personnelles (email, téléphone, nom) que si elles sont nécessaires à la question posée. Privilégie les agrégats.
- Si l'outil renvoie une liste vide, dis-le clairement plutôt que d'extrapoler.
- Date du jour : {{TODAY}}.`;

const TOOL_INTENTS: Record<string, string> = {
  reservations: "Nombre de réservations et de participants confirmés sur une période (today, tomorrow, week, month, year, all) et par activité.",
  reservations_detail: "Détail journée par journée des groupes sur une période (date, activité, capacité, inscrits).",
  journees_completes: "Journées à venir avec taux de remplissage, places restantes et statut complet/ouvert (paramètre days).",
  business: "Chiffre d'affaires (acomptes), transactions, participants, panier moyen, CA par activité, packs vendus sur une période.",
  remplissage: "Taux de remplissage global (capacité vs places occupées) sur une période.",
  crm_stats: "Statistiques CRM : clients totaux, nouveaux, actifs, inactifs, prospects, consentement marketing, crédits restants.",
  top_clients: "Meilleurs clients par chiffre d'affaires (paramètre limit).",
  clients_a_relancer: "Clients à relancer : crédits bientôt expirés (paramètre days) ou inactifs.",
  credits: "Synthèse des crédits FIFO : disponibles, consommés, expirés, expirant dans X jours, par activité, recrédits.",
  credits_expirant: "Liste des crédits qui expirent dans les X prochains jours, par client et activité.",
  packs: "Packs clients créés sur une période (code, activité, séances, statut, acompte).",
  marketing: "Campagnes marketing récentes, segments enregistrés, contacts consentants, emails envoyés/en erreur sur 30 jours.",
  automatisations: "Automatisations marketing (actives, déclencheurs, prochaines exécutions) et derniers runs.",
  meilleure_activite: "Classement des activités par participants et CA sur une période.",
  liste_attente: "Personnes en liste d'attente pour les journées à venir.",
  finances: "Cockpit financier complet : acomptes encaissés (jour/mois/saison/N-1), valeur des prestations réservées, solde restant à encaisser, valeur des crédits disponibles et répartition. À utiliser pour toute question de chiffre d'affaires.",
};

const tools = [
  {
    type: "function",
    function: {
      name: "assistant_query",
      description:
        "Couche de lecture sécurisée unique. Retourne des données agrégées en lecture seule. Intentions disponibles :\n" +
        Object.entries(TOOL_INTENTS).map(([k, v]) => `- ${k} : ${v}`).join("\n"),
      parameters: {
        type: "object",
        properties: {
          intent: { type: "string", enum: Object.keys(TOOL_INTENTS) },
          period: {
            type: "string",
            enum: ["today", "tomorrow", "week", "month", "year", "all"],
            description: "Période analysée (défaut: month).",
          },
          start: { type: "string", description: "Date de début YYYY-MM-DD (optionnel, prioritaire sur period)." },
          end: { type: "string", description: "Date de fin YYYY-MM-DD (optionnel)." },
          activity: {
            type: "string",
            enum: ["kitesurf", "wingfoil", "pumpfoil", "foil_tracte", "stage_100_glisse"],
            description: "Filtre activité (optionnel).",
          },
          days: { type: "number", description: "Horizon en jours (défaut 30)." },
          limit: { type: "number", description: "Nombre de lignes max (défaut 10, max 50)." },
        },
        required: ["intent"],
        additionalProperties: false,
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { error: "Authentification requise", type: "unauthorized" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return json(401, { error: "Session invalide", type: "unauthorized" });

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json(403, { error: "Réservé aux administrateurs", type: "forbidden" });

    const body = await req.json().catch(() => ({}));
    const history = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
    if (history.length === 0) return json(400, { error: "Aucun message", type: "bad_request" });

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json(500, { error: "Assistant non configuré", type: "service_error" });

    const today = new Date().toLocaleDateString("fr-FR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Paris",
    });

    const messages: Record<string, unknown>[] = [
      { role: "system", content: SYSTEM_PROMPT.replace("{{TODAY}}", today) },
      ...history.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
    ];

    const usedIntents: Record<string, unknown>[] = [];
    let answer = "";

    for (let step = 0; step < 6; step++) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
        body: JSON.stringify({ model: MODEL, messages, tools, tool_choice: "auto" }),
      });

      if (resp.status === 429) return json(429, { error: "Trop de requêtes, réessayez dans un instant.", type: "rate_limit" });
      if (resp.status === 402) return json(402, { error: "Crédits IA épuisés.", type: "credits_exhausted" });
      if (!resp.ok) {
        const detail = await resp.text();
        console.error("gateway error", resp.status, detail);
        return json(502, { error: "Le service IA est indisponible.", type: "service_error" });
      }

      const data = await resp.json();
      const choice = data.choices?.[0];
      const message = choice?.message;
      const toolCalls = message?.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        answer = message?.content ?? "";
        break;
      }

      messages.push(message);

      for (const call of toolCalls) {
        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(call.function?.arguments ?? "{}");
        } catch {
          payload = {};
        }
        const intent = String(payload.intent ?? "");
        const params: Record<string, unknown> = {};
        for (const key of ["period", "start", "end", "activity", "days", "limit"]) {
          if (payload[key] !== undefined && payload[key] !== null) params[key] = payload[key];
        }

        let content: string;
        if (!intent || !(intent in TOOL_INTENTS)) {
          content = JSON.stringify({ error: `Intention non autorisée: ${intent}` });
        } else {
          const { data: result, error } = intent === "finances"
            ? await supabase.rpc("assistant_financial_summary")
            : await supabase.rpc("assistant_query", { p_intent: intent, p_params: params });
          if (error) {
            console.error("assistant tool error", intent, error.message);
            content = JSON.stringify({ error: error.message });
          } else {
            content = JSON.stringify(result);
          }
          usedIntents.push({ intent, params });
        }

        messages.push({ role: "tool", tool_call_id: call.id, content });
      }
    }

    if (!answer) answer = "Je n'ai pas réussi à formuler une réponse à partir des données disponibles.";

    await supabase.from("assistant_conversations").insert({
      user_id: user.id,
      user_email: user.email,
      question: history[history.length - 1]?.content ?? "",
      answer,
      intents: usedIntents,
    });

    return json(200, { answer, intents: usedIntents });
  } catch (e) {
    console.error("admin-assistant fatal", e);
    return json(500, { error: "Erreur technique de l'assistant", type: "technical_error" });
  }
});
