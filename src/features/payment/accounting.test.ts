import { describe, expect, test } from "bun:test";
import { paymentAmounts } from "./accounting";
describe("Payment evidence", () => {
  test("unknown historical receipt is not zero or a theoretical amount", () => {
    expect(paymentAmounts().received).toBeNull();
  });
  test("balance includes the deposit gap once", () => {
    expect(paymentAmounts({stripe_session_id:"cs_test",amount_cents:5000,expected_amount_cents:10000,currency:"eur",payment_status:"paid",paid_at:"2026-10-23"},24000))
      .toEqual({received:50,expected:100,gap:50,balance:190});
  });
  test("an overpayment stays visible without changing the actual receipt", () => {
    expect(paymentAmounts({stripe_session_id:"cs_test",amount_cents:15000,expected_amount_cents:10000,currency:"eur",payment_status:"paid",paid_at:"2026-10-23"},24000))
      .toEqual({received:150,expected:100,gap:-50,balance:90});
  });
});