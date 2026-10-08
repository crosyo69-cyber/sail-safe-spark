/* eslint-disable @typescript-eslint/no-explicit-any -- transport layer bridges untyped Supabase generics */
import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "stats" });

/**
 * Lectures brutes utilisées par les tableaux de bord admin
 * (saison, chiffre d'affaires).
 *
 * LOT E-3-B : déplacement pur du transport. Aucun calcul métier n'est
 * effectué ici — les agrégats restent dans les composants, à l'identique.
 */
export const statsService = {
  /** Groupes journaliers — champs utilisés par AdminSeasonStats. */
  seasonGroups: <T = unknown[],>() =>
    api.query<T>("daily_groups.season", (db) =>
      (db.from("daily_groups") as any).select("id, date, activity, max_participants, status"),
    ),

  /** Réservations confirmées + en attente — AdminSeasonStats. */
  seasonReservations: <T = unknown[],>() =>
    api.query<T>("reservations.season", (db) =>
      (db.from("reservations") as any)
        .select("id, daily_group_id, client_activity, participants, status, skill_level, first_name, last_name")
        .in("status", ["confirmed", "pending"]),
    ),

  /** Réservations payées (Stripe) — AdminRevenueDashboard. */
  revenueReservations: <T = unknown[],>() =>
    api.query<T>("reservations.revenue", (db) =>
      (db.from("reservations") as any)
        .select("id, participants, status, created_at, stripe_session_id, daily_group_id, client_activity")
        .eq("status", "confirmed")
        .not("stripe_session_id", "is", null),
    ),

  /** Groupes journaliers (activité + date) — AdminRevenueDashboard. */
  revenueGroups: <T = unknown[],>() =>
    api.query<T>("daily_groups.revenue", (db) =>
      (db.from("daily_groups") as any).select("id, activity, date"),
    ),
};

export type StatsService = typeof statsService;
