import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler, type CheckoutClient } from "./index.ts";
import { checkStagePayment } from "../stripe-webhook/stage.ts";

// Prix Stripe réels (vérifiés dans le compte) : montant unitaire en centimes.
const PRICE_CENTS: Record<string, number> = {
  "price_1UN6OiJTWAAnYv4VSmNgqYLs": 25000, // Stage 100% Glisse, par participant
  "price_1TAXYhJTWAAnYv4Vnnoy6jIP": 5000, // acompte 50 €
};

// deno-lint-ignore no-explicit-any
type Params = any;

function run(body: Record<string, unknown>) {
  const calls: Params[] = [];
  const stripe = (): CheckoutClient => ({
    checkout: { sessions: { create(p) { calls.push(p); return Promise.resolve({ url: "https://checkout.stripe.com/x" }); } } },
  });
  const guard = () => ({
    // deno-lint-ignore no-explicit-any
    rpc: (fn: string, _a: any) => Promise.resolve(fn === "default_max_participants" ? { data: 4, error: null } : { data: true, error: null }),
  });
  // deno-lint-ignore no-explicit-any
  const handler = createHandler(stripe, () => "https://www.kitesurfpassion.fr", guard as any);
  const req = new Request("https://x/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ preferredDate: "2099-07-01", phone: "0600000000", customerName: "Jean Test", ...body }),
  });
  return handler(req).then(async (res) => ({ status: res.status, body: await res.text(), calls }));
}

const amountOf = (p: Params) =>
  p.line_items.reduce((s: number, li: Params) => s + PRICE_CENTS[li.price] * li.quantity, 0);

for (const n of [1, 2, 3, 4]) {
  Deno.test(`T${n}/T11 — Stage ${n} participant(s) → ${n * 25000} centimes, accepté par A0`, async () => {
    const r = await run({ activityName: "Stage 100% Glisse", participants: n, totalSessions: 5 });
    assertEquals(r.status, 200);
    const p = r.calls[0];
    assertEquals(amountOf(p), n * 25000);
    assertEquals(p.line_items[0].quantity, n);
    assertEquals(p.metadata.participants, String(n));
    assertEquals(p.metadata.total_sessions, "5"); // T10 : toujours 5 jours
    const a0 = checkStagePayment({
      id: "cs_test", amount_total: amountOf(p), currency: "eur", payment_status: "paid",
      customer_details: { email: "c@example.com" }, metadata: p.metadata,
    });
    assert(a0.ok, `A0 rejette : ${a0.reason}`);
  });
}

for (const [label, v] of [["T5 0", 0], ["T6 5", 5], ["T7 1.5", 1.5], ["T7 '2.5'", "2.5"], ["T8 absent", undefined], ["négatif", -1], ["texte", "deux"]] as const) {
  Deno.test(`${label} participants → refus, aucun Checkout`, async () => {
    const body: Record<string, unknown> = { activityName: "Stage 100% Glisse", totalSessions: 5 };
    if (v !== undefined) body.participants = v;
    const r = await run(body);
    assertEquals(r.status, 400);
    assertEquals(r.calls.length, 0);
  });
}

Deno.test("T12 — autres activités inchangées (séances × 50 €)", async () => {
  const carte = await run({ activityName: "Cours à la Carte", participants: 1, totalSessions: 3 });
  assertEquals(amountOf(carte.calls[0]), 15000);
  const part = await run({ activityName: "Cours particulier kitesurf", participants: 2, totalSessions: 2 });
  assertEquals(amountOf(part.calls[0]), 10000);
  const wing = await run({ activityName: "Cours wingfoil", participants: 1, totalSessions: 5 });
  assertEquals(amountOf(wing.calls[0]), 25000);
});
