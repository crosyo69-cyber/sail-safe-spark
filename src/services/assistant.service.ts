import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "assistant" });

export const assistantService = {
  briefing: () => api.rpc("assistant_briefing"),
  financialSummary: (args?: Record<string, unknown>) =>
    api.rpc("assistant_financial_summary", args),

  listActions: (args?: Record<string, unknown>) => api.rpc("assistant_list_actions", args),
  validateAction: (args: Record<string, unknown>) =>
    api.rpc("assistant_validate_action", args, { retries: 1 }),
  cancelAction: (args: Record<string, unknown>) =>
    api.rpc("assistant_cancel_action", args, { retries: 1 }),

  prepareAction: (body: Record<string, unknown>) =>
    api.invoke("assistant-prepare-action", body, { retries: 1, timeoutMs: 60_000 }),
};

export type AssistantService = typeof assistantService;