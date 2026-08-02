import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCw } from "lucide-react";
import { TIME_RANGES } from "@/features/admin-email-queue/types";

interface Props {
  hours: number;
  setHours: (h: number) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  autoRefresh: boolean;
  toggleAutoRefresh: () => void;
  refresh: () => void;
  loading: boolean;
  onExportCsv: () => void;
}

export const QueueToolbar = ({
  hours, setHours, statusFilter, setStatusFilter, search, setSearch,
  autoRefresh, toggleAutoRefresh, refresh, loading, onExportCsv,
}: Props) => (
  <div className="flex flex-wrap gap-3 items-center">
    <div className="flex gap-1">
      {TIME_RANGES.map((r) => (
        <Button
          key={r.hours}
          variant={hours === r.hours ? "default" : "outline"}
          size="sm"
          onClick={() => setHours(r.hours)}
        >
          {r.label}
        </Button>
      ))}
    </div>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tous les statuts</SelectItem>
        <SelectItem value="pending">En attente</SelectItem>
        <SelectItem value="stuck">Bloqués (&gt;15 min)</SelectItem>
        <SelectItem value="sent">Envoyés</SelectItem>
        <SelectItem value="dlq">DLQ / Échec</SelectItem>
        <SelectItem value="suppressed">Supprimés</SelectItem>
      </SelectContent>
    </Select>
    <Input
      placeholder="Rechercher email, template, message_id..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="max-w-xs"
    />
    <Button variant={autoRefresh ? "default" : "outline"} size="sm" onClick={toggleAutoRefresh}>
      {autoRefresh ? "Auto: ON (15s)" : "Auto: OFF"}
    </Button>
    <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
    </Button>
    <Button variant="outline" size="sm" onClick={onExportCsv} className="gap-1">
      <Download className="w-4 h-4" />
      Export CSV
    </Button>
  </div>
);
