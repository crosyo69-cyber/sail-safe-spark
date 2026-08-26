import { createApiClient } from "./_shared/api";
import type { Automation, AutomationRun, SegmentRow } from "@/features/admin-automations/types";

const api = createApiClient({ scope: "marketing" });

export interface MarketingSettingsRow {
  brevo_list_id: number | null;
  mode: string | null;
  last_sync_at: string | null;
}

/** Draft d'automatisation issu du formulaire admin → ligne persistée. */
export type AutomationDraft = Partial<Automation>;

/** Mapping métier : normalise un draft en payload de persistance. */
export const toAutomationPayload = (draft: AutomationDraft) => ({
  name: (draft.name ?? "").trim(),
  description: draft.description ?? null,
  active: draft.active ?? false,
  trigger_type: draft.trigger_type ?? "credit_expiring",
  trigger_config: (draft.trigger_config ?? {}) as never,
  segment_id: draft.segment_id ?? null,
  segment_definition: (draft.segment_definition ?? {}) as never,
  required_topic: draft.required_topic || null,
  email_subject: draft.email_subject ?? "",
  email_html: draft.email_html ?? "",
  email_cta_label: draft.email_cta_label || null,
  email_cta_url: draft.email_cta_url || null,
  delay_days: Number(draft.delay_days ?? 0),
  priority: Number(draft.priority ?? 100),
  dedupe_window_days: Number(draft.dedupe_window_days ?? 30),
  max_recipients: Number(draft.max_recipients ?? 500),
});

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

  /** Paramètres Brevo (ligne unique id = 1). */
  getSettings: () =>
    api.query<MarketingSettingsRow | null>("marketing_settings.get", (db) =>
      db.from("marketing_settings").select("*").eq("id", 1).maybeSingle(),
    ),

  saveSettings: (patch: { brevo_list_id: number | null; mode: string }) =>
    api.query(
      "marketing_settings.update",
      (db) => db.from("marketing_settings").update(patch).eq("id", 1),
      { retries: 1 },
    ),

  listSyncLogs: (limit = 20) =>
    api.query<unknown[]>("marketing_sync_logs.list", (db) =>
      db
        .from("marketing_sync_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit),
    ),

  /** Automatisations — lecture. */
  listAutomations: () =>
    api.query<Automation[]>("marketing_automations.list", (db) =>
      db.from("marketing_automations").select("*").order("priority").order("created_at"),
    ),

  listAutomationRuns: (limit = 60) =>
    api.query<AutomationRun[]>("marketing_automation_runs.list", (db) =>
      db
        .from("marketing_automation_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit),
    ),

  listSegments: () =>
    api.query<SegmentRow[]>("marketing_segments.list", (db) =>
      db.from("marketing_segments").select("id, name").order("name"),
    ),

  /** Automatisations — écriture. */
  saveAutomation: (draft: AutomationDraft) => {
    const payload = toAutomationPayload(draft);
    return draft.id
      ? api.query("marketing_automations.update", (db) =>
          db.from("marketing_automations").update(payload).eq("id", draft.id as string),
        { retries: 1 })
      : api.query("marketing_automations.insert", (db) =>
          db.from("marketing_automations").insert(payload),
        { retries: 1 });
  },

  setAutomationActive: (id: string, active: boolean) =>
    api.query(
      "marketing_automations.toggle",
      (db) => db.from("marketing_automations").update({ active }).eq("id", id),
      { retries: 1 },
    ),

  deleteAutomation: (id: string) =>
    api.query(
      "marketing_automations.delete",
      (db) => db.from("marketing_automations").delete().eq("id", id),
      { retries: 1 },
    ),

  /** Exécution manuelle d'une automatisation (test ou réel). */
  executeAutomation: (automationId: string, mode: "test" | "live") =>
    api.invoke<{ report?: Record<string, unknown>[] }>(
      "run-marketing-automations",
      { mode, automation_id: automationId },
      { retries: 1, timeoutMs: 60_000 },
    ),
};

export type MarketingService = typeof marketingService;