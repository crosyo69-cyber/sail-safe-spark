import { z } from "zod";

export type RangeKey = "24h" | "7d" | "30d";

export const RANGES: { key: RangeKey; label: string; hours: number }[] = [
  { key: "24h", label: "24 h", hours: 24 },
  { key: "7d", label: "7 jours", hours: 24 * 7 },
  { key: "30d", label: "30 jours", hours: 24 * 30 },
];

export type EventRow = {
  event_type: "page_view" | "phone_click" | "form_submit";
  session_id: string;
  page_path: string | null;
  location: string | null;
  created_at: string;
};

export type LiveEvent = EventRow & { id: string; metadata?: Record<string, unknown> | null };

export type EventFilter = "all" | "phone_click" | "form_submit";

export const debugFiltersSchema = z.object({
  eventFilter: z.enum(["all", "phone_click", "form_submit"]),
  pageSearch: z.string(),
  sortNewest: z.boolean(),
  dateFrom: z.string(),
  dateTo: z.string(),
  appliedDateFrom: z.string(),
  appliedDateTo: z.string(),
});

export type DebugFilters = z.infer<typeof debugFiltersSchema>;

export const DEBUG_FILTERS_STORAGE_KEY = "admin_debug_filters";

export type Stats = {
  visitors: number;
  pageViews: number;
  phoneClicks: number;
  phoneSessions: number;
  formSubmits: number;
  formSessions: number;
  leadSessions: number;
  topPages: { path: string; count: number }[];
};

/** Agrégation métier du tunnel de conversion. */
export function computeStats(rows: EventRow[]): Stats {
  const visitors = new Set<string>();
  const phoneSessions = new Set<string>();
  const formSessions = new Set<string>();
  const leadSessions = new Set<string>();
  const pageCounts = new Map<string, number>();
  let pageViews = 0;
  let phoneClicks = 0;
  let formSubmits = 0;

  for (const r of rows) {
    visitors.add(r.session_id);
    if (r.event_type === "page_view") {
      pageViews += 1;
      const p = r.page_path || "/";
      pageCounts.set(p, (pageCounts.get(p) ?? 0) + 1);
    } else if (r.event_type === "phone_click") {
      phoneClicks += 1;
      phoneSessions.add(r.session_id);
      leadSessions.add(r.session_id);
    } else if (r.event_type === "form_submit") {
      formSubmits += 1;
      formSessions.add(r.session_id);
      leadSessions.add(r.session_id);
    }
  }

  const topPages = [...pageCounts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    visitors: visitors.size,
    pageViews,
    phoneClicks,
    phoneSessions: phoneSessions.size,
    formSubmits,
    formSessions: formSessions.size,
    leadSessions: leadSessions.size,
    topPages,
  };
}

export function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)} %`;
}

export const eventFilterLabel = (f: EventFilter): string =>
  f === "all" ? "Tous les événements" : f === "phone_click" ? "Clics téléphone" : "Formulaires";