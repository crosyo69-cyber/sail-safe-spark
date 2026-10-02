import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmService, type CrmListParams } from "@/services/crm.service";
import { unwrap } from "@/services/_shared/result";

export const crmKeys = {
  all: ["crm"] as const,
  dashboard: () => [...crmKeys.all, "dashboard"] as const,
  list: (p: CrmListParams) => [...crmKeys.all, "list", p] as const,
  detail: (email: string) => [...crmKeys.all, "detail", email] as const,
};

export const useCRM = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: crmKeys.all });

  return {
    invalidate,
    service: crmService,

    useDashboard: (enabled = true) =>
      useQuery({
        queryKey: crmKeys.dashboard(),
        enabled,
        queryFn: async () => unwrap(await crmService.dashboard()),
      }),

    useClients: (p: CrmListParams, enabled = true) =>
      useQuery({
        queryKey: crmKeys.list(p),
        enabled,
        queryFn: async () => unwrap(await crmService.listClients(p)),
      }),

    useClientDetail: (email: string | null, enabled = true) =>
      useQuery({
        queryKey: crmKeys.detail(email ?? ""),
        enabled: enabled && !!email,
        queryFn: async () => unwrap(await crmService.clientDetail(email!)),
      }),

    useUpsertProfile: () =>
      useMutation({
        mutationFn: async (args: Record<string, unknown>) =>
          unwrap(await crmService.upsertProfile(args)),
        onSuccess: invalidate,
      }),
  };
};