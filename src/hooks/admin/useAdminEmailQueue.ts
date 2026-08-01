import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useEmailQueue } from "@/hooks/services/useEmailQueue";
import {
  ITEMS_PER_PAGE,
  buildAvgTimeData,
  buildQueueCsv,
  buildQueueRows,
  buildTemplateStatusData,
  computeQueueStats,
  filterQueueRows,
  guessQueue,
  type QueueRow,
} from "@/features/admin-email-queue/types";

/** Logique de présentation du moniteur de file d'e-mails. */
export const useAdminEmailQueue = () => {
  const { useLogs, useRetryDlq, invalidate } = useEmailQueue();

  const [hours, setHours] = useState(24);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [retryTarget, setRetryTarget] = useState<QueueRow | null>(null);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [selectedRow, setSelectedRow] = useState<QueueRow | null>(null);

  const logsQuery = useLogs(hours, autoRefresh);
  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);
  const retry = useRetryDlq();

  useEffect(() => {
    setPage(0);
  }, [hours, statusFilter, search]);

  const queueRows = useMemo(() => buildQueueRows(logs), [logs]);
  const stats = useMemo(() => computeQueueStats(queueRows), [queueRows]);
  const filtered = useMemo(
    () => filterQueueRows(queueRows, statusFilter, search),
    [queueRows, statusFilter, search],
  );
  const templateStatusData = useMemo(() => buildTemplateStatusData(queueRows), [queueRows]);
  const avgTimeData = useMemo(() => buildAvgTimeData(queueRows), [queueRows]);

  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const handleRetry = async () => {
    if (!retryTarget) return;
    const row = retryTarget;
    setRetryingIds((prev) => new Set(prev).add(row.message_id));
    setRetryTarget(null);

    try {
      const data = await retry.mutateAsync({
        messageId: row.message_id,
        queue: guessQueue(row),
      });
      if (data && data.error) {
        toast.error(`Renvoi impossible : ${data.error}`);
        return;
      }
      toast.success(`E-mail remis en file pour ${row.recipient_email}.`);
      invalidate();
    } catch (e) {
      toast.error(`Renvoi impossible : ${(e as Error).message || "Erreur inconnue"}`);
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.message_id);
        return next;
      });
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.info("Aucune donnée à exporter pour les filtres actuels.");
      return;
    }
    const blob = new Blob([buildQueueCsv(filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emails-${statusFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} ligne(s) exportée(s) en CSV.`);
  };

  return {
    loading: logsQuery.isFetching,
    hasLogs: logs.length > 0,
    hours,
    setHours,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    autoRefresh,
    toggleAutoRefresh: () => setAutoRefresh((v) => !v),
    refresh: () => logsQuery.refetch(),
    handleExportCSV,

    queueRows,
    stats,
    templateStatusData,
    avgTimeData,

    paginated,
    page,
    setPage,
    totalPages,

    retryTarget,
    setRetryTarget,
    retryingIds,
    handleRetry,
    selectedRow,
    setSelectedRow,
  };
};