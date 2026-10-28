import { test, expect } from "bun:test";
import { resolveCheckoutOperation } from "../../../supabase/functions/_shared/checkout-operation.ts";
for (const participants of [1,2,3,4]) {
  test(`dated reservation ${participants} participants costs ${participants*50} euros`, () => {
    const r=resolveCheckoutOperation("Cours à la Carte","dated_reservation",participants,1);
    expect(r.expectedAmountCents).toBe(participants*5000);
    expect(r.totalSessions).toBe(1);
  });
}
for (const sessions of [3,5,10]) {
  test(`individual kite pack ${sessions} sessions has credits-only operation`, () => {
    const r=resolveCheckoutOperation("Cours à la Carte","pack_purchase",1,sessions);
    expect(r).toMatchObject({operation:"pack_purchase",quantity:sessions,totalSessions:sessions,count:1,expectedAmountCents:sessions*5000});
  });
}
test("one session keeps dated booking logic, not automatic multi-day enrollment", () => {
  expect(resolveCheckoutOperation("Cours à la Carte",undefined,1,1)).toMatchObject({operation:"dated_reservation",totalSessions:1,expectedAmountCents:5000});
});
test("wingfoil 3 and 5 remain individual packs", () => {
  for (const n of [3,5]) expect(resolveCheckoutOperation("Cours Wingfoil","pack_purchase",1,n).expectedAmountCents).toBe(n*5000);
});
test("wingfoil 10 sessions is not an invented offer", () => {
  expect(() => resolveCheckoutOperation("Cours Wingfoil","pack_purchase",1,10)).toThrow();
});
test("multi-participant pack is rejected", () => {
  expect(() => resolveCheckoutOperation("Cours à la Carte","pack_purchase",2,3)).toThrow();
});
for (const participants of [1,2,3,4]) {
  test(`Stage ${participants} participants retains dedicated five-day deposit`, () => {
    expect(resolveCheckoutOperation("Stage 100% Glisse","stage",participants,5)).toMatchObject({operation:"stage",totalSessions:5,expectedAmountCents:participants*25000});
  });
}