/* eslint-disable @typescript-eslint/no-explicit-any -- metadata JSON is untyped */

export type EmailLog = {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  metadata: any;
  created_at: string;
};

export type QueueRow = {
  message_id: string;
  template_name: string;
  recipient_email: string;
  current_status: string;
  attempts: number;
  enqueued_at: string;
  last_event_at: string;
  last_error: string | null;
  history: { status: string; at: string; error: string | null }[];
  entries: EmailLog[];
};

export const TIME_RANGES = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7 jours", hours: 168 },
];

export const ITEMS_PER_PAGE = 50;

/** Seuil au-delà duquel un message "pending" est considéré bloqué. */
export const STUCK_THRESHOLD_MS = 15 * 60_000;

export const isStuck = (r: QueueRow): boolean =>
  r.current_status === "pending" && Date.now() - new Date(r.enqueued_at).getTime() > STUCK_THRESHOLD_MS;

export const canRetry = (r: QueueRow): boolean =>
  r.current_status === "dlq" || r.current_status === "failed";

export const fmtAge = (iso: string) => {
  const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)} min`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)} h`;
  return `${Math.round(diffSec / 86400)} j`;
};

/** Déduit la file d'origine à partir du nom de template. */
export const guessQueue = (row: QueueRow): "auth_emails" | "transactional_emails" => {
  const t = row.template_name.toLowerCase();
  if (
    t === "auth_emails" ||
    t.includes("auth") ||
    t.includes("signup") ||
    t.includes("magic") ||
    t.includes("recovery") ||
    t.includes("invite") ||
    t.includes("confirm") ||
    t.includes("reauth")
  ) {
    return "auth_emails";
  }
  return "transactional_emails";
};

/** Regroupe les logs par message_id → cycle de vie complet. */
export const buildQueueRows = (logs: EmailLog[]): QueueRow[] => {
  const groups = new Map<string, EmailLog[]>();
  for (const log of logs) {
    const key = log.message_id || log.id;
    const arr = groups.get(key) || [];
    arr.push(log);
    groups.set(key, arr);
  }
  const rows: QueueRow[] = [];
  for (const [key, arr] of groups) {
    const sorted = [...arr].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const latest = sorted[sorted.length - 1];
    const firstError = [...sorted].reverse().find((r) => r.error_message)?.error_message ?? null;
    rows.push({
      message_id: key,
      template_name: latest.template_name,
      recipient_email: latest.recipient_email,
      current_status: latest.status,
      attempts: sorted.length,
      enqueued_at: sorted[0].created_at,
      last_event_at: latest.created_at,
      last_error: firstError,
      history: sorted.map((r) => ({ status: r.status, at: r.created_at, error: r.error_message })),
      entries: sorted,
    });
  }
  return rows.sort(
    (a, b) => new Date(b.last_event_at).getTime() - new Date(a.last_event_at).getTime(),
  );
};

export type QueueStats = {
  total: number;
  pending: number;
  sent: number;
  dlq: number;
  suppressed: number;
  stuck: number;
};

export const computeQueueStats = (rows: QueueRow[]): QueueStats => ({
  total: rows.length,
  pending: rows.filter((r) => r.current_status === "pending").length,
  sent: rows.filter((r) => r.current_status === "sent").length,
  dlq: rows.filter((r) => r.current_status === "dlq" || r.current_status === "failed").length,
  suppressed: rows.filter((r) => r.current_status === "suppressed").length,
  stuck: rows.filter(isStuck).length,
});

export const filterQueueRows = (
  rows: QueueRow[],
  statusFilter: string,
  search: string,
): QueueRow[] =>
  rows.filter((r) => {
    if (statusFilter === "stuck") {
      if (!isStuck(r)) return false;
    } else if (statusFilter !== "all" && r.current_status !== statusFilter) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.recipient_email.toLowerCase().includes(q) &&
        !r.template_name.toLowerCase().includes(q) &&
        !(r.message_id || "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

export type TemplateStatusDatum = {
  name: string;
  pending: number;
  sent: number;
  dlq: number;
  suppressed: number;
  bounced: number;
  total: number;
};

export const buildTemplateStatusData = (rows: QueueRow[]): TemplateStatusDatum[] => {
  const map = new Map<string, Omit<TemplateStatusDatum, "name">>();
  for (const r of rows) {
    const t = r.template_name;
    if (!map.has(t)) map.set(t, { pending: 0, sent: 0, dlq: 0, suppressed: 0, bounced: 0, total: 0 });
    const entry = map.get(t)!;
    entry.total++;
    if (r.current_status === "pending") entry.pending++;
    else if (r.current_status === "sent") entry.sent++;
    else if (r.current_status === "dlq" || r.current_status === "failed") entry.dlq++;
    else if (r.current_status === "suppressed") entry.suppressed++;
    else if (r.current_status === "bounced") entry.bounced++;
  }
  return Array.from(map.entries())
    .map(([name, vals]) => ({ name, ...vals }))
    .sort((a, b) => b.total - a.total);
};

export const buildAvgTimeData = (rows: QueueRow[]): { name: string; avgSec: number }[] => {
  const sums = new Map<string, { totalMs: number; count: number }>();
  for (const r of rows) {
    if (r.current_status !== "sent") continue;
    const t = r.template_name;
    const ms = new Date(r.last_event_at).getTime() - new Date(r.enqueued_at).getTime();
    const prev = sums.get(t) || { totalMs: 0, count: 0 };
    sums.set(t, { totalMs: prev.totalMs + ms, count: prev.count + 1 });
  }
  return Array.from(sums.entries())
    .map(([name, { totalMs, count }]) => ({
      name,
      avgSec: count > 0 ? Math.round(totalMs / count / 1000) : 0,
    }))
    .sort((a, b) => b.avgSec - a.avgSec);
};

/** Export CSV (séparateur ;, BOM UTF-8). */
export const buildQueueCsv = (rows: QueueRow[]): string => {
  const escapeCsv = (val: string) => {
    const str = String(val ?? "");
    if (str.includes(";") || str.includes("\n") || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    "Statut",
    "Destinataire",
    "Template",
    "Tentatives",
    "Enfile a",
    "Dernier evenement",
    "Derniere erreur",
  ];
  const lines = rows.map((r) =>
    [
      escapeCsv(r.current_status),
      escapeCsv(r.recipient_email),
      escapeCsv(r.template_name),
      escapeCsv(String(r.attempts)),
      escapeCsv(new Date(r.enqueued_at).toLocaleString("fr-FR")),
      escapeCsv(new Date(r.last_event_at).toLocaleString("fr-FR")),
      escapeCsv(r.last_error ?? ""),
    ].join(";"),
  );

  return "\ufeff" + headers.map(escapeCsv).join(";") + "\n" + lines.join("\n");
};