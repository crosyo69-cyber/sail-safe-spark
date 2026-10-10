import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { weatherService } from "@/services/weather.service";
import { unwrap } from "@/services/_shared/result";

export const weatherKeys = {
  all: ["weather"] as const,
  tomorrow: () => [...weatherKeys.all, "tomorrow-forecast"] as const,
};

export const useWeather = () => ({
  service: weatherService,

  useSubscribe: () =>
    useMutation({
      mutationFn: async (payload: Record<string, unknown>) =>
        unwrap(await weatherService.subscribe(payload)),
    }),

  useConfirm: () =>
    useMutation({
      mutationFn: async (token: string) => unwrap(await weatherService.confirm(token)),
    }),

  useUnsubscribe: () =>
    useMutation({
      mutationFn: async (body: Record<string, unknown>) =>
        unwrap(await weatherService.unsubscribe(body)),
    }),
});

/** F-29-03 : prévisions du lendemain (admin uniquement). */
export const useTomorrowForecast = (enabled: boolean) => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: weatherKeys.tomorrow(),
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => unwrap(await weatherService.tomorrowForecast(false)),
  });
  const refresh = useMutation({
    mutationFn: async () => unwrap(await weatherService.tomorrowForecast(true)),
    onSuccess: (data) => qc.setQueryData(weatherKeys.tomorrow(), data),
  });
  return { query, refresh };
};
