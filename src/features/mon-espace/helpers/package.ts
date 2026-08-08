/** Helpers pack & réservations (logique pure : ni React, ni réseau). */
import type { Booking, PackageFlags, PackageInfo } from "../types";

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
