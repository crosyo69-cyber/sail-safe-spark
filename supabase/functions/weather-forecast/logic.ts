// F-29-03 — Logique pure des prévisions du lendemain (aucun accès réseau ni base).
// Testable sans effet de bord. Aucune règle "cours possible / impossible".

export const ALMANARRE = { key: "almanarre", lat: 43.0667, lon: 6.1333 } as const;
export const TZ = "Europe/Paris";
export const DEFAULT_TTL_MINUTES = 120;
export const MIN_COMPLETE_HOURS = 23; // jour de passage à l'heure d'été = 23 h locales

export interface HourPoint {
  time: string; // "YYYY-MM-DDTHH:mm" heure locale Europe/Paris
  wind_kn: number | null;
  gust_kn: number | null;
  direction_deg: number | null;
}

export type ForecastState = "fresh" | "stale" | "incomplete" | "unavailable";

export interface CacheRow {
  forecast_date: string;
  fetched_at: string | null;
  hourly: HourPoint[] | null;
  status: "ok" | "incomplete" | "unavailable";
  last_error: string | null;
  last_attempt_at?: string | null;
}

/** Date locale Europe/Paris (YYYY-MM-DD) du lendemain de `now`, sans supposer d'offset. */
export function parisTomorrow(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const d = new Date(Date.UTC(get("year"), get("month") - 1, get("day") + 1));
  return d.toISOString().slice(0, 10);
}

export function buildForecastUrl(): string {
  const p = new URLSearchParams({
    latitude: String(ALMANARRE.lat),
    longitude: String(ALMANARRE.lon),
    hourly: "wind_speed_10m,wind_gusts_10m,wind_direction_10m",
    wind_speed_unit: "kn",
    timezone: TZ,
    forecast_days: "3",
  });
  return `https://api.open-meteo.com/v1/forecast?${p.toString()}`;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export type ParseResult =
  | { ok: true; status: "ok" | "incomplete"; hourly: HourPoint[]; issues: string[] }
  | { ok: false; error: string };

/** Valide la structure, les unités, le fuseau et extrait les heures du jour cible. */
export function parseForecast(json: unknown, targetDate: string): ParseResult {
  if (!json || typeof json !== "object") return { ok: false, error: "Réponse vide ou non JSON" };
  const j = json as Record<string, any>;
  if (j.error) return { ok: false, error: `Erreur fournisseur : ${String(j.reason ?? "inconnue")}` };
  if (j.timezone !== TZ) return { ok: false, error: `Fuseau inattendu : ${String(j.timezone)}` };
  const u = j.hourly_units ?? {};
  if (u.wind_speed_10m !== "kn" || u.wind_gusts_10m !== "kn") {
    return { ok: false, error: "Unités de vent inattendues (nœuds attendus)" };
  }
  if (u.wind_direction_10m !== "°") return { ok: false, error: "Unité de direction inattendue" };
  const h = j.hourly;
  if (!h || !Array.isArray(h.time) || !Array.isArray(h.wind_speed_10m)
    || !Array.isArray(h.wind_gusts_10m) || !Array.isArray(h.wind_direction_10m)) {
    return { ok: false, error: "Structure horaire absente ou invalide" };
  }
  const n = h.time.length;
  if (h.wind_speed_10m.length !== n || h.wind_gusts_10m.length !== n || h.wind_direction_10m.length !== n) {
    return { ok: false, error: "Séries horaires de longueurs différentes" };
  }
  const hourly: HourPoint[] = [];
  for (let i = 0; i < n; i++) {
    const t = h.time[i];
    if (typeof t !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)) {
      return { ok: false, error: "Horodatage invalide" };
    }
    if (!t.startsWith(targetDate)) continue;
    const pick = (v: unknown, max: number) => (isNum(v) && v >= 0 && v <= max ? v : null);
    hourly.push({
      time: t,
      wind_kn: pick(h.wind_speed_10m[i], 200),
      gust_kn: pick(h.wind_gusts_10m[i], 250),
      direction_deg: pick(h.wind_direction_10m[i], 360),
    });
  }
  if (hourly.length === 0) return { ok: false, error: `Aucune heure pour le ${targetDate}` };
  const issues: string[] = [];
  if (hourly.length < MIN_COMPLETE_HOURS) issues.push(`${hourly.length} heures reçues sur 24`);
  const missing = hourly.filter((p) => p.wind_kn === null || p.gust_kn === null || p.direction_deg === null).length;
  if (missing > 0) issues.push(`${missing} heure(s) avec valeur manquante ou invalide`);
  return { ok: true, status: issues.length ? "incomplete" : "ok", hourly, issues };
}

export function isFresh(row: CacheRow | null, now: Date, ttlMinutes: number): boolean {
  if (!row?.fetched_at || !row.hourly?.length || row.status === "unavailable") return false;
  return now.getTime() - new Date(row.fetched_at).getTime() < ttlMinutes * 60_000;
}

export interface ForecastView {
  forecast_date: string;
  state: ForecastState;
  fetched_at: string | null;
  hourly: HourPoint[];
  error: string | null;
  issues: string[];
  ttl_minutes: number;
  from_cache: boolean;
}

/** Fusion du cache et du résultat d'une récupération (null = pas de tentative). */
export function resolve(
  targetDate: string,
  cached: CacheRow | null,
  attempt: ParseResult | null,
  now: Date,
  ttlMinutes: number,
): { view: ForecastView; write: CacheRow | null } {
  const usableCache = cached && cached.forecast_date === targetDate && cached.hourly?.length ? cached : null;

  if (!attempt) {
    // Cache encore frais : aucune récupération effectuée.
    const c = usableCache!;
    return {
      view: {
        forecast_date: targetDate,
        state: c.status === "incomplete" ? "incomplete" : "fresh",
        fetched_at: c.fetched_at, hourly: c.hourly!, error: null,
        issues: c.status === "incomplete" ? ["Données incomplètes"] : [],
        ttl_minutes: ttlMinutes, from_cache: true,
      },
      write: null,
    };
  }

  if (attempt.ok) {
    const nowIso = now.toISOString();
    return {
      view: {
        forecast_date: targetDate,
        state: attempt.status === "incomplete" ? "incomplete" : "fresh",
        fetched_at: nowIso, hourly: attempt.hourly, error: null, issues: attempt.issues,
        ttl_minutes: ttlMinutes, from_cache: false,
      },
      write: {
        forecast_date: targetDate, fetched_at: nowIso, hourly: attempt.hourly,
        status: attempt.status, last_error: null, last_attempt_at: nowIso,
      },
    };
  }

  // Échec : on garde les dernières données valides, marquées périmées.
  if (usableCache) {
    return {
      view: {
        forecast_date: targetDate, state: "stale",
        fetched_at: usableCache.fetched_at, hourly: usableCache.hourly!,
        error: attempt.error, issues: [], ttl_minutes: ttlMinutes, from_cache: true,
      },
      write: { ...usableCache, last_error: attempt.error, last_attempt_at: now.toISOString() },
    };
  }
  return {
    view: {
      forecast_date: targetDate, state: "unavailable", fetched_at: null, hourly: [],
      error: attempt.error, issues: [], ttl_minutes: ttlMinutes, from_cache: false,
    },
    write: {
      forecast_date: targetDate, fetched_at: null, hourly: null, status: "unavailable",
      last_error: attempt.error, last_attempt_at: now.toISOString(),
    },
  };
}

/** Appel Open-Meteo avec délai maximal ; ne lève jamais. */
export async function fetchForecast(
  targetDate: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 8000,
): Promise<ParseResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(buildForecastUrl(), { signal: ctrl.signal });
    if (!res.ok) return { ok: false, error: `Open-Meteo HTTP ${res.status}` };
    const json = await res.json().catch(() => null);
    return parseForecast(json, targetDate);
  } catch (e) {
    const aborted = (e as Error)?.name === "AbortError";
    return { ok: false, error: aborted ? "Délai d'attente dépassé" : "Open-Meteo injoignable" };
  } finally {
    clearTimeout(timer);
  }
}
