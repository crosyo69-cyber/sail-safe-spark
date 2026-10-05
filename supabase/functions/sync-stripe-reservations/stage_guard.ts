/**
 * A1 — Le rattrapage Stripe ne doit jamais transformer un paiement
 * Stage 100 % Glisse en réservation à la carte.
 *
 * Un Stage est réservé via client_packages + package_bookings (A0/S2), jamais
 * via `reservations`. La décision repose sur l'état réel :
 *  - un pack Stage existe pour ce paiement (stripe_session_id) → déjà traité ;
 *  - paiement Stage sans pack → laissé à la gestion manuelle d'A0 (alerte),
 *    aucune réservation de secours ;
 *  - tout autre paiement → rattrapage à la carte inchangé.
 */

export type RecoveryDecision = "stage_already_booked" | "stage_left_to_manual" | "alacarte";

export function isStageActivityName(activityName: string | null | undefined): boolean {
  const n = String(activityName ?? "").toLowerCase().trim();
  return n.includes("100% glisse") || n.includes("100%glisse") || n.includes("stage 100");
}

export function decideRecovery(input: {
  activityName: string | null | undefined;
  packActivities: string[];
}): RecoveryDecision {
  if (input.packActivities.includes("stage_100_glisse")) return "stage_already_booked";
  if (isStageActivityName(input.activityName)) return "stage_left_to_manual";
  return "alacarte";
}
