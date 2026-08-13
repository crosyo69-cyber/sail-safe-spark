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
 * IDEMPOTENCE — audit A4 (2026-08): the `create-checkout` edge function does
 * NOT read the `Idempotency-Key` header and does NOT forward it to Stripe;
 * every call creates a brand new Checkout Session. Sending a key would
 * therefore be cosmetic and could wrongly suggest that a retry is safe.
 * The key is consequently OPT-IN only (caller must pass one explicitly) and
 * `retries` stays at 1 (no retry). Do not enable it by default until the edge
 * function forwards the key to `stripe.checkout.sessions.create(..., { idempotencyKey })`.
 */
export const paymentService = {
  createCheckout: (body: CreateCheckoutBody, idempotencyKey?: string) =>
    api.invoke<{ url?: string }>("create-checkout", body, {
      ...(idempotencyKey ? { idempotencyKey } : {}),
      retries: 1,
      timeoutMs: 25_000,
    }),
};

export type PaymentService = typeof paymentService;
