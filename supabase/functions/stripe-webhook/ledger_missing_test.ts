import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isLedgerMissing, persistPayment } from "./payment-ledger.ts";

const session = { id: "cs_test_1", payment_status: "paid", currency: "eur", amount_total: 5000, metadata: {}, customer_details: { email: "a@b.fr" } };
const client = (error: any) => ({ from: () => ({ upsert: async () => ({ error }) }), rpc: async () => ({ error: null }) });

Deno.test("missing ledger table does not block booking", async () => {
  assertEquals(isLedgerMissing({ code: "PGRST205" }), true);
  assertEquals(isLedgerMissing({ code: "42P01" }), true);
  const rec = await persistPayment(client({ code: "PGRST205", message: "Could not find the table 'public.stripe_payments'" }), session, "evt_1");
  assertEquals(rec.amount_cents, 5000);
});

Deno.test("other ledger write errors stay blocking", async () => {
  assertEquals(isLedgerMissing({ code: "23505", message: "duplicate" }), false);
  await assertRejects(() => persistPayment(client({ code: "57014", message: "timeout" }), session, "evt_2"));
});
