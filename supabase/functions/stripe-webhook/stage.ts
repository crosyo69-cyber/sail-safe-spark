/**
 * A0 — Flux Stripe dédié au Stage 100 % Glisse.
 *
 * Règles :
 * - Trois montants distincts, jamais confondus :
 *     stripe_amount   = montant réellement encaissé (session.amount_total)
 *     expected_amount = 250 € × participants (règle commerciale validée)
 *     recorded_amount = 250 € × packs créés par book_stage_for_participants (S2)
 * - Un paiement dont le montant encaissé diffère du montant attendu n'est
 *   JAMAIS transformé en réservation : anomalie + alerte administrateur.
 * - Un seul appel à book_stage_for_participants (transaction atomique S2).
 *   Aucune réservation à la carte, aucun pack créé par le webhook.
 * - Aucune lecture « un seul pack par paiement » (.maybeSingle()) : les packs
 *   sont relus par (stripe_session_id, participant_index).
 * - Aucun calcul « participants × 50 € ».
 */

export const STAGE_PRICE_PER_PARTICIPANT_CENTS = 25000;
export const STAGE_MAX_PARTICIPANTS = 4;

export interface StageCheckoutSession {
  id: string;
  amount_total?: number | null;
  currency?: string | null;
  payment_status?: string | null;
  customer_details?: { email?: string | null; name?: string | null; phone?: string | null } | null;
  metadata?: Record<string, string> | null;
}

export interface StagePaymentCheck {
  ok: boolean;
  reason?: string;
  participants: number;
  stripeAmountCents: number | null;
  expectedAmountCents: number;
  startDate: string | null;
  email: string | null;
}

export function isStageActivity(activityName: string | undefined | null): boolean {
  const n = String(activityName ?? "").toLowerCase().trim();
  return n.includes("100% glisse") || n.includes("100%glisse") || n.includes("stage 100");
}

export function formatEuros(cents: number | null): string {
  if (cents === null || !Number.isFinite(cents)) return "inconnu";
  const euros = cents / 100;
  const txt = Number.isInteger(euros) ? String(euros) : euros.toFixed(2).replace(".", ",");
  return `${txt.replace(/\B(?=(\d{3})+(?!\d))/g, " ")} €`;
}

/** Contrôle du paiement AVANT toute écriture. Pur, testable. */
export function checkStagePayment(session: StageCheckoutSession): StagePaymentCheck {
  const raw = session.metadata?.participants ?? "1";
  const parsed = Number(raw);
  const participants = Number.isInteger(parsed) ? parsed : NaN;
  const stripeAmountCents = typeof session.amount_total === "number" ? session.amount_total : null;
  const startDate = session.metadata?.preferred_date || null;
  const email = session.customer_details?.email || null;
  const base = {
    participants: Number.isNaN(participants) ? 0 : participants,
    stripeAmountCents,
    expectedAmountCents: Number.isNaN(participants) ? 0 : participants * STAGE_PRICE_PER_PARTICIPANT_CENTS,
    startDate,
    email,
  };
  if (Number.isNaN(participants) || participants < 1 || participants > STAGE_MAX_PARTICIPANTS) {
    return { ok: false, reason: "invalid_participants_count", ...base };
  }
  if (session.payment_status !== "paid") return { ok: false, reason: "payment_not_paid", ...base };
  if ((session.currency ?? "").toLowerCase() !== "eur") return { ok: false, reason: "unexpected_currency", ...base };
  if (stripeAmountCents === null) return { ok: false, reason: "missing_stripe_amount", ...base };
  if (stripeAmountCents !== base.expectedAmountCents) return { ok: false, reason: "amount_mismatch", ...base };
  if (!email) return { ok: false, reason: "missing_customer_email", ...base };
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { ok: false, reason: "missing_start_date", ...base };
  return { ok: true, ...base };
}

/**
 * Le paiement ne transmet qu'un seul contact (l'acheteur). Chaque pack est
 * donc rattaché aux coordonnées de l'acheteur, un pack par participant.
 */
export function buildStageParticipants(session: StageCheckoutSession, n: number) {
  const name = (session.metadata?.customer_name || session.customer_details?.name || "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0] || "Client";
  const last = parts.slice(1).join(" ") || "Stripe";
  const phone = session.metadata?.phone || session.customer_details?.phone || "";
  return Array.from({ length: n }, () => ({
    email: session.customer_details?.email ?? "",
    first_name: first,
    last_name: last,
    phone,
  }));
}

export type StageOutcome =
  | { status: "booked"; packageCodes: string[]; replay: boolean; check: StagePaymentCheck }
  | { status: "failed"; reason: string; detail?: string; check: StagePaymentCheck };

// deno-lint-ignore no-explicit-any
export async function processStagePayment(supabase: any, session: StageCheckoutSession): Promise<StageOutcome> {
  const check = checkStagePayment(session);
  if (!check.ok) return { status: "failed", reason: check.reason!, check };

  const { data, error } = await supabase.rpc("book_stage_for_participants", {
    p_stripe_session_id: session.id,
    p_start_date: check.startDate,
    p_participants: buildStageParticipants(session, check.participants),
  });
  if (error) {
    return { status: "failed", reason: "rpc_error", detail: String(error.message ?? error), check };
  }
  const res = data as { ok?: boolean; error?: string; detail?: string; package_codes?: string[] } | null;
  if (res?.ok === true && Array.isArray(res.package_codes)) {
    return { status: "booked", packageCodes: res.package_codes, replay: false, check };
  }

  // Rejeu du même paiement : S2 refuse (contrainte S1) et annule tout.
  // On relit les packs existants par (stripe_session_id, participant_index).
  if (res?.error === "participant_already_exists") {
    const { data: rows, error: readErr } = await supabase
      .from("client_packages")
      .select("package_code, participant_index")
      .eq("stripe_session_id", session.id)
      .not("participant_index", "is", null)
      .order("participant_index", { ascending: true });
    const codes = (rows ?? []).map((r: { package_code: string }) => r.package_code);
    if (!readErr && codes.length === check.participants) {
      return { status: "booked", packageCodes: codes, replay: true, check };
    }
    return { status: "failed", reason: "replay_inconsistent", detail: res.detail, check };
  }
  return { status: "failed", reason: res?.error ?? "unknown", detail: res?.detail, check };
}

function esc(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

const row = (k: string, v: string, strong = true) =>
  `<tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">${esc(k)}</td><td style="padding:10px 16px;${strong ? "font-weight:bold;" : ""}color:#0F172A;font-size:14px;">${v}</td></tr>`;

export function buildStageCustomerEmail(logoUrl: string, check: StagePaymentCheck, codes: string[]): string {
  const n = check.participants;
  const codeLinks = codes.map((c) =>
    `<p style="margin:0 0 8px;"><a href="https://www.kitesurfpassion.fr/mon-espace/${encodeURIComponent(c)}" style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:2px;font-family:Menlo,monospace;text-decoration:none;">${esc(c)}</a></p>`
  ).join("");
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Montserrat,Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="background-color:#0F172A;padding:24px 25px;text-align:center;"><img src="${logoUrl}" alt="KiteSurf Passion" width="180" style="display:block;margin:0 auto;" /></td></tr>
    <tr><td style="padding:32px 25px 0;">
      <h1 style="font-size:22px;font-weight:bold;color:#0F172A;margin:0 0 16px;">Confirmation de paiement et de réservation ✅</h1>
      <p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 20px;">Nous avons bien reçu votre paiement de <strong>${esc(formatEuros(check.stripeAmountCents))}</strong> pour le <strong>Stage 100% Glisse</strong> (${n} participant${n > 1 ? "s" : ""}). Vos 5 journées sont réservées.</p>
    </td></tr>
    <tr><td style="padding:0 25px 24px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0891B2,#0F172A);border-radius:12px;"><tr><td style="padding:20px;text-align:center;">
      <p style="margin:0 0 12px;color:#bae6fd;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Code${codes.length > 1 ? "s" : ""} de réservation (1 par participant)</p>${codeLinks}
    </td></tr></table></td></tr>
    <tr><td style="padding:0 25px 24px;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;border-radius:12px;">
      ${row("Prestation", "Stage 100% Glisse (5 jours consécutifs)")}
      ${row("Premier jour", esc(check.startDate ?? ""))}
      ${row("Participants", String(n))}
      ${row("Montant payé", esc(formatEuros(check.stripeAmountCents)))}
    </table></td></tr>
    <tr><td style="padding:0 25px 24px;"><p style="margin:0;color:#92400E;font-size:14px;line-height:1.5;background-color:#FFFBEB;border-left:4px solid #F59E0B;padding:16px;border-radius:12px;">Contactez-nous <strong>la veille</strong> pour confirmer l'horaire selon la météo : <a href="tel:0672716905" style="color:#92400E;font-weight:bold;">06 72 71 69 05</a>.</p></td></tr>
    <tr><td style="padding:0 25px 24px;"><p style="font-size:15px;color:#64748B;line-height:1.6;margin:0;">À très bientôt sur l'eau ! 🪁<br><br><strong>L'équipe KiteSurf Passion</strong></p></td></tr>
  </table>
</body></html>`;
}

export function buildStageOwnerEmail(
  logoUrl: string,
  session: StageCheckoutSession,
  outcome: StageOutcome,
): string {
  const c = outcome.check;
  const conform = outcome.status === "booked";
  const statusLabel = conform
    ? "Conforme — stage réservé"
    : c.stripeAmountCents !== null && c.stripeAmountCents !== c.expectedAmountCents
    ? "ANOMALIE DE MONTANT — aucune réservation créée"
    : `ÉCHEC DE RÉSERVATION (${esc(outcome.reason)}) — aucune réservation créée`;
  const codes = outcome.status === "booked" ? outcome.packageCodes.join(", ") : "—";
  const detail = outcome.status === "failed" && outcome.detail ? row("Détail technique", esc(outcome.detail), false) : "";
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Montserrat,Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="background-color:#0F172A;padding:24px 25px;text-align:center;"><img src="${logoUrl}" alt="KiteSurf Passion" width="180" style="display:block;margin:0 auto;" /></td></tr>
    <tr><td style="padding:24px 25px;">
      <h1 style="font-size:20px;font-weight:bold;color:${conform ? "#0F172A" : "#B91C1C"};margin:0 0 16px;">${conform ? "💰 Paiement Stage 100% Glisse reçu" : "🚨 Paiement Stage 100% Glisse à traiter manuellement"}</h1>
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;border-radius:12px;">
        ${row("Statut", statusLabel)}
        ${row("Montant encaissé (Stripe)", esc(formatEuros(c.stripeAmountCents)))}
        ${row("Participants", String(c.participants))}
        ${row("Montant attendu (250 € × participants)", esc(formatEuros(c.expectedAmountCents)))}
        ${row("Client", esc(session.metadata?.customer_name || session.customer_details?.name || "—"))}
        ${row("E-mail client", esc(c.email ?? "—"))}
        ${row("Téléphone", esc(session.metadata?.phone || session.customer_details?.phone || "—"))}
        ${row("Premier jour", esc(c.startDate ?? "—"))}
        ${row("Codes de réservation", esc(codes))}
        ${row("ID paiement Stripe", esc(session.id), false)}
        ${detail}
      </table>
      ${conform ? "" : `<p style="font-size:14px;color:#B91C1C;margin:20px 0 0;">Le paiement a bien été encaissé par Stripe mais aucune réservation ni aucun pack n'a été créé. Le client n'a reçu aucun e-mail de confirmation. Contactez-le pour régulariser (réservation manuelle, complément ou remboursement).</p>`}
    </td></tr>
  </table>
</body></html>`;
}
