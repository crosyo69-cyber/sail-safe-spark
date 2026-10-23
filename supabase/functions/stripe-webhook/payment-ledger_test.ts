import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { paymentRecord, persistPayment } from "./payment-ledger.ts";
import { resolveCheckoutOperation, confirmedPayment } from "../_shared/checkout-operation.ts";

for (const [n, cents] of [[1,5000],[2,10000],[3,15000]]) {
  Deno.test(`Réservation ${n} personne(s) : ${cents} centimes, pack par défaut ignoré`, () => {
    assertEquals(resolveCheckoutOperation("Cours à la Carte", "dated_reservation", n, 1).expectedAmountCents, cents);
  });
}
for (const [n, cents] of [[3,15000],[5,25000],[10,50000]]) {
  Deno.test(`Pack individuel ${n} séances : ${cents} centimes`, () => {
    const p = resolveCheckoutOperation("Cours à la Carte", "pack_purchase", 1, n);
    assertEquals(p.operation, "pack_purchase"); assertEquals(p.quantity, n); assertEquals(p.expectedAmountCents, cents);
  });
}
Deno.test("Pack multi-personnes refusé", () => assertThrows(() => resolveCheckoutOperation("Cours à la Carte", "pack_purchase", 2, 3)));
Deno.test("Ancien pack ambigu refusé", () => assertThrows(() => resolveCheckoutOperation("Cours à la Carte", undefined, 1, 3)));
Deno.test("Cours particulier 2 personnes : 100 euros", () => assertEquals(resolveCheckoutOperation("Cours Particulier Kitesurf", "dated_reservation", 2, 1).expectedAmountCents, 10000));
Deno.test("Wingfoil pack 5 et journée 2 personnes conservent leurs montants", () => {
  assertEquals(resolveCheckoutOperation("Cours Wingfoil", "pack_purchase", 1, 5).expectedAmountCents, 25000);
  assertEquals(resolveCheckoutOperation("Cours Wingfoil", "dated_reservation", 2, 1).expectedAmountCents, 10000);
});
Deno.test("Stage 2 personnes : 500 euros et 5 jours", () => {
  const p = resolveCheckoutOperation("Stage 100% Glisse", "stage", 2, 5);
  assertEquals(p.expectedAmountCents, 50000); assertEquals(p.totalSessions, 5);
});
const session = (amount=10000) => ({id:"cs_test_payment", amount_total:amount,currency:"eur",payment_status:"paid",metadata:{operation:"dated_reservation",activity_name:"Cours à la Carte",participants:"2",total_sessions:"1"}});
Deno.test("Paiement conforme : montant réel et attendu séparés", () => {
  const p=paymentRecord(session(),"evt"); assertEquals(p.amount_cents,10000);assertEquals(p.expected_amount_cents,10000);
});
for (const [actual,gap] of [[5000,5000],[15000,-5000]]) {
  Deno.test(`Montant réel ${actual} : écart ${gap} journalisé et alerte`, async () => {
    const rows=new Map();const alerts:any[]=[];
    const db={from:()=>({upsert:(r:any)=>{if(!rows.has(r.stripe_session_id))rows.set(r.stripe_session_id,r);return Promise.resolve({error:null});}}),rpc:(_f:string,a:any)=>{alerts.push(a);return Promise.resolve({error:null});}};
    await persistPayment(db,session(actual),"evt_A");await persistPayment(db,session(actual),"evt_B");
    assertEquals(rows.size,1);assertEquals(rows.get("cs_test_payment").amount_cents,actual);assertEquals(alerts[0].p_metadata.gap_cents,gap);
  });
}
for (const [key,value] of [["currency","usd"],["payment_status","unpaid"],["amount_total",NaN],["amount_total",5000.5]]) {
 Deno.test(`Paiement invalide ${key}=${value} : aucun encaissement confirmé`,()=>assertThrows(()=>confirmedPayment({...session(),[key]:value})));
}
Deno.test("Historique ambigu : attendu inconnu, jamais participants x 50 inventé",()=>{
 const p=paymentRecord({...session(5000),metadata:{activity_name:"Cours à la Carte",participants:"2"}},"evt");assertEquals(p.expected_amount_cents,null);assertEquals(p.amount_cents,5000);
});
