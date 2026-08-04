import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creditService } from "@/services/credit.service";
import { unwrap } from "@/services/_shared/result";

export const creditKeys = {
  all: ["credits"] as const,
  wallet: (code: string) => [...creditKeys.all, "wallet", code] as const,
  history: (code: string) => [...creditKeys.all, "history", code] as const,
  package: (code: string) => [...creditKeys.all, "package", code] as const,
  reminders: (code: string) => [...creditKeys.all, "reminders", code] as const,
  stats: () => [...creditKeys.all, "stats"] as const,
};

export const useCredits = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: creditKeys.all });

  return {
    invalidate,
    service: creditService,

    useWallet: (code: string, enabled = true) =>
      useQuery({
        queryKey: creditKeys.wallet(code),
        enabled: enabled && !!code,
        queryFn: async () => unwrap(await creditService.getWalletByCode({ p_code: code })),
      }),

    useHistory: (code: string, enabled = true) =>
      useQuery({
        queryKey: creditKeys.history(code),
        enabled: enabled && !!code,
        queryFn: async () =>
          unwrap(await creditService.getPackageCreditsHistory({ p_code: code })),
      }),

    usePackage: (code: string, enabled = true) =>
      useQuery({
        queryKey: creditKeys.package(code),
        enabled: enabled && !!code,
        queryFn: async () => unwrap(await creditService.getPackageByCode({ p_code: code })),
      }),

    useReminders: (code: string, enabled = true) =>
      useQuery({
        queryKey: creditKeys.reminders(code),
        enabled: enabled && !!code,
        queryFn: async () => unwrap(await creditService.getReminders({ p_code: code })),
      }),

    useSetReminders: () =>
      useMutation({
        mutationFn: async (args: Record<string, unknown>) =>
          unwrap(await creditService.setReminders(args)),
      }),

    useStats: (enabled = true) =>
      useQuery({
        queryKey: creditKeys.stats(),
        enabled,
        queryFn: async () => unwrap(await creditService.stats()),
      }),

    useRecredit: () =>
      useMutation({
        mutationFn: async (args: Record<string, unknown>) =>
          unwrap(await creditService.recreditPackage(args)),
        onSuccess: invalidate,
      }),
  };
};