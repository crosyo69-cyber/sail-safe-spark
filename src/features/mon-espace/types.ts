/** Domaine "Mon espace" : types + logique pure (ni React, ni réseau). */
import { parseISO } from "date-fns";

export interface Booking {
  id: string;
  daily_group_id: string | null;
  session_id: string | null;
  status: string;
  date: string;
  activity: string;
  created_at: string;
}

export interface PackageInfo {
  id: string;
  package_code: string;
  first_name: string;
  last_name: string;
  email: string;
  activity: string;
  package_type: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  status: string;
  expires_at: string;
  deposit_amount: number | null;
  bookings: Booking[];
}

export interface CreditHistoryEntry {
  id: string;
  delta: number;
  kind: string;
  reason: string | null;
  balance_after: number;
  created_at: string;
  is_weather: boolean;
}

export interface WalletEntry {
  package_code: string;
  activity: string;
  package_type: string;
  purchased: number;
  consumed: number;
  recredited: number;
  remaining: number;
  total_sessions: number;
}

export interface CreditEntry {
  id: string;
  activity: string;
  origin: string;
  status: string;
  expires_at: string;
}

export interface ReminderPrefs {
  remind_30: boolean;
  remind_7: boolean;
  remind_0: boolean;
}

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

export const daysUntil = (iso: string): number =>
  Math.floor((parseISO(iso).getTime() - Date.now()) / 86400000);

/** Regroupe les crédits disponibles par échéance (aujourd'hui / 7j / 30j). */
export const bucketExpiringCredits = (credits: CreditEntry[]) => {
  const avail = credits.filter((c) => c.status === "available");
  const today = avail.filter((c) => daysUntil(c.expires_at) <= 0);
  const week = avail.filter((c) => daysUntil(c.expires_at) > 0 && daysUntil(c.expires_at) <= 7);
  const month = avail.filter((c) => daysUntil(c.expires_at) > 7 && daysUntil(c.expires_at) <= 30);
  const total = today.length + week.length + month.length;
  return { today, week, month, total, urgent: today.length + week.length > 0 };
};

/** Crédits disponibles d'une activité, triés par date d'expiration. */
export const availableCreditsFor = (credits: CreditEntry[], activity: string) =>
  credits
    .filter((c) => c.status === "available" && c.activity === activity)
    .sort((a, b) => a.expires_at.localeCompare(b.expires_at));

export const expiringSoon = (credits: CreditEntry[]) =>
  credits.filter((c) => daysUntil(c.expires_at) < 30);

export const confirmedBookings = (pkg: PackageInfo | null): Booking[] =>
  (pkg?.bookings || [])
    .filter((b) => b.status === "confirmed")
    .sort((a, b) => a.date.localeCompare(b.date));

export const bookedDatesOf = (pkg: PackageInfo | null): Set<string> =>
  new Set((pkg?.bookings || []).filter((b) => b.status === "confirmed").map((b) => b.date));

export interface PackageFlags {
  packageExpired: boolean;
  packageInactive: boolean;
  noCredits: boolean;
  canBook: boolean;
}

export const packageFlags = (pkg: PackageInfo | null): PackageFlags => {
  const packageExpired = !!pkg?.expires_at && new Date(pkg.expires_at) < new Date();
  const packageInactive = !!pkg && pkg.status !== "active";
  const noCredits = !!pkg && pkg.remaining_sessions <= 0;
  return {
    packageExpired,
    packageInactive,
    noCredits,
    canBook: !!pkg && !packageInactive && !packageExpired && !noCredits,
  };
};

export const activityTitle = (pkg: PackageInfo | null): string =>
  pkg?.activity === "wingfoil" ? "Wingfoil" : "Kitesurf";

export const groupCapacity = (pkg: PackageInfo | null): string =>
  pkg?.activity === "wingfoil" ? "3" : "4";