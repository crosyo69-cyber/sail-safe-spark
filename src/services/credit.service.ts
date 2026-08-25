import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "credit" });

/**
 * Crédits — périmètre ADMIN uniquement.
 * L'accès client aux crédits passe exclusivement par `clientSpaceService`
 * (session OTP obligatoire depuis le LOT C-2.2-D).
 */
export const creditService = {
  /** Admin */
  getWalletByCode: (args: Record<string, unknown>) => api.rpc("admin_get_wallet_by_code", args),
  searchWallets: (args: Record<string, unknown>) => api.rpc("admin_search_wallets", args),
  listCredits: (args: Record<string, unknown>) => api.rpc("admin_list_credits", args),
  stats: (args?: Record<string, unknown>) => api.rpc("admin_credit_stats", args),
  adjustPackageCredits: (args: Record<string, unknown>) =>
    api.rpc("admin_adjust_package_credits", args, { retries: 1 }),
  recreditPackage: (args: Record<string, unknown>) =>
    api.rpc("admin_recredit_package", args, { retries: 1 }),
};

export type CreditService = typeof creditService;
