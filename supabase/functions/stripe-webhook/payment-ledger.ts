import { confirmedPayment, resolveCheckoutOperation } from "../_shared/checkout-operation.ts";

export function paymentRecord(session: any, eventId: string) {
  const amount = confirmedPayment(session);
  const m = session.metadata ?? {};
  const purchase = m.operation ? resolveCheckoutOperation(m.activity_name, m.operation, m.participants, m.total_sessions) : null;
  return {
    stripe_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    event_id: eventId, amount_cents: amount,
    expected_amount_cents: purchase?.expectedAmountCents ?? null,
    currency: "eur", payment_status: "paid",
    operation: purchase?.operation ?? "legacy_unknown",
    activity_name: m.activity_name ?? null,
    participants: purchase?.count ?? (Number(m.participants) || 1),
    customer_email: session.customer_details?.email ?? null,
    paid_at: new Date().toISOString(),
  };
}

/** The ledger table is a non-applied draft: its absence must never block bookings. */
export function isLedgerMissing(error: any): boolean {
  const code = String(error?.code ?? "");
  const msg = String(error?.message ?? "");
  return code === "42P01" || code === "PGRST205" || /stripe_payments/.test(msg) && /does not exist|could not find/i.test(msg);
}

export async function persistPayment(supabase: any, session: any, eventId: string) {
  const record = paymentRecord(session, eventId);
  const { error } = await supabase.from("stripe_payments").upsert(record, { onConflict: "stripe_session_id", ignoreDuplicates: true });
  if (error && !isLedgerMissing(error)) throw new Error("Écriture du paiement indisponible : " + error.message);
  if (error) console.warn("[stripe-webhook] payment ledger not activated; booking continues", { session: session.id });
  if (record.expected_amount_cents !== null && record.amount_cents !== record.expected_amount_cents) {
    const { error: alertError } = await supabase.rpc("enqueue_admin_notification", {
      p_kind: "stripe_deposit_mismatch", p_severity: "critical",
      p_title: "Écart d'acompte Stripe à vérifier",
      p_body: `Encaissé ${record.amount_cents / 100} € ; attendu ${record.expected_amount_cents / 100} €. Aucun remboursement automatique.`,
      p_metadata: { ...record, gap_cents: record.expected_amount_cents - record.amount_cents, status: "manual_review_required" },
      p_ref_key: "stripe_deposit_mismatch:" + session.id,
    });
    if (alertError) throw new Error("Enregistrement de l'écart indisponible");
  }
  return record;
}
