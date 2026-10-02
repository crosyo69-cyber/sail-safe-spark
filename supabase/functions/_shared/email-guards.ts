// F-21-HARDENING — garde-fous partagés de la chaîne e-mail sortante.
// Ce module est volontairement pur/testable : aucune dépendance réseau.

/** Motifs de suppression bloquants pour TOUS les e-mails (y compris transactionnels). */
export const HARD_SUPPRESSION_REASONS = [
  'bounce',
  'hard_bounce',
  'hard-bounce',
  'complaint',
  'spam_complaint',
  'spam',
  'invalid',
] as const;

/**
 * F-21-04 — Neutralise CR/LF (et caractères de contrôle) dans une valeur
 * destinée à un en-tête e-mail (Subject, From, Reply-To, To).
 * Ne modifie jamais la donnée stockée en base, uniquement la valeur envoyée.
 */
export function sanitizeHeaderValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const raw = String(value);
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

/** Normalisation d'adresse pour comparaison (suppression list / consentement). */
export function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export type SuppressionRow = { email: string; reason: string | null };

/**
 * F-21-01 — Décide si l'envoi doit être bloqué par la suppression list.
 * - marketing : blocage absolu quelle que soit la raison.
 * - transactionnel : blocage uniquement sur bounce dur / plainte / adresse invalide
 *   (une désinscription marketing ne doit pas couper les e-mails transactionnels).
 */
export function isSuppressedForPurpose(
  rows: SuppressionRow[],
  recipient: string,
  purpose: string | undefined,
): { blocked: boolean; reason?: string } {
  const target = normalizeEmail(recipient);
  const match = rows.find((r) => normalizeEmail(r.email) === target);
  if (!match) return { blocked: false };
  const reason = (match.reason ?? 'suppressed').toLowerCase();
  if (purpose === 'marketing') return { blocked: true, reason: `suppressed:${reason}` };
  if ((HARD_SUPPRESSION_REASONS as readonly string[]).includes(reason)) {
    return { blocked: true, reason: `suppressed:${reason}` };
  }
  return { blocked: false };
}

/**
 * F-21-03 — Nombre d'échecs de la VIE COURANTE du message.
 * Les lignes `failed` antérieures au dernier passage en DLQ appartiennent à un
 * cycle terminé : les recompter renverrait immédiatement toute reprise en DLQ.
 */
export function countCurrentLifeFailures(
  rows: Array<{ status: string; created_at: string }>,
): number {
  let lastDlqAt = 0;
  for (const r of rows) {
    if (r.status === 'dlq') {
      const t = new Date(r.created_at).getTime();
      if (t > lastDlqAt) lastDlqAt = t;
    }
  }
  return rows.filter(
    (r) => r.status === 'failed' && new Date(r.created_at).getTime() > lastDlqAt,
  ).length;
}

/** Plafond de reprises depuis la DLQ (aligné sur retry_dlq_messages côté SQL). */
export const MAX_DLQ_RETRIES = 3;

export function dlqRetryCount(payload: Record<string, unknown>): number {
  const raw = payload?.dlq_retry_count;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? '0'), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
