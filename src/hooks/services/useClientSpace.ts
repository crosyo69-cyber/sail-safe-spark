/** Couche React Query du module "Mon espace" : cache, queries, mutations, invalidations. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientSpaceService } from "@/services/client-space.service";
import { unwrap } from "@/services/_shared/result";

/** Les clés de cache ne contiennent jamais le jeton de session (secret). */
export const clientSpaceKeys = {
  all: ["client-space"] as const,
  package: () => [...clientSpaceKeys.all, "package"] as const,
  history: () => [...clientSpaceKeys.all, "history"] as const,
  wallet: () => [...clientSpaceKeys.all, "wallet"] as const,
  reminders: () => [...clientSpaceKeys.all, "reminders"] as const,
};

export const useClientSpace = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: clientSpaceKeys.all });

  return {
    invalidate,
    clear: () => qc.removeQueries({ queryKey: clientSpaceKeys.all }),

    /** Authentification */
    useRequestOtp: () =>
      useMutation({
        mutationFn: async (code: string) => unwrap(await clientSpaceService.requestOtp(code)),
      }),

    useVerifyOtp: () =>
      useMutation({
        mutationFn: async (args: { code: string; otp: string }) =>
          unwrap(await clientSpaceService.verifyOtp(args.code, args.otp)),
      }),

    useRevokeSession: () =>
      useMutation({
        mutationFn: async (token: string) => unwrap(await clientSpaceService.revokeSession(token)),
      }),

    /** Données protégées par la session */
    usePackage: (token: string, enabled = true) =>
      useQuery({
        queryKey: clientSpaceKeys.package(),
        enabled: enabled && !!token,
        queryFn: async () => unwrap(await clientSpaceService.getPackage(token)),
      }),

    useHistory: (token: string, enabled = true) =>
      useQuery({
        queryKey: clientSpaceKeys.history(),
        enabled: enabled && !!token,
        queryFn: async () => unwrap(await clientSpaceService.getCreditsHistory(token)),
      }),

    useWallet: (token: string, enabled = true) =>
      useQuery({
        queryKey: clientSpaceKeys.wallet(),
        enabled: enabled && !!token,
        queryFn: async () => unwrap(await clientSpaceService.getWallet(token)),
      }),

    useReminders: (token: string, enabled = true) =>
      useQuery({
        queryKey: clientSpaceKeys.reminders(),
        enabled: enabled && !!token,
        queryFn: async () => unwrap(await clientSpaceService.getReminders(token)),
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
