import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assistantService } from "@/services/assistant.service";
import { unwrap } from "@/services/_shared/result";

export const assistantKeys = {
  all: ["assistant"] as const,
  briefing: () => [...assistantKeys.all, "briefing"] as const,
  finances: () => [...assistantKeys.all, "finances"] as const,
  actions: () => [...assistantKeys.all, "actions"] as const,
};

export const useAssistant = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: assistantKeys.all });

  return {
    invalidate,
    service: assistantService,

    useBriefing: (enabled = true) =>
      useQuery({
        queryKey: assistantKeys.briefing(),
        enabled,
        queryFn: async () => unwrap(await assistantService.briefing()),
      }),

    useFinances: (enabled = true) =>
      useQuery({
        queryKey: assistantKeys.finances(),
        enabled,
        queryFn: async () => unwrap(await assistantService.financialSummary()),
      }),

    useActions: (enabled = true) =>
      useQuery({
        queryKey: assistantKeys.actions(),
        enabled,
        queryFn: async () => unwrap(await assistantService.listActions()),
      }),

    useValidateAction: () =>
      useMutation({
        mutationFn: async (args: Record<string, unknown>) =>
          unwrap(await assistantService.validateAction(args)),
        onSuccess: invalidate,
      }),
  };
};