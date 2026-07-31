import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "analytics" });

/**
 * Read-only platform/analytics reporting.
 * Client-side tracking (GA4 / Ads / Meta) stays in `src/lib/analytics.ts`
 * and is intentionally NOT moved here.
 */
export const analyticsService = {
  platformHealth: () => api.rpc("admin_platform_health"),
  latestAuthEmailStatus: () => api.rpc("get_latest_auth_email_status"),

  page404Logs: (limit = 200) =>
    api.query("page_404_logs.list", (db) =>
      (db.from("page_404_logs") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit),
    ),
};

export type AnalyticsService = typeof analyticsService;