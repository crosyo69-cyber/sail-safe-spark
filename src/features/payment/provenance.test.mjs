import { expect, test } from "bun:test";
import { maskUnverifiedFinancials, financialToolResult } from "../../../supabase/functions/_shared/financial-provenance.ts";
import { paymentAmounts } from "./accounting.ts";

test("CRM revenue is never substituted by a theoretical receipt", () => {
  expect(maskUnverifiedFinancials({revenue:100,participants:2})).toEqual({revenue:null,participants:2});
});
test("assistant masks financial fields before model input", () => {
  const result = financialToolResult({ca_mois_eur:100,solde_restant:{total_eur:190},clients:[{ca_eur:50,reservations:2}],evolution_mois_pct:20});
  expect(result.data).toEqual({ca_mois_eur:null,solde_restant:{total_eur:null},clients:[{ca_eur:null,reservations:2}],evolution_mois_pct:null});
  expect(result.accounting_status).toBe("unverified");
});
for (const [name, patch] of Object.entries({negative:{amount_cents:-1},zero:{amount_cents:0},currency:{currency:"usd"},unpaid:{payment_status:"unpaid"},unsafe:{amount_cents:Number.MAX_SAFE_INTEGER+1}})) {
  test(`invalid ${name} evidence stays unknown`, () => {
    expect(paymentAmounts({stripe_session_id:"cs_test",amount_cents:5000,expected_amount_cents:10000,currency:"eur",payment_status:"paid",paid_at:"2026-10-23",...patch}).received).toBeNull();
  });
}
test("invalid expected amount is not a collectible gap", () => {
  expect(paymentAmounts({stripe_session_id:"cs_test",amount_cents:5000,expected_amount_cents:-100,currency:"eur",payment_status:"paid",paid_at:"2026-10-23"}).gap).toBeNull();
});