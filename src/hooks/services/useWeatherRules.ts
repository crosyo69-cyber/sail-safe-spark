import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { weatherRulesService } from "@/services/weather-rules.service";
import { unwrap } from "@/services/_shared/result";
import type { WeatherRule, WeatherRuleUpdate } from "@/features/weather-rules/types";

export const weatherRulesKeys = {
  all: ["weather-rules"] as const,
};

export const useWeatherRulesQuery = (enabled: boolean) =>
  useQuery({
    queryKey: weatherRulesKeys.all,
    enabled,
    queryFn: async () => (unwrap(await weatherRulesService.list()) ?? []) as WeatherRule[],
  });

/** Sur succès seulement, on relit la base : l'affichage reflète toujours les valeurs enregistrées. */
export const useUpdateWeatherRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (u: WeatherRuleUpdate) => unwrap(await weatherRulesService.update(u)),
    onSuccess: () => qc.invalidateQueries({ queryKey: weatherRulesKeys.all }),
  });
};
