// F-29-03 — tests simulés : aucun appel réseau réel, aucun envoi, aucune base.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  fetchForecast, isFresh, parisTomorrow, parseForecast, resolve, type CacheRow,
} from "../weather-forecast/logic.ts";

const T = "2026-10-11";
function payload(date = T, hours = 24, mutate?: (h: any) => void) {
  const time: string[] = [], w: (number | null)[] = [], g: (number | null)[] = [], d: (number | null)[] = [];
  for (let i = 0; i < hours; i++) {
    time.push(`${date}T${String(i).padStart(2, "0")}:00`); w.push(12); g.push(18); d.push(270);
  }
  const hourly = { time, wind_speed_10m: w, wind_gusts_10m: g, wind_direction_10m: d };
  mutate?.(hourly);
  return {
    timezone: "Europe/Paris",
    hourly_units: { time: "iso8601", wind_speed_10m: "kn", wind_gusts_10m: "kn", wind_direction_10m: "°" },
    hourly,
  };
}
const mockFetch = (impl: () => Promise<Response>) => (() => impl()) as unknown as typeof fetch;
const NOW = new Date("2026-10-10T12:00:00Z");

Deno.test("réponse valide → ok, 24 heures du lendemain uniquement", () => {
  const p = payload();
  p.hourly.time.push("2026-10-12T00:00"); p.hourly.wind_speed_10m.push(5);
  p.hourly.wind_gusts_10m.push(5); p.hourly.wind_direction_10m.push(5);
  const r = parseForecast(p, T);
  assert(r.ok); assertEquals(r.status, "ok"); assertEquals(r.hourly.length, 24);
});

Deno.test("erreur HTTP → échec explicite", async () => {
  const r = await fetchForecast(T, mockFetch(async () => new Response("x", { status: 503 })));
  assertEquals(r, { ok: false, error: "Open-Meteo HTTP 503" });
});

Deno.test("délai dépassé → échec explicite", async () => {
  const slow = ((_u: string, init: RequestInit) => new Promise<Response>((_, rej) => {
    init.signal!.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
  })) as unknown as typeof fetch;
  const r = await fetchForecast(T, slow, 20);
  assertEquals(r, { ok: false, error: "Délai d'attente dépassé" });
});

Deno.test("données horaires manquantes → échec", () => {
  const p: any = payload(); delete p.hourly;
  assertEquals(parseForecast(p, T).ok, false);
  assertEquals(parseForecast(payload("2026-10-12"), T).ok, false);
});

Deno.test("réponse partiellement invalide → incomplete, jamais 0 nœud inventé", () => {
  const r = parseForecast(payload(T, 24, (h) => { h.wind_speed_10m[10] = null; h.wind_gusts_10m[11] = -3; }), T);
  assert(r.ok); assertEquals(r.status, "incomplete");
  assertEquals(r.hourly[10].wind_kn, null); assertEquals(r.hourly[11].gust_kn, null);
  assertEquals(parseForecast(payload(T, 12), T).ok && (parseForecast(payload(T, 12), T) as any).status, "incomplete");
});

Deno.test("unités ou fuseau inattendus → rejet", () => {
  const p: any = payload(); p.hourly_units.wind_speed_10m = "km/h";
  assertEquals(parseForecast(p, T).ok, false);
  const q: any = payload(); q.timezone = "GMT";
  assertEquals(parseForecast(q, T).ok, false);
});

Deno.test("lendemain Europe/Paris, y compris changements d'heure et minuit", () => {
  assertEquals(parisTomorrow(new Date("2026-10-10T12:00:00Z")), "2026-10-11");
  assertEquals(parisTomorrow(new Date("2026-10-10T22:30:00Z")), "2026-10-12"); // 00:30 Paris le 11
  assertEquals(parisTomorrow(new Date("2026-03-28T23:30:00Z")), "2026-03-30"); // nuit passage été
  assertEquals(parisTomorrow(new Date("2026-10-24T22:30:00Z")), "2026-10-26"); // veille passage hiver
  assertEquals(parisTomorrow(new Date("2026-12-31T22:59:00Z")), "2027-01-01");
  // jour à 23 h acceptées comme complet
  const r = parseForecast(payload("2026-03-29", 23), "2026-03-29");
  assert(r.ok); assertEquals(r.status, "ok");
});

const cache = (minsAgo: number, status: CacheRow["status"] = "ok"): CacheRow => ({
  forecast_date: T, status, last_error: null,
  fetched_at: new Date(NOW.getTime() - minsAgo * 60_000).toISOString(),
  hourly: [{ time: `${T}T10:00`, wind_kn: 15, gust_kn: 20, direction_deg: 90 }],
});

Deno.test("cache frais → pas de récupération, état fresh", () => {
  assert(isFresh(cache(30), NOW, 120));
  const { view, write } = resolve(T, cache(30), null, NOW, 120);
  assertEquals(view.state, "fresh"); assertEquals(view.from_cache, true); assertEquals(write, null);
});

Deno.test("cache périmé + récupération réussie → fresh et écriture", () => {
  assertEquals(isFresh(cache(180), NOW, 120), false);
  const ok = parseForecast(payload(), T);
  const { view, write } = resolve(T, cache(180), ok, NOW, 120);
  assertEquals(view.state, "fresh"); assertEquals(view.hourly.length, 24);
  assertEquals(write!.fetched_at, NOW.toISOString());
});

Deno.test("cache périmé + récupération échouée → stale, anciennes données et heure conservées", () => {
  const old = cache(180);
  const { view, write } = resolve(T, old, { ok: false, error: "Open-Meteo HTTP 500" }, NOW, 120);
  assertEquals(view.state, "stale"); assertEquals(view.fetched_at, old.fetched_at);
  assertEquals(view.error, "Open-Meteo HTTP 500"); assertEquals(write!.hourly, old.hourly);
});

Deno.test("aucune donnée valide → unavailable, liste vide", () => {
  const { view } = resolve(T, null, { ok: false, error: "Open-Meteo injoignable" }, NOW, 120);
  assertEquals(view.state, "unavailable"); assertEquals(view.hourly, []);
  // un cache d'une autre date n'est jamais servi comme prévision de demain
  const other = { ...cache(10), forecast_date: "2026-10-10" };
  assertEquals(resolve(T, other, { ok: false, error: "x" }, NOW, 120).view.state, "unavailable");
});
