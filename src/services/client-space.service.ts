/** Service métier "Mon espace" : RPC, erreurs, retries, timeouts. */
import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "client-space" });

export const clientSpaceService = {
  /** Lecture */
  getPackageByCode: (code: string) => api.rpc("get_package_by_code", { p_code: code }),
  getCreditsHistory: (code: string) => api.rpc("get_package_credits_history", { p_code: code }),
  getWallet: (code: string) => api.rpc("get_wallet_by_code", { p_code: code }),
  getReminders: (code: string) => api.rpc("get_credit_reminders", { p_code: code }),

  /** Écriture */
  setReminders: (args: Record<string, unknown>) =>
    api.rpc("set_credit_reminders", args, { retries: 1 }),
  bookDaily: (args: Record<string, unknown>) =>
    api.rpc("book_daily_with_code", args, { retries: 1 }),
  cancelBooking: (args: Record<string, unknown>) =>
    api.rpc("cancel_booking_with_code", args, { retries: 1 }),
};

export type ClientSpaceService = typeof clientSpaceService;
