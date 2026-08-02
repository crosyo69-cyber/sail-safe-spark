import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RotateCw } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { canRetry, fmtAge, isStuck, type QueueRow } from "@/features/admin-email-queue/types";

interface Props {
  rows: QueueRow[];
  retryingIds: Set<string>;
  onSelect: (row: QueueRow) => void;
  onRetry: (row: QueueRow) => void;
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
}

export const QueueTable = ({
  rows, retryingIds, onSelect, onRetry, page, totalPages, setPage,
}: Props) => (
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
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                Aucune entrée trouvée.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => {
              const stuck = isStuck(r);
              const isRetrying = retryingIds.has(r.message_id);
              return (
                <TableRow
                  key={r.message_id}
                  className={`cursor-pointer ${stuck ? "bg-destructive/5" : ""}`}
                  onClick={() => onSelect(r)}
                >
                  <TableCell>
                    <StatusBadge status={r.current_status} />
                    {stuck && <Badge variant="destructive" className="ml-1 text-[10px]">Bloqué</Badge>}
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
                  <TableCell className="text-xs text-destructive max-w-[280px] truncate" title={r.last_error || ""}>
                    {r.last_error || "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canRetry(r) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetry(r)}
                        disabled={isRetrying}
                        className="gap-1"
                      >
                        {isRetrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
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
);
