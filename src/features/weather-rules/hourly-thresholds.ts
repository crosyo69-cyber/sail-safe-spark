import type { WeatherRule } from "./types";
import type { ForecastHour, ForecastState } from "../../services/weather.service";

export interface HourThresholdStatus {
  kind: "within" | "outside" | "unknown" | "disabled";
  label: string;
  reasons: string[];
}

const valid = (value: number | null) => value !== null && Number.isFinite(value) && value >= 0;

/** Inclusive limits on original values; no rounding and no course decision. */
export function evaluateHourThresholds(hour: ForecastHour, state: ForecastState, rule?: WeatherRule): HourThresholdStatus {
  if (!rule) return { kind: "unknown", label: "Indéterminé", reasons: ["Règle indisponible"] };
  if (!rule.enabled) return { kind: "disabled", label: "Règle désactivée", reasons: [] };
  if (state !== "fresh") return { kind: "unknown", label: "Indéterminé", reasons: ["Prévisions périmées, incomplètes ou indisponibles"] };
  const needsWind = rule.min_wind_kn !== null || rule.max_wind_kn !== null;
  if ((needsWind && !valid(hour.wind_kn)) || !valid(hour.gust_kn)) {
    return { kind: "unknown", label: "Indéterminé", reasons: ["Mesure nécessaire manquante ou invalide"] };
  }
  if (!valid(rule.max_gust_kn) || (rule.min_wind_kn !== null && !valid(rule.min_wind_kn)) ||
      (rule.max_wind_kn !== null && !valid(rule.max_wind_kn)) ||
      (rule.min_wind_kn !== null && rule.max_wind_kn !== null && rule.min_wind_kn > rule.max_wind_kn)) {
    return { kind: "unknown", label: "Indéterminé", reasons: ["Seuils invalides"] };
  }
  const reasons: string[] = [];
  if (hour.wind_kn !== null && rule.min_wind_kn !== null && hour.wind_kn < rule.min_wind_kn) reasons.push(`Vent ${hour.wind_kn} < minimum ${rule.min_wind_kn} nds`);
  if (hour.wind_kn !== null && rule.max_wind_kn !== null && hour.wind_kn > rule.max_wind_kn) reasons.push(`Vent ${hour.wind_kn} > maximum ${rule.max_wind_kn} nds`);
  if (hour.gust_kn !== null && hour.gust_kn > rule.max_gust_kn) reasons.push(`Rafales ${hour.gust_kn} > maximum ${rule.max_gust_kn} nds`);
  return reasons.length ? { kind: "outside", label: "Hors seuils", reasons } : { kind: "within", label: "Dans les seuils", reasons: [] };
}