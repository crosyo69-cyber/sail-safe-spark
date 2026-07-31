import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "credit" });

export const creditService = {
  getWalletByCode: (args: Record<string, unknown>) => api.rpc("get_wallet_by_code", args),
  getPackageByCode: (args: Record<string, unknown>) => api.rpc("get_package_by_code", args),
  getPackageCreditsHistory: (args: Record<string, unknown>) =>
    api.rpc("get_package_credits_history", args),

  getReminders: (args?: Record<string, unknown>) => api.rpc("get_credit_reminders", args),
  setReminders: (args: Record<string, unknown>) =>
    api.rpc("set_credit_reminders", args, { retries: 1 }),

  /** Admin */
  searchWallets: (args: Record<string, unknown>) => api.rpc("admin_search_wallets", args),
  listCredits: (args: Record<string, unknown>) => api.rpc("admin_list_credits", args),
  stats: (args?: Record<string, unknown>) => api.rpc("admin_credit_stats", args),
  adjustPackageCredits: (args: Record<string, unknown>) =>
    api.rpc("admin_adjust_package_credits", args, { retries: 1 }),
  recreditPackage: (args: Record<string, unknown>) =>
    api.rpc("admin_recredit_package", args, { retries: 1 }),
};

export type CreditService = typeof creditService;