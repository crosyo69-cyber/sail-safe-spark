import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RotateCw } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { canRetry, fmtAge, type QueueRow } from "@/features/admin-email-queue/types";

interface Props {
  row: QueueRow | null;
  onOpenChange: (open: boolean) => void;
  onRetry: (row: QueueRow) => void;
}

export const MessageDetailSheet = ({ row, onOpenChange, onRetry }: Props) => (
  <Sheet open={!!row} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
      {row && (
        <>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Détail du message
              <StatusBadge status={row.current_status} />
            </SheetTitle>
            <SheetDescription className="break-all font-mono text-xs">{row.message_id}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Destinataire</span>
                <span className="col-span-2 font-medium break-all">{row.recipient_email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Template</span>
                <span className="col-span-2 font-mono text-xs">{row.template_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Tentatives</span>
                <span className="col-span-2">{row.attempts}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Enfilé</span>
                <span className="col-span-2 text-xs">{new Date(row.enqueued_at).toLocaleString("fr-FR")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Dernier événement</span>
                <span className="col-span-2 text-xs">{new Date(row.last_event_at).toLocaleString("fr-FR")}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Historique (timeline)</h3>
              <ol className="relative border-l-2 border-border ml-2 space-y-4">
                {row.entries.map((e, i) => (
                  <li key={e.id} className="ml-4">
                    <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={e.status} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString("fr-FR")} · il y a {fmtAge(e.created_at)}
                      </span>
                      <span className="text-xs text-muted-foreground">#{i + 1}</span>
                    </div>
                    {e.error_message && (
                      <div className="mt-1 text-xs text-destructive break-words rounded bg-destructive/10 p-2">
                        {e.error_message}
                      </div>
                    )}
                    {e.metadata && Object.keys(e.metadata).length > 0 && (
                      <details className="mt-1 text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Métadonnées
                        </summary>
                        <pre className="mt-1 rounded bg-muted/50 p-2 overflow-x-auto text-[11px] leading-tight">
{JSON.stringify(e.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {canRetry(row) && (
              <Button onClick={() => onRetry(row)} className="w-full gap-2">
                <RotateCw className="h-4 w-4" />
                Renvoyer cet e-mail
              </Button>
            )}
          </div>
        </>
      )}
    </SheetContent>
  </Sheet>
);
