import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics.service";
import { unwrap } from "@/services/_shared/result";

export const analyticsKeys = {
  all: ["analytics"] as const,
  health: () => [...analyticsKeys.all, "platform-health"] as const,
  notFound: (limit: number) => [...analyticsKeys.all, "404", limit] as const,
};

export const useAnalytics = () => ({
  service: analyticsService,

  usePlatformHealth: (enabled = true) =>
    useQuery({
      queryKey: analyticsKeys.health(),
      enabled,
      queryFn: async () => unwrap(await analyticsService.platformHealth()),
    }),

  use404Logs: (limit = 200, enabled = true) =>
    useQuery({
      queryKey: analyticsKeys.notFound(limit),
      enabled,
      queryFn: async () => unwrap(await analyticsService.page404Logs(limit)),
    }),
});