import { createApiClient, newIdempotencyKey } from "./_shared/api";

const api = createApiClient({ scope: "payment" });

/**
 * Stripe behaviour is untouched: same `create-checkout` edge function,
 * same payload. Only transport concerns (timeout / logging) are centralised.
 */
export const paymentService = {
  createCheckout: (body: Record<string, unknown>, idempotencyKey?: string) =>
    api.invoke<{ url?: string }>("create-checkout", body, {
      idempotencyKey: idempotencyKey ?? newIdempotencyKey(),
      retries: 1,
      timeoutMs: 25_000,
    }),
};

export type PaymentService = typeof paymentService;