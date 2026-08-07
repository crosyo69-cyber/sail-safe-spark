/** Constantes et libellés du module "Mon espace". */
import type { ReminderPrefs } from "./types";

export const DEFAULT_REMINDERS: ReminderPrefs = {
  remind_30: true,
  remind_7: true,
  remind_0: true,
};

export const REMINDER_ROWS: { key: keyof ReminderPrefs; label: string }[] = [
  { key: "remind_30", label: "30 jours avant l'expiration" },
  { key: "remind_7", label: "7 jours avant l'expiration" },
  { key: "remind_0", label: "Le jour de l'expiration" },
];

export const ACTIVITY_LABEL: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

export const BOOKING_ERRORS: Record<string, string> = {
  invalid_code: "Code invalide",
  package_not_active: "Pack inactif",
  package_expired: "Pack expiré",
  no_credits_left: "Plus de crédits disponibles",
  credits_expired: "Vos séances restantes ont expiré — contactez l'école",
  date_in_past: "Date passée",
  already_booked_this_date: "Vous avez déjà réservé cette date",
};

export const CANCEL_ERRORS: Record<string, string> = {
  too_late_to_cancel: "Annulation possible jusqu'à 2 jours avant la journée",
};
