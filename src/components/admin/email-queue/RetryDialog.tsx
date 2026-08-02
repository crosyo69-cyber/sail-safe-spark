import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { QueueRow } from "@/features/admin-email-queue/types";

interface Props {
  target: QueueRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const RetryDialog = ({ target, onOpenChange, onConfirm }: Props) => (
  <AlertDialog open={!!target} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Renvoyer cet e-mail&nbsp;?</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-2 text-sm">
            <div>L'e-mail va être remis en file d'attente et renvoyé au prochain cycle (≤ 5 s).</div>
            {target && (
              <div className="rounded border bg-muted/40 p-2 text-xs space-y-1">
                <div><span className="text-muted-foreground">Destinataire&nbsp;:</span> <span className="font-medium">{target.recipient_email}</span></div>
                <div><span className="text-muted-foreground">Template&nbsp;:</span> <span className="font-mono">{target.template_name}</span></div>
                <div><span className="text-muted-foreground">Tentatives précédentes&nbsp;:</span> {target.attempts}</div>
                {target.last_error && (
                  <div className="text-destructive break-words">
                    <span className="text-muted-foreground">Dernière erreur&nbsp;:</span> {target.last_error}
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
        <AlertDialogAction onClick={onConfirm}>Renvoyer</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
