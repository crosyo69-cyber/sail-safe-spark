import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildStageCustomerEmail,
  buildStageOwnerEmail,
  checkStagePayment,
  formatEuros,
  processStagePayment,
  type StageCheckoutSession,
} from "./stage.ts";

const session = (n: number, cents: number, extra: Partial<StageCheckoutSession> = {}): StageCheckoutSession => ({
  id: `cs_test_${n}_${cents}`,
  amount_total: cents,
  currency: "eur",
  payment_status: "paid",
  customer_details: { email: "client@example.com", name: "Jean Dupont" },
  metadata: { participants: String(n), preferred_date: "2099-07-01", customer_name: "Jean Dupont", phone: "0600000000" },
  ...extra,
});

/** Fake reproducing S2's contract: atomic, S1 uniqueness on (session, index). */
function fakeDb(opts: { failS2?: string } = {}) {
  const packs: Array<{ stripe_session_id: string; participant_index: number; package_code: string }> = [];
  const calls: unknown[] = [];
  let bookings = 0;
  const db = {
    rpc(name: string, args: any) {
      calls.push({ name, args });
      if (name !== "book_stage_for_participants") return Promise.resolve({ data: null, error: null });
      if (opts.failS2) return Promise.resolve({ data: { ok: false, error: opts.failS2, detail: `${opts.failS2}:x` }, error: null });
      if (packs.some((p) => p.stripe_session_id === args.p_stripe_session_id)) {
        return Promise.resolve({ data: { ok: false, error: "participant_already_exists" }, error: null });
      }
      const codes = args.p_participants.map((_: unknown, i: number) => {
        const code = `KP-TEST-${i + 1}`;
        packs.push({ stripe_session_id: args.p_stripe_session_id, participant_index: i + 1, package_code: code });
        bookings += 5;
        return code;
      });
      return Promise.resolve({ data: { ok: true, package_codes: codes }, error: null });
    },
    from() {
      let sid = "";
      const q: any = {
        select: () => q,
        eq: (_c: string, v: string) => { sid = v; return q; },
        not: () => q,
        order: () => Promise.resolve({ data: packs.filter((p) => p.stripe_session_id === sid), error: null }),
        maybeSingle: () => { throw new Error(".maybeSingle() must not be used for Stage"); },
      };
      return q;
    },
  };
  return { db, packs, calls, bookings: () => bookings };
}

for (const n of [1, 2, 3, 4]) {
  Deno.test(`T${n} — ${n} participant(s), ${n * 250} € payés → ${n} packs, ${n * 5} réservations, 1 appel S2`, async () => {
    const f = fakeDb();
    const out = await processStagePayment(f.db, session(n, n * 25000));
    assertEquals(out.status, "booked");
    assertEquals(f.packs.length, n);
    assertEquals(f.bookings(), n * 5);
    assertEquals(f.calls.length, 1);
    assertEquals((f.calls[0] as any).args.p_participants.length, n);
    const html = buildStageCustomerEmail("logo", out.check, out.status === "booked" ? out.packageCodes : []);
    assert(html.includes(formatEuros(n * 25000)));
    assert(!/facture/i.test(html));
  });
}

Deno.test("formatEuros", () => {
  assertEquals(formatEuros(25000), "250 €");
  assertEquals(formatEuros(100000), "1 000 €");
});

Deno.test("T5 — rejeu du même paiement : aucune duplication, packs relus par participant_index", async () => {
  const f = fakeDb();
  const s = session(2, 50000);
  await processStagePayment(f.db, s);
  const again = await processStagePayment(f.db, s);
  assertEquals(again.status, "booked");
  assert(again.status === "booked" && again.replay);
  assertEquals(f.packs.length, 2);
  assertEquals(f.bookings(), 10);
});

Deno.test("T6 — échec S2 : statut failed, aucune écriture, raison conservée", async () => {
  const f = fakeDb({ failS2: "indivisible_group_unavailable" });
  const out = await processStagePayment(f.db, session(1, 25000));
  assertEquals(out.status, "failed");
  assert(out.status === "failed" && out.reason === "indivisible_group_unavailable");
  assertEquals(f.packs.length, 0);
  const html = buildStageOwnerEmail("logo", session(1, 25000), out);
  assert(html.includes("ÉCHEC DE RÉSERVATION"));
});

Deno.test("T7 — anomalie de montant (3 participants, 250 € payés) : aucun appel S2", async () => {
  const f = fakeDb();
  const s = session(3, 25000);
  const out = await processStagePayment(f.db, s);
  assertEquals(out.status, "failed");
  assert(out.status === "failed" && out.reason === "amount_mismatch");
  assertEquals(f.calls.length, 0);
  assertEquals(f.packs.length, 0);
  const html = buildStageOwnerEmail("logo", s, out);
  assert(html.includes("ANOMALIE DE MONTANT"));
  assert(html.includes("750 €") && html.includes("250 €"));
});

Deno.test("contrôles : non payé, devise, participants hors limites, date absente", () => {
  assertEquals(checkStagePayment(session(1, 25000, { payment_status: "unpaid" })).reason, "payment_not_paid");
  assertEquals(checkStagePayment(session(1, 25000, { currency: "usd" })).reason, "unexpected_currency");
  assertEquals(checkStagePayment(session(5, 125000)).reason, "invalid_participants_count");
  assertEquals(checkStagePayment(session(0, 0)).reason, "invalid_participants_count");
  const noDate = session(1, 25000);
  noDate.metadata = { participants: "1" };
  assertEquals(checkStagePayment(noDate).reason, "missing_start_date");
});

Deno.test("T8/T9/T10 — aucun « participants × 50 » ni .maybeSingle() dans le flux Stage", async () => {
  const src = await Deno.readTextFile(new URL("./stage.ts", import.meta.url));
  assert(!/participants\s*\*\s*50\b/.test(src));
  assert(!/\.maybeSingle\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")));
});
