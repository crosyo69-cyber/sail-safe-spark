import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};


// Vérifie qu'un JWT bearer porte le rôle service_role (cron/admin scripts).
// Compare claim.role plutôt que la valeur brute du SUPABASE_SERVICE_ROLE_KEY
// car la clé fournie par le vault/cron peut être un JWT distinct signé par
// le même provider Supabase.
function isServiceRoleJwt(token: string): boolean {
  const parts = token.split(".");
  if (parts.length < 2) return false;
  try {
    const padded = parts[1].replaceAll("-", "+").replaceAll("_", "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const claims = JSON.parse(atob(padded)) as { role?: string; exp?: number };
    if (claims.role !== "service_role") return false;
    if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Restrict to service-role callers (cron / admin scripts).
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!token || !isServiceRoleJwt(token)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("page_404_logs")
      .delete()
      .lt("created_at", thirtyDaysAgo)
      .select("id");

    if (error) throw error;

    const deletedCount = data?.length ?? 0;
    console.log(`Purged ${deletedCount} old 404 logs`);

    return new Response(
      JSON.stringify({ success: true, deleted: deletedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("cleanup-404-logs error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
