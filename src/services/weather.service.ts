/* eslint-disable @typescript-eslint/no-explicit-any -- transport layer bridges untyped Supabase generics */
import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "weather" });

export const weatherService = {
  subscribe: (payload: Record<string, unknown>) =>
    api.query("weather_alert_subscriptions.insert", (db) =>
      (db.from("weather_alert_subscriptions") as any).insert(payload).select().maybeSingle(),
    ),

  unsubscribe: (body: Record<string, unknown>) =>
    api.invoke("unsubscribe-weather", body, { retries: 1 }),
};

export type WeatherService = typeof weatherService;