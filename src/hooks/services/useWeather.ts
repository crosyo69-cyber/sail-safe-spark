import { useMutation } from "@tanstack/react-query";
import { weatherService } from "@/services/weather.service";
import { unwrap } from "@/services/_shared/result";

export const useWeather = () => ({
  service: weatherService,

  useSubscribe: () =>
    useMutation({
      mutationFn: async (payload: Record<string, unknown>) =>
        unwrap(await weatherService.subscribe(payload)),
    }),

  useUnsubscribe: () =>
    useMutation({
      mutationFn: async (body: Record<string, unknown>) =>
        unwrap(await weatherService.unsubscribe(body)),
    }),
});