import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { marketingService } from "@/services/marketing.service";
import { unwrap } from "@/services/_shared/result";

export const marketingKeys = {
  all: ["marketing"] as const,
  preferences: (token: string) => [...marketingKeys.all, "preferences", token] as const,
  segment: (args: Record<string, unknown>) => [...marketingKeys.all, "segment", args] as const,
};

export const useMarketing = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: marketingKeys.all });

  return {
    invalidate,
    service: marketingService,

    usePreferences: (args: Record<string, unknown>, key: string, enabled = true) =>
      useQuery({
        queryKey: marketingKeys.preferences(key),
        enabled: enabled && !!key,
        queryFn: async () => unwrap(await marketingService.getPreferences(args)),
      }),

    useSegment: (args: Record<string, unknown>, enabled = true) =>
      useQuery({
        queryKey: marketingKeys.segment(args),
        enabled,
        queryFn: async () => unwrap(await marketingService.getSegment(args)),
      }),

    useSavePreferences: () =>
      useMutation({
        mutationFn: async (args: Record<string, unknown>) =>
          unwrap(await marketingService.savePreferences(args)),
        onSuccess: invalidate,
      }),

    useSyncBrevo: () =>
      useMutation({
        mutationFn: async (body: Record<string, unknown>) =>
          unwrap(await marketingService.syncBrevoContacts(body)),
      }),
  };
};