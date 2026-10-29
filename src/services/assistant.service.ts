import { createApiClient } from "./_shared/api";
import { mapResult } from "./_shared/result";
import { maskUnverifiedFinancials } from "../../supabase/functions/_shared/financial-provenance";

const api = createApiClient({ scope: "assistant" });

export const assistantService = {
  briefing: async () => mapResult(await api.rpc("assistant_briefing"), data => maskUnverifiedFinancials(data)),
  financialSummary: async (args?: Record<string, unknown>) =>
    mapResult(await api.rpc("assistant_financial_summary", args), data => maskUnverifiedFinancials(data)),

  listActions: (args?: Record<string, unknown>) => api.rpc("assistant_list_actions", args),
  validateAction: (args: Record<string, unknown>) =>
    api.rpc("assistant_validate_action", args, { retries: 1 }),
  cancelAction: (args: Record<string, unknown>) =>
    api.rpc("assistant_cancel_action", args, { retries: 1 }),

  prepareAction: (body: Record<string, unknown>) =>
    api.invoke("assistant-prepare-action", body, { retries: 1, timeoutMs: 60_000 }),

  /** Preview only: the server never sends when called by an admin. */
  dailyBriefingPreview: () =>
    api.invoke<DailyBriefingPreview>("daily-briefing", { preview: true }, { retries: 0, timeoutMs: 90_000 }),
};

export interface DailyBriefingPreview {
  preview: true;
  recipient: string;
  period: { day: string; label: string; from: string; to: string; timezone: string };
  facts: Record<string, unknown>;
  ai_text: string | null;
  already_sent_today: boolean;
};

export type AssistantService = typeof assistantService;