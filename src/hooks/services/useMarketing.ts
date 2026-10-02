import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { marketingService, type AutomationDraft } from "@/services/marketing.service";
import { unwrap } from "@/services/_shared/result";

export const marketingKeys = {
  all: ["marketing"] as const,
  preferences: (token: string) => [...marketingKeys.all, "preferences", token] as const,
  segment: (args: Record<string, unknown>) => [...marketingKeys.all, "segment", args] as const,
  automations: () => [...marketingKeys.all, "automations"] as const,
  automationRuns: (limit: number) => [...marketingKeys.all, "automation-runs", limit] as const,
  segmentsList: () => [...marketingKeys.all, "segments-list"] as const,
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

    /** Automatisations marketing. */
    useAutomations: (enabled = true) =>
      useQuery({
        queryKey: marketingKeys.automations(),
        enabled,
        queryFn: async () => unwrap(await marketingService.listAutomations()) ?? [],
      }),

    useAutomationRuns: (limit = 60, enabled = true) =>
      useQuery({
        queryKey: marketingKeys.automationRuns(limit),
        enabled,
        queryFn: async () => unwrap(await marketingService.listAutomationRuns(limit)) ?? [],
      }),

    useSegmentsList: (enabled = true) =>
      useQuery({
        queryKey: marketingKeys.segmentsList(),
        enabled,
        queryFn: async () => unwrap(await marketingService.listSegments()) ?? [],
      }),

    useSaveAutomation: () =>
      useMutation({
        mutationFn: async (draft: AutomationDraft) =>
          unwrap(await marketingService.saveAutomation(draft)),
        onSuccess: invalidate,
      }),

    useToggleAutomation: () =>
      useMutation({
        mutationFn: async (vars: { id: string; active: boolean }) =>
          unwrap(await marketingService.setAutomationActive(vars.id, vars.active)),
        onSuccess: invalidate,
      }),

    useDeleteAutomation: () =>
      useMutation({
        mutationFn: async (id: string) => unwrap(await marketingService.deleteAutomation(id)),
        onSuccess: invalidate,
      }),

    useExecuteAutomation: () =>
      useMutation({
        mutationFn: async (vars: { id: string; mode: "test" | "live" }) =>
          unwrap(await marketingService.executeAutomation(vars.id, vars.mode)),
        onSuccess: invalidate,
      }),
  };
};