import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Loader2, RefreshCw, Clock, CheckCircle2, XCircle, AlertTriangle, Inbox, RotateCw } from "lucide-react";

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

type QueueRow = {
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

const TIME_RANGES = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7 jours", hours: 168 },
];

const statusBadge = (status: string) => {
  switch (status) {
    case "sent":
      return <Badge className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Envoyé</Badge>;
    case "dlq":
    case "failed":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />DLQ</Badge>;
    case "suppressed":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Supprimé</Badge>;
    case "pending":
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    case "bounced":
      return <Badge variant="destructive">Bounce</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const fmtAge = (iso: string) => {
  const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)} min`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)} h`;
  return `${Math.round(diffSec / 86400)} j`;
};

const ITEMS_PER_PAGE = 50;

const AdminEmailQueueMonitor = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [retryTarget, setRetryTarget] = useState<QueueRow | null>(null);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [selectedRow, setSelectedRow] = useState<QueueRow | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    const { data } = await supabase
      .from("email_send_log")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (data) setLogs(data as EmailLog[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [hours]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchLogs, 15000);
    return () => clearInterval(id);
  }, [autoRefresh, hours]);

  const guessQueue = (row: QueueRow): "auth_emails" | "transactional_emails" => {
    const t = row.template_name.toLowerCase();
    if (t === "auth_emails" || t.includes("auth") || t.includes("signup") || t.includes("magic") ||
        t.includes("recovery") || t.includes("invite") || t.includes("confirm") || t.includes("reauth")) {
      return "auth_emails";
    }
    return "transactional_emails";
  };

  const handleRetry = async () => {
    if (!retryTarget) return;
    const row = retryTarget;
    const queue = guessQueue(row);
    setRetryingIds((prev) => new Set(prev).add(row.message_id));
    setRetryTarget(null);

    const { data, error } = await supabase.functions.invoke("retry-dlq-email", {
      body: { message_id: row.message_id, queue },
    });

    setRetryingIds((prev) => {
      const next = new Set(prev);
      next.delete(row.message_id);
      return next;
    });

    if (error || (data && (data as any).error)) {
      const msg = (data as any)?.error || error?.message || "Erreur inconnue";
      toast.error(`Renvoi impossible : ${msg}`);
      return;
    }
    toast.success(`E-mail remis en file pour ${row.recipient_email}.`);
    fetchLogs();
  };

  // Group by message_id → full lifecycle row per email
  const queueRows = useMemo<QueueRow[]>(() => {
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
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
      (a, b) => new Date(b.last_event_at).getTime() - new Date(a.last_event_at).getTime()
    );
  }, [logs]);

  const stats = useMemo(() => {
    const pending = queueRows.filter((r) => r.current_status === "pending").length;
    const sent = queueRows.filter((r) => r.current_status === "sent").length;
    const dlq = queueRows.filter((r) => r.current_status === "dlq" || r.current_status === "failed").length;
    const suppressed = queueRows.filter((r) => r.current_status === "suppressed").length;
    const stuck = queueRows.filter(
      (r) => r.current_status === "pending" && Date.now() - new Date(r.enqueued_at).getTime() > 15 * 60_000
    ).length;
    return { total: queueRows.length, pending, sent, dlq, suppressed, stuck };
  }, [queueRows]);

  const filtered = useMemo(() => {
    return queueRows.filter((r) => {
      if (statusFilter === "stuck") {
        if (!(r.current_status === "pending" && Date.now() - new Date(r.enqueued_at).getTime() > 15 * 60_000))
          return false;
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
  }, [queueRows, statusFilter, search]);

  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <Button
              key={r.hours}
              variant={hours === r.hours ? "default" : "outline"}
              size="sm"
              onClick={() => { setHours(r.hours); setPage(0); }}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
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
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="max-w-xs"
        />
        <Button
          variant={autoRefresh ? "default" : "outline"}
          size="sm"
          onClick={() => setAutoRefresh((v) => !v)}
        >
          {autoRefresh ? "Auto: ON (15s)" : "Auto: OFF"}
        </Button>
        <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold flex items-center gap-1">
              <Inbox className="w-4 h-4 text-primary" />{stats.total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-blue-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className={stats.stuck > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Bloqués &gt;15min</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-2xl font-bold ${stats.stuck > 0 ? "text-destructive" : ""}`}>{stats.stuck}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Envoyés</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">DLQ</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-destructive">{stats.dlq}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Supprimés</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.suppressed}</div>
          </CardContent>
        </Card>
      </div>

      {loading && logs.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statut</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead className="text-center">Tentatives</TableHead>
                  <TableHead>Enfilé</TableHead>
                  <TableHead>Dernier événement</TableHead>
                  <TableHead>Dernière erreur</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucune entrée trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((r) => {
                    const isStuck =
                      r.current_status === "pending" &&
                      Date.now() - new Date(r.enqueued_at).getTime() > 15 * 60_000;
                    const canRetry = r.current_status === "dlq" || r.current_status === "failed";
                    const isRetrying = retryingIds.has(r.message_id);
                    return (
                      <TableRow
                        key={r.message_id}
                        className={`cursor-pointer ${isStuck ? "bg-destructive/5" : ""}`}
                        onClick={() => setSelectedRow(r)}
                      >
                        <TableCell>
                          {statusBadge(r.current_status)}
                          {isStuck && (
                            <Badge variant="destructive" className="ml-1 text-[10px]">Bloqué</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{r.recipient_email}</TableCell>
                        <TableCell className="font-mono text-xs">{r.template_name}</TableCell>
                        <TableCell className="text-center text-sm">{r.attempts}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap" title={r.enqueued_at}>
                          il y a {fmtAge(r.enqueued_at)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap" title={r.last_event_at}>
                          il y a {fmtAge(r.last_event_at)}
                        </TableCell>
                        <TableCell
                          className="text-xs text-destructive max-w-[280px] truncate"
                          title={r.last_error || ""}
                        >
                          {r.last_error || "—"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {canRetry ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRetryTarget(r)}
                              disabled={isRetrying}
                              className="gap-1"
                            >
                              {isRetrying ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RotateCw className="h-3 w-3" />
                              )}
                              Renvoyer
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      <AlertDialog open={!!retryTarget} onOpenChange={(open) => !open && setRetryTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renvoyer cet e-mail&nbsp;?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <div>
                  L'e-mail va être remis en file d'attente et renvoyé au prochain cycle (≤ 5 s).
                </div>
                {retryTarget && (
                  <div className="rounded border bg-muted/40 p-2 text-xs space-y-1">
                    <div><span className="text-muted-foreground">Destinataire&nbsp;:</span> <span className="font-medium">{retryTarget.recipient_email}</span></div>
                    <div><span className="text-muted-foreground">Template&nbsp;:</span> <span className="font-mono">{retryTarget.template_name}</span></div>
                    <div><span className="text-muted-foreground">Tentatives précédentes&nbsp;:</span> {retryTarget.attempts}</div>
                    {retryTarget.last_error && (
                      <div className="text-destructive break-words">
                        <span className="text-muted-foreground">Dernière erreur&nbsp;:</span> {retryTarget.last_error}
                      </div>
                    )}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Si la cause de l'échec n'a pas été corrigée, le message risque de retomber en DLQ.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRetry}>Renvoyer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEmailQueueMonitor;