// F-29-03 — Prévisions du lendemain (Almanarre), réservé aux administrateurs.
// Lecture seule pour le métier : aucun envoi, aucune réservation modifiée,
// aucune décision automatique de cours.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ALMANARRE, DEFAULT_TTL_MINUTES, fetchForecast, isFresh, parisTomorrow, resolve,
  type CacheRow,
} from "./logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const force = body && typeof body === "object" && (body as { force?: unknown }).force === true;

    const ttlRaw = Number(Deno.env.get("WEATHER_FORECAST_TTL_MINUTES"));
    const ttl = Number.isFinite(ttlRaw) && ttlRaw >= 5 && ttlRaw <= 1440 ? ttlRaw : DEFAULT_TTL_MINUTES;

    const admin = createClient(url, serviceKey);
    const now = new Date();
    const target = parisTomorrow(now);

    const { data: cachedRow } = await admin
      .from("weather_forecast_cache")
      .select("forecast_date, fetched_at, hourly, status, last_error, last_attempt_at")
      .eq("forecast_date", target).eq("location", ALMANARRE.key).maybeSingle();
    const cached = (cachedRow ?? null) as CacheRow | null;

    const attempt = !force && isFresh(cached, now, ttl) ? null : await fetchForecast(target);
    const { view, write } = resolve(target, cached, attempt, now, ttl);

    if (write) {
      const { error } = await admin.from("weather_forecast_cache")
        .upsert({ ...write, location: ALMANARRE.key }, { onConflict: "forecast_date,location" });
      if (error) console.error("weather_forecast_cache upsert failed:", error.message);
    }
    return json(view);
  } catch (e) {
    console.error("weather-forecast error:", (e as Error).message);
    return json({ error: "Erreur interne" }, 500);
  }
});
