import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "weather" });

export const weatherService = {
  // F-22-01 : plus d'INSERT direct depuis le navigateur — Edge Function
  // sécurisée (validation + rate guard + double opt-in).
  subscribe: (body: Record<string, unknown>) => api.invoke("weather-subscribe", body),

  confirm: (token: string) => api.invoke("weather-subscribe", { action: "confirm", token }),

  unsubscribe: (body: Record<string, unknown>) =>
    api.invoke("unsubscribe-weather", body, { retries: 1 }),
};

export type WeatherService = typeof weatherService;
