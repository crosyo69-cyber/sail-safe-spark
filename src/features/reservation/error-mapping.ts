/**
 * Mapping des codes d'erreur métier renvoyés par les RPC de réservation.
 * Extrait tel quel de Reserver.tsx : les messages affichés à l'utilisateur
 * sont STRICTEMENT identiques (aucune reformulation).
 */

export const DAILY_BOOKING_ERRORS: Record<string, string> = {
  invalid_code: "Code de pack invalide",
  package_not_active: "Pack inactif",
  package_expired: "Pack expiré",
  no_credits_left: "Plus de crédits disponibles sur ce pack",
  credits_expired: "Vos séances restantes ont expiré — contactez l'école",
  date_in_past: "Date passée",
  already_booked_this_date: "Vous avez déjà réservé cette date",
};

export const STAGE_BOOKING_ERRORS: Record<string, string> = {
  invalid_code: "Code de pack invalide",
  package_not_active: "Pack inactif",
  package_expired: "Pack expiré",
  not_enough_credits: "Pas assez de crédits pour réserver les 5 jours",
  not_a_stage_package: "Ce code ne correspond pas à un Stage 100% Glisse",
  start_in_past: "Date de début passée",
};

export const WAITLIST_OFFER_ERRORS: Record<string, string> = {
  invalid_token: "Lien invalide",
  no_active_offer: "Cette offre n'est plus active",
  offer_expired: "Le délai de 24 h est dépassé — la place a été proposée au suivant",
};

export const DEFAULT_BOOKING_ERROR = "Réservation impossible";

export const mapDailyBookingError = (code: unknown): string =>
  DAILY_BOOKING_ERRORS[String(code ?? "")] || DEFAULT_BOOKING_ERROR;

export const mapStageBookingError = (code: unknown): string => {
  const key = String(code ?? "");
  if (key.startsWith("day_full:")) {
    return `Journée complète : ${key.replace("day_full:", "")}`;
  }
  return STAGE_BOOKING_ERRORS[key] || DEFAULT_BOOKING_ERROR;
};

export const mapWaitlistOfferError = (code: unknown): string =>
  WAITLIST_OFFER_ERRORS[String(code ?? "")] || "Confirmation impossible";
