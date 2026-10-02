import { Loader2 } from "lucide-react";
import { useAdminEmailQueue } from "@/hooks/admin/useAdminEmailQueue";
import { QueueToolbar } from "./email-queue/QueueToolbar";
import { QueueStatCards } from "./email-queue/QueueStatCards";
import { QueueCharts } from "./email-queue/QueueCharts";
import { QueueTable } from "./email-queue/QueueTable";
import { RetryDialog } from "./email-queue/RetryDialog";
import { MessageDetailSheet } from "./email-queue/MessageDetailSheet";

const AdminEmailQueueMonitor = () => {
  const q = useAdminEmailQueue();

  return (
    <div className="space-y-6">
      <QueueToolbar
        hours={q.hours}
        setHours={q.setHours}
        statusFilter={q.statusFilter}
        setStatusFilter={q.setStatusFilter}
        search={q.search}
        setSearch={q.setSearch}
        autoRefresh={q.autoRefresh}
        toggleAutoRefresh={q.toggleAutoRefresh}
        refresh={q.refresh}
        loading={q.loading}
        onExportCsv={q.handleExportCSV}
      />

      <QueueStatCards stats={q.stats} />

      {q.queueRows.length > 0 && (
        <QueueCharts
          hours={q.hours}
          templateStatusData={q.templateStatusData}
          avgTimeData={q.avgTimeData}
        />
      )}

      {q.loading && !q.hasLogs ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <QueueTable
          rows={q.paginated}
          retryingIds={q.retryingIds}
          onSelect={q.setSelectedRow}
          onRetry={q.setRetryTarget}
          page={q.page}
          totalPages={q.totalPages}
          setPage={q.setPage}
        />
      )}

      <RetryDialog
        target={q.retryTarget}
        onOpenChange={(open) => !open && q.setRetryTarget(null)}
        onConfirm={q.handleRetry}
      />

      <MessageDetailSheet
        row={q.selectedRow}
        onOpenChange={(open) => !open && q.setSelectedRow(null)}
        onRetry={(row) => {
          q.setRetryTarget(row);
          q.setSelectedRow(null);
        }}
      />
    </div>
  );
};

export default AdminEmailQueueMonitor;
