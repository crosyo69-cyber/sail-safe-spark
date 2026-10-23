import { createApiClient } from "./_shared/api";
import type { PaymentEvidence } from "@/features/payment/accounting";
const api = createApiClient({ scope: "payment-accounting" });
export const paymentAccountingService = {
  ledger: (email: string | null = null) => api.rpc<PaymentEvidence[]>("admin_payment_ledger", { p_email: email }),
};