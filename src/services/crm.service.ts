import { paymentAccountingService } from "./payment-accounting.service";
import { mapResult, settle } from "./_shared/result";
import { paymentAmounts } from "@/features/payment/accounting";
import type { CrmDetail, CrmClient, CrmDashboardStats } from "@/components/admin/crm-types";
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
  dashboard: async () => mapResult(await api.rpc<CrmDashboardStats>("crm_dashboard"), d => ({
    ...d, total_revenue: null, revenue_per_client: null, avg_basket: null,
  })),

  listClients: async (p: CrmListParams) =>
    mapResult(await api.rpc<CrmClient[]>("crm_list_clients", {
      p_query: p.query || null,
      p_activity: p.activity ?? "all",
      p_status: p.status ?? "all",
      p_consent: p.consent ?? "all",
      p_limit: p.limit ?? 500,
    }), clients => clients.map(c => ({ ...c, revenue: null }))),

  clientDetail: async (email: string) => {
    const [detail, ledger] = await Promise.all([
      api.rpc<CrmDetail>("crm_client_detail", { p_email: email }),
      paymentAccountingService.ledger(email),
    ]);
    const evidence = settle(ledger).data;
    return mapResult(detail, d => {
      const seen = new Set<string>();
      const payments = d.payments.filter(p => {
        if (!p.stripe_session_id || seen.has(p.stripe_session_id)) return false;
        seen.add(p.stripe_session_id); return true;
      }).map(p => {
        const receipt = evidence?.find(e => e.stripe_session_id === p.stripe_session_id);
        return { ...p, amount: paymentAmounts(receipt).received };
      });
      return { ...d, payments, summary: d.summary ? { ...d.summary,
        revenue: !evidence || payments.some(p => p.amount === null) ? null : evidence.reduce((sum,p) => sum + (paymentAmounts(p).received ?? 0), 0),
      } : null };
    });
  },
  upsertProfile: (args: Record<string, unknown>) =>
    api.rpc("crm_upsert_profile", args, { retries: 1 }),
  setLevel: (args: Record<string, unknown>) => api.rpc("crm_set_level", args, { retries: 1 }),
  addDocument: (args: Record<string, unknown>) => api.rpc("crm_add_document", args, { retries: 1 }),
  deleteDocument: (args: Record<string, unknown>) =>
    api.rpc("crm_delete_document", args, { retries: 1 }),
};

export type CrmService = typeof crmService;