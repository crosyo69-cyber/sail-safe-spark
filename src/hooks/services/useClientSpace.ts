/** Couche React Query du module "Mon espace" : cache, queries, mutations, invalidations. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientSpaceService } from "@/services/client-space.service";
import { unwrap } from "@/services/_shared/result";

export const clientSpaceKeys = {
  all: ["client-space"] as const,
  package: (code: string) => [...clientSpaceKeys.all, "package", code] as const,
  history: (code: string) => [...clientSpaceKeys.all, "history", code] as const,
  wallet: (code: string) => [...clientSpaceKeys.all, "wallet", code] as const,
  reminders: (code: string) => [...clientSpaceKeys.all, "reminders", code] as const,
};

export const useClientSpace = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: clientSpaceKeys.all });

  return {
    invalidate,

    usePackage: (code: string, enabled = true) =>
      useQuery({
        queryKey: clientSpaceKeys.package(code),
        enabled: enabled && !!code,
        queryFn: async () => unwrap(await clientSpaceService.getPackageByCode(code)),
      }),

    useHistory: (code: string, enabled = true) =>
      useQuery({
        queryKey: clientSpaceKeys.history(code),
        enabled: enabled && !!code,
        queryFn: async () => unwrap(await clientSpaceService.getCreditsHistory(code)),
      }),

    useWallet: (code: string, enabled = true) =>
      useQuery({
        queryKey: clientSpaceKeys.wallet(code),
        enabled: enabled && !!code,
        queryFn: async () => unwrap(await clientSpaceService.getWallet(code)),
      }),

    useReminders: (code: string, enabled = true) =>
      useQuery({
        queryKey: clientSpaceKeys.reminders(code),
        enabled: enabled && !!code,
        queryFn: async () => unwrap(await clientSpaceService.getReminders(code)),
      }),

    useSetReminders: () =>
      useMutation({
        mutationFn: async (args: Record<string, unknown>) =>
          unwrap(await clientSpaceService.setReminders(args)),
      }),

    useBookDaily: () =>
      useMutation({
        mutationFn: async (args: Record<string, unknown>) =>
          unwrap(await clientSpaceService.bookDaily(args)),
        onSuccess: invalidate,
      }),

    useCancelBooking: () =>
      useMutation({
        mutationFn: async (args: Record<string, unknown>) =>
          unwrap(await clientSpaceService.cancelBooking(args)),
        onSuccess: invalidate,
      }),
  };
};
