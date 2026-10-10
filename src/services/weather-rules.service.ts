import { createApiClient } from "./_shared/api";
import type { WeatherRule, WeatherRuleUpdate } from "@/features/weather-rules/types";

const api = createApiClient({ scope: "weather-rules" });

const COLUMNS = "activity, min_wind_kn, max_wind_kn, max_gust_kn, enabled, updated_at, updated_by_email, change_reason";

export const weatherRulesService = {
  /** Lecture réservée aux admins (RLS). */
  list: () =>
    api.query<WeatherRule[]>("weather_activity_rules.list", (db) =>
      db.from("weather_activity_rules").select(COLUMNS).order("activity"),
    ),

  /** Modification contrôlée côté serveur (droits admin + validation + historique). */
  update: (u: WeatherRuleUpdate) =>
    api.rpc<WeatherRule>(
      "admin_update_weather_rule",
      {
        p_activity: u.activity,
        p_min_wind_kn: u.min_wind_kn,
        p_max_wind_kn: u.max_wind_kn,
        p_max_gust_kn: u.max_gust_kn,
        p_enabled: u.enabled,
        p_reason: u.reason,
      },
      { retries: 1 },
    ),
};
