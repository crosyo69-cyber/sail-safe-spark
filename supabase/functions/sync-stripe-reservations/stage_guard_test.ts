// A1 — un paiement Stage traité via package_bookings ne doit jamais être
// rattrapé par une création de réservation.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { decideRecovery } from "./stage_guard.ts";

const src = Deno.readTextFileSync(new URL("./index.ts", import.meta.url));
const stage = "Stage 100% Glisse";

for (const n of [1, 2, 3, 4]) {
  Deno.test(`T${n} Stage ${n} participant(s) déjà traité → aucune réservation`, () => {
    const packs = Array(n).fill("stage_100_glisse");
    assertEquals(decideRecovery({ activityName: stage, packActivities: packs }), "stage_already_booked");
  });
}
Deno.test("T5 Stage traité sans réservation à la carte → considéré traité", () => {
  assertEquals(decideRecovery({ activityName: null, packActivities: ["stage_100_glisse"] }), "stage_already_booked");
});
Deno.test("T6/T9 Kitesurf à la carte → rattrapage normal", () => {
  assertEquals(decideRecovery({ activityName: "Cours à la Carte", packActivities: [] }), "alacarte");
});
Deno.test("T7 paiement à la carte non traité → rattrapage normal", () => {
  assertEquals(decideRecovery({ activityName: "Cours particulier kitesurf", packActivities: [] }), "alacarte");
});
Deno.test("T8 Stage en échec A0 (aucun pack) → jamais de réservation de secours", () => {
  assertEquals(decideRecovery({ activityName: stage, packActivities: [] }), "stage_left_to_manual");
});
Deno.test("T10 Wingfoil / pack non-stage → comportement inchangé", () => {
  assertEquals(decideRecovery({ activityName: "Cours Wingfoil", packActivities: [] }), "alacarte");
  assertEquals(decideRecovery({ activityName: "Cours à la Carte", packActivities: ["kitesurf"] }), "alacarte");
});
Deno.test("Garde-fou : la décision précède book_daily_visitor dans index.ts", () => {
  const guard = src.indexOf("decideRecovery(");
  const rpc = src.indexOf('rpc("book_daily_visitor"');
  assert(guard > 0 && rpc > guard);
  assert(src.includes('.eq("stripe_session_id", session.id)') && src.includes('from("client_packages")'));
});
