import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "marketing" });

export const marketingService = {
  getPreferences: (args: Record<string, unknown>) => api.rpc("get_marketing_preferences", args),
  savePreferences: (args: Record<string, unknown>) =>
    api.rpc("save_marketing_preferences", args, { retries: 1 }),

  getSegment: (args: Record<string, unknown>) => api.rpc("get_marketing_segment", args),
  estimateAudience: (args: Record<string, unknown>) => api.rpc("marketing_estimate_audience", args),
  segmentEstimate: (args: Record<string, unknown>) => api.rpc("marketing_segment_estimate", args),

  /** Edge functions — Brevo behaviour unchanged. */
  syncBrevoContacts: (body: Record<string, unknown>) =>
    api.invoke("sync-brevo-contacts", body, { retries: 1, timeoutMs: 60_000 }),
  runAutomations: (body?: Record<string, unknown>) =>
    api.invoke("run-marketing-automations", body ?? {}, { retries: 1, timeoutMs: 60_000 }),
};

export type MarketingService = typeof marketingService;