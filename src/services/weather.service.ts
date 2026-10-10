import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "weather" });

export type ForecastState = "fresh" | "stale" | "incomplete" | "unavailable";
export interface ForecastHour {
  time: string;
  wind_kn: number | null;
  gust_kn: number | null;
  direction_deg: number | null;
}
export interface TomorrowForecast {
  forecast_date: string;
  state: ForecastState;
  fetched_at: string | null;
  hourly: ForecastHour[];
  error: string | null;
  issues: string[];
  ttl_minutes: number;
  from_cache: boolean;
}

export const weatherService = {
  // F-22-01 : plus d'INSERT direct depuis le navigateur — Edge Function
  // sécurisée (validation + rate guard + double opt-in).
  subscribe: (body: Record<string, unknown>) => api.invoke("weather-subscribe", body),

  confirm: (token: string) => api.invoke("weather-subscribe", { action: "confirm", token }),

  unsubscribe: (body: Record<string, unknown>) =>
    api.invoke("unsubscribe-weather", body, { retries: 1 }),

  // F-29-03 : prévisions du lendemain (admin), récupérées et mises en cache côté serveur.
  tomorrowForecast: (force = false) =>
    api.invoke<TomorrowForecast>("weather-forecast", { force }, { retries: 1 }),
};

export type WeatherService = typeof weatherService;
