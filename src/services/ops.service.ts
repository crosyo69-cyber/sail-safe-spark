import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "ops" });

export interface WeeklySummaryResult {
  sessions: number;
  week: string;
}

export interface SitemapResubmitResult {
  status?: { contents?: Array<{ submitted?: number }> };
}

/** Actions d'exploitation déclenchées depuis l'admin. */
export const opsService = {
  sendWeeklySummary: () =>
    api.invoke<WeeklySummaryResult>("weekly-summary", {}, { retries: 1, timeoutMs: 60_000 }),

  resubmitSitemap: () =>
    api.invoke<SitemapResubmitResult>(
      "resubmit-sitemap-gsc",
      { trigger: "manual-admin" },
      { retries: 1, timeoutMs: 60_000 },
    ),
};
