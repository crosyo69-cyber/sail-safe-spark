/* eslint-disable @typescript-eslint/no-explicit-any -- transport layer bridges untyped Supabase generics */
import { createApiClient } from "./_shared/api";
import { supabase } from "@/integrations/supabase/client";
import type { EventRow, LiveEvent } from "@/features/admin-conversion-funnel/types";

const api = createApiClient({ scope: "analytics" });

/**
 * Read-only platform/analytics reporting.
 * Client-side tracking (GA4 / Ads / Meta) stays in `src/lib/analytics.ts`
 * and is intentionally NOT moved here.
 */
export const analyticsService = {
  platformHealth: () => api.rpc("admin_platform_health"),
  latestAuthEmailStatus: (args?: Record<string, unknown>) =>
    api.rpc("get_latest_auth_email_status", args),

  page404Logs: (limit = 200) =>
    api.query("page_404_logs.list", (db) =>
      (db.from("page_404_logs") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit),
    ),

  /** Événements analytics bruts sur une fenêtre glissante (tunnel de conversion). */
  conversionEvents: (hours: number) => {
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    return api.query<EventRow[]>("analytics_events.list", (db) =>
      (db.from("analytics_events") as any)
        .select("event_type, session_id, page_path, location, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10000),
    );
  },

  /** Abonnement temps réel aux insertions d'événements. Renvoie une fonction de désinscription. */
  subscribeConversionEvents: (
    onEvent: (ev: LiveEvent) => void,
    onStatus: (status: string) => void,
  ) => {
    const channel = supabase
      .channel("analytics_events_debug")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "analytics_events" },
        (payload) => onEvent(payload.new as LiveEvent),
      )
      .subscribe((status) => onStatus(status));

    return () => {
      void supabase.removeChannel(channel);
    };
  },
};

export type AnalyticsService = typeof analyticsService;