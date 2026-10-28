import { createApiClient } from "./_shared/api";
import { mapResult } from "./_shared/result";
import { maskUnverifiedFinancials } from "../../supabase/functions/_shared/financial-provenance";

const api = createApiClient({ scope: "assistant" });

export const assistantService = {
  briefing: async () => mapResult(await api.rpc("assistant_briefing"), maskUnverifiedFinancials),
  financialSummary: async (args?: Record<string, unknown>) =>
    mapResult(await api.rpc("assistant_financial_summary", args), maskUnverifiedFinancials),

  listActions: (args?: Record<string, unknown>) => api.rpc("assistant_list_actions", args),
  validateAction: (args: Record<string, unknown>) =>
    api.rpc("assistant_validate_action", args, { retries: 1 }),
  cancelAction: (args: Record<string, unknown>) =>
    api.rpc("assistant_cancel_action", args, { retries: 1 }),

  prepareAction: (body: Record<string, unknown>) =>
    api.invoke("assistant-prepare-action", body, { retries: 1, timeoutMs: 60_000 }),
};

export type AssistantService = typeof assistantService;