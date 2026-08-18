import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "payment" });

export interface CreateCheckoutBody {
  activityName: string;
  participants: number;
  preferredDate: string;
  phone: string;
  customerName: string;
  totalSessions?: number;
}

/**
 * Stripe behaviour is untouched: same `create-checkout` edge function, same
 * payload, no automatic retry.
 *
 * IDEMPOTENCE — P0-1 (2026-08-17): `create-checkout` now REQUIRES the
 * `Idempotency-Key` header and forwards it to
 * `stripe.checkout.sessions.create(..., { idempotencyKey })`. The key must be
 * stable for a given payment intention (see `useDepositCheckout`) and change
 * only when the intention changes. Because Stripe now deduplicates, a retry is
 * safe: `retries` is raised to 2 when a key is supplied.
 */
export const paymentService = {
  createCheckout: (body: CreateCheckoutBody, idempotencyKey?: string) =>
    api.invoke<{ url?: string }>("create-checkout", body, {
      ...(idempotencyKey ? { idempotencyKey } : {}),
      retries: idempotencyKey ? 2 : 1,
      timeoutMs: 25_000,
    }),
};

export type PaymentService = typeof paymentService;
