export interface PaymentEvidence {
  stripe_session_id: string;
  amount_cents: number;
  expected_amount_cents: number | null;
  currency: string;
  payment_status: string;
  paid_at: string;
}
export function paymentAmounts(payment?: PaymentEvidence, priceTotalCents?: number | null) {
  const actual = payment?.payment_status === "paid" && payment.currency === "eur" && Number.isSafeInteger(payment.amount_cents) && payment.amount_cents > 0
    ? payment.amount_cents : null;
  const rawExpected = payment?.expected_amount_cents;
  const expected = typeof rawExpected === "number" && Number.isSafeInteger(rawExpected) && rawExpected > 0 ? rawExpected : null;
  return {
    received: actual === null ? null : actual / 100,
    expected: expected === null ? null : expected / 100,
    gap: actual === null || expected === null ? null : (expected - actual) / 100,
    // An unpaid deposit gap is already included in total price minus receipts.
    balance: actual === null || priceTotalCents == null || !Number.isSafeInteger(priceTotalCents) || priceTotalCents < 0 ? null : (priceTotalCents - actual) / 100,
  };
}