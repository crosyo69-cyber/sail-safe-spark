// Resoumet le sitemap kitesurfpassion.fr à Google Search Console.
// Appelé chaque jour par un cron pg_cron pour signaler les mises à jour
// d'articles (lastmod) et déclencher un recrawl prioritaire.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_search_console";
const SITE_PROPERTY = "sc-domain:kitesurfpassion.fr";
const SITEMAP_URL = "https://www.kitesurfpassion.fr/sitemap.xml";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Restrict to service-role callers (pg_cron).
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!token || !serviceKey || token !== serviceKey) {
    return json({ ok: false, error: "Forbidden" }, 403);
  }

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");

  if (!lovableKey) {
    return json({ ok: false, error: "LOVABLE_API_KEY missing" }, 500);
  }
  if (!gscKey) {
    return json({ ok: false, error: "GOOGLE_SEARCH_CONSOLE_API_KEY missing" }, 500);
  }

  const siteEnc = encodeURIComponent(SITE_PROPERTY);
  const sitemapEnc = encodeURIComponent(SITEMAP_URL);

  // 1. Resoumettre le sitemap (PUT — Google le re-télécharge)
  const putUrl = `${GATEWAY_URL}/webmasters/v3/sites/${siteEnc}/sitemaps/${sitemapEnc}`;
  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gscKey,
    },
  });

  if (!putRes.ok && putRes.status !== 204) {
    const body = await putRes.text();
    console.error("[resubmit-sitemap-gsc] PUT failed", putRes.status, body);
    return json({ ok: false, step: "submit", status: putRes.status, body }, 502);
  }

  // 2. Lire le statut pour confirmation
  const getRes = await fetch(putUrl, {
    headers: {
      "Authorization": `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gscKey,
    },
  });

  let status: unknown = null;
  if (getRes.ok) {
    status = await getRes.json();
  }

  console.log("[resubmit-sitemap-gsc] OK", JSON.stringify(status));

  return json({
    ok: true,
    submitted_at: new Date().toISOString(),
    sitemap: SITEMAP_URL,
    property: SITE_PROPERTY,
    status,
  });
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}