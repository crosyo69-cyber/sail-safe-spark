import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "crm" });

export interface CrmListParams {
  query?: string | null;
  activity?: string;
  status?: string;
  consent?: string;
  limit?: number;
}

export const crmService = {
  dashboard: () => api.rpc("crm_dashboard"),

  listClients: (p: CrmListParams) =>
    api.rpc("crm_list_clients", {
      p_query: p.query || null,
      p_activity: p.activity ?? "all",
      p_status: p.status ?? "all",
      p_consent: p.consent ?? "all",
      p_limit: p.limit ?? 500,
    }),

  clientDetail: (email: string) => api.rpc("crm_client_detail", { p_email: email }),
  upsertProfile: (args: Record<string, unknown>) =>
    api.rpc("crm_upsert_profile", args, { retries: 1 }),
  setLevel: (args: Record<string, unknown>) => api.rpc("crm_set_level", args, { retries: 1 }),
  addDocument: (args: Record<string, unknown>) => api.rpc("crm_add_document", args, { retries: 1 }),
  deleteDocument: (args: Record<string, unknown>) =>
    api.rpc("crm_delete_document", args, { retries: 1 }),
};

export type CrmService = typeof crmService;