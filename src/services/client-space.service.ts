/** Service métier "Mon espace" : OTP + session opaque. Aucune RPC par package_code. */
import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "client-space" });

export const clientSpaceService = {
  /** Authentification en deux facteurs : code client puis OTP e-mail. */
  requestOtp: (code: string) => api.rpc("request_otp", { p_code: code }),
  verifyOtp: (code: string, otp: string) => api.rpc("verify_otp", { p_code: code, p_otp: otp }),
  revokeSession: (token: string) => api.rpc("revoke_otp_session", { p_session_token: token }),

  /** Lecture — session obligatoire */
  getPackage: (token: string) => api.rpc("get_package_by_session", { p_session_token: token }),
  getCreditsHistory: (token: string) =>
    api.rpc("get_package_credits_history_by_session", { p_session_token: token }),
  getWallet: (token: string) => api.rpc("get_wallet_by_session", { p_session_token: token }),
  getReminders: (token: string) =>
    api.rpc("get_credit_reminders_by_session", { p_session_token: token }),

  /** Écriture — session obligatoire */
  setReminders: (args: Record<string, unknown>) =>
    api.rpc("set_credit_reminders_by_session", args, { retries: 1 }),
  bookDaily: (args: Record<string, unknown>) =>
    api.rpc("book_daily_with_session", args, { retries: 1 }),
  cancelBooking: (args: Record<string, unknown>) =>
    api.rpc("cancel_booking_with_session", args, { retries: 1 }),
};

export type ClientSpaceService = typeof clientSpaceService;
