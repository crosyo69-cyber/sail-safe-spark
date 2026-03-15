import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Mail, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

type EmailLog = {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  metadata: any;
  created_at: string;
};

const TIME_RANGES = [
  { label: "24h", value: "24h", hours: 24 },
  { label: "7 jours", value: "7d", hours: 168 },
  { label: "30 jours", value: "30d", hours: 720 },
];

const STATUS_OPTIONS = [
  { label: "Tous", value: "all" },
  { label: "Envoyé", value: "sent" },
  { label: "Échoué", value: "dlq" },
  { label: "Supprimé", value: "suppressed" },
  { label: "En attente", value: "pending" },
];

const statusBadge = (status: string) => {
  switch (status) {
    case "sent":
      return <Badge className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Envoyé</Badge>;
    case "dlq":
    case "failed":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Échoué</Badge>;
    case "suppressed":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Supprimé</Badge>;
    case "pending":
      return <Badge variant="secondary">En attente</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const ITEMS_PER_PAGE = 50;

const AdminEmailDashboard = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [page, setPage] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    const range = TIME_RANGES.find((r) => r.value === timeRange)!;
    const since = new Date(Date.now() - range.hours * 3600000).toISOString();

    const { data, error } = await supabase
      .from("email_send_log")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!error && data) {
      setLogs(data as EmailLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [timeRange]);

  // Deduplicate by message_id (keep latest per message_id)
  const dedupedLogs = useMemo(() => {
    const map = new Map<string, EmailLog>();
    for (const log of logs) {
      const key = log.message_id || log.id;
      const existing = map.get(key);
      if (!existing || new Date(log.created_at) > new Date(existing.created_at)) {
        map.set(key, log);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [logs]);

  // Get unique template names
  const templateNames = useMemo(() => {
    const names = new Set(dedupedLogs.map((l) => l.template_name));
    return Array.from(names).sort();
  }, [dedupedLogs]);

  // Apply filters
  const filtered = useMemo(() => {
    return dedupedLogs.filter((log) => {
      if (statusFilter !== "all" && log.status !== statusFilter) return false;
      if (templateFilter !== "all" && log.template_name !== templateFilter) return false;
      return true;
    });
  }, [dedupedLogs, statusFilter, templateFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = dedupedLogs.length;
    const sent = dedupedLogs.filter((l) => l.status === "sent").length;
    const failed = dedupedLogs.filter((l) => l.status === "dlq" || l.status === "failed").length;
    const suppressed = dedupedLogs.filter((l) => l.status === "suppressed").length;
    const pending = dedupedLogs.filter((l) => l.status === "pending").length;
    return { total, sent, failed, suppressed, pending };
  }, [dedupedLogs]);

  // Pagination
  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <Button
              key={r.value}
              variant={timeRange === r.value ? "default" : "outline"}
              size="sm"
              onClick={() => { setTimeRange(r.value); setPage(0); }}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={templateFilter} onValueChange={(v) => { setTemplateFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Type d'email" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {templateNames.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />{stats.total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Envoyés</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Échoués</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Supprimés</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.suppressed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Erreur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun email trouvé pour cette période.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.template_name}</TableCell>
                      <TableCell className="text-sm">{log.recipient_email}</TableCell>
                      <TableCell>{statusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("fr-FR", {
                          day: "2-digit", month: "2-digit", year: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                        {log.error_message || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground self-center">
                {page + 1} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminEmailDashboard;
