// F-29-05 — Règles météo par activité : types et validation pure (aucun réseau).
// Seuils en nœuds, bornes incluses. null = critère non applicable (jamais 0).

export type WeatherRuleActivity = "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte";

export const WEATHER_RULE_ACTIVITIES: WeatherRuleActivity[] = ["kitesurf", "wingfoil", "pumpfoil", "foil_tracte"];

export const WEATHER_RULE_LABEL: Record<WeatherRuleActivity, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
};

export interface WeatherRule {
  activity: WeatherRuleActivity;
  min_wind_kn: number | null;
  max_wind_kn: number | null;
  max_gust_kn: number;
  enabled: boolean;
  updated_at: string;
  updated_by_email: string | null;
  change_reason: string;
}

export interface WeatherRuleDraft {
  activity: WeatherRuleActivity;
  min_wind_kn: string; // "" = non applicable
  max_wind_kn: string;
  max_gust_kn: string;
  enabled: boolean;
  reason: string;
}

export interface WeatherRuleUpdate {
  activity: WeatherRuleActivity;
  min_wind_kn: number | null;
  max_wind_kn: number | null;
  max_gust_kn: number;
  enabled: boolean;
  reason: string;
}

export const toDraft = (r: WeatherRule): WeatherRuleDraft => ({
  activity: r.activity,
  min_wind_kn: r.min_wind_kn === null ? "" : String(r.min_wind_kn),
  max_wind_kn: r.max_wind_kn === null ? "" : String(r.max_wind_kn),
  max_gust_kn: String(r.max_gust_kn),
  enabled: r.enabled,
  reason: "",
});

/** "" → null (non applicable) ; sinon nombre fini ≥ 0, sinon erreur. Aucun arrondi. */
const parseKnots = (raw: string, label: string, optional: boolean): { value: number | null; error?: string } => {
  const s = raw.trim().replace(",", ".");
  if (s === "") return optional ? { value: null } : { value: null, error: `${label} : valeur obligatoire` };
  if (!/^\d+(\.\d+)?$/.test(s)) return { value: null, error: `${label} : nombre positif ou nul attendu` };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return { value: null, error: `${label} : nombre positif ou nul attendu` };
  return { value: n };
};

export function validateDraft(d: WeatherRuleDraft): { ok: true; value: WeatherRuleUpdate } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const min = parseKnots(d.min_wind_kn, "Vent minimum", true);
  const max = parseKnots(d.max_wind_kn, "Vent maximum", true);
  const gust = parseKnots(d.max_gust_kn, "Rafales maximum", false);
  [min, max, gust].forEach((p) => p.error && errors.push(p.error));
  if (!min.error && !max.error && min.value !== null && max.value !== null && min.value > max.value) {
    errors.push("Le vent minimum ne peut pas dépasser le vent maximum");
  }
  if (!d.reason.trim()) errors.push("Motif de modification obligatoire");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      activity: d.activity, min_wind_kn: min.value, max_wind_kn: max.value,
      max_gust_kn: gust.value as number, enabled: d.enabled, reason: d.reason.trim(),
    },
  };
}

export const formatKnots = (v: number | null) => (v === null ? "Non applicable" : `${v} nds`);
