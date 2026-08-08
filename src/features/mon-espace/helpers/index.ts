/** Logique pure du module "Mon espace" (ni React, ni réseau). */
import { parseISO } from "date-fns";
import type { Booking, CreditEntry, PackageFlags, PackageInfo } from "./types";

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
