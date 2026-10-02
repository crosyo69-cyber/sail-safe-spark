import type { Database } from "@/integrations/supabase/types";

/** Enum métier issu des types Supabase générés (jamais redéclaré à la main). */
export type Activity = Database["public"]["Enums"]["activity_type"];

export type Fn = Database["public"]["Functions"];

/** Réponse JSON de `public.get_daily_availability(p_date)` (json non typé côté DB). */
export interface DailyAvailabilityRaw {
  kitesurf?: { places_restantes?: number; capacite_potentielle?: number; groupes?: number };
  wingfoil?: { places_restantes?: number; capacite_potentielle?: number; groupes?: number };
  stage_100_glisse?: { places_restantes?: number; groupes?: number };
}

export interface DayAvailability {
  date: string;
  kite: { places: number; groupes: number };
  wing: { places: number; groupes: number };
}

export interface StageDayPreview {
  date: string;
  places: number;
  groupes: number;
}

/** Enveloppe commune des RPC métier : `{ ok: boolean, error?: string }`. */
export interface RpcResult {
  ok?: boolean;
  error?: string;
  [key: string]: unknown;
}
