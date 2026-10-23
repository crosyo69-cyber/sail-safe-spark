import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAdminSms } from "@/hooks/admin/useAdminSms";
import type { AppointmentSmsResultItem } from "@/services/sms.service";
import { ACTIVITY_LABEL, type Member } from "@/features/admin-journees/types";

export interface SmsTarget {
  dateIso: string;
  activity: string;
  groupId: string | null;
  members: Member[];
}

const STATUS_LABEL: Record<string, string> = {
  sent: "Envoyé",
  failed: "Échec",
  unknown: "Incertain",
  duplicate: "Déjà envoyé",
};

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  failed: "bg-rose-500/10 text-rose-700 border-rose-500/30",
  unknown: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  duplicate: "bg-muted text-muted-foreground border-border",
};

const buildTemplate = (dateIso: string, activity: string, spot: string, horaire: string) => {
  const dateFr = format(new Date(`${dateIso}T12:00:00`), "EEEE d MMMM", { locale: fr });
  return `Kitesurf Passion : RDV ${dateFr} à ${horaire || "…"} — spot : ${spot || "…"} (${ACTIVITY_LABEL[activity] ?? activity}). À très vite !`;
};

/**
 * Dialogue d'envoi manuel de SMS de rendez-vous (spot/horaire).
 * Jamais d'envoi automatique : prévisualisation des destinataires et du
 * contenu, puis confirmation explicite par le moniteur.
 */
export const AppointmentSmsDialog = ({
  target,
  onClose,
}: {
  target: SmsTarget | null;
  onClose: () => void;
}) => {
  const { send } = useAdminSms();
  const [spot, setSpot] = useState("");
  const [horaire, setHoraire] = useState("");
  const [message, setMessage] = useState("");
  const [messageTouched, setMessageTouched] = useState(false);
  const [results, setResults] = useState<AppointmentSmsResultItem[] | null>(null);

  const recipients = useMemo(
    () => (target ? target.members.filter((m) => (m.phone ?? "").trim() !== "") : []),
    [target],
  );
  const withoutPhone = target ? target.members.length - recipients.length : 0;

  // Réinitialisation à chaque ouverture ; le message suit le modèle tant que
  // le moniteur ne l'a pas modifié à la main.
  useEffect(() => {
    if (!target) return;
    setSpot("");
    setHoraire("");
    setResults(null);
    setMessageTouched(false);
    setMessage(buildTemplate(target.dateIso, target.activity, "", ""));
  }, [target]);

  useEffect(() => {
    if (!target || messageTouched) return;
    setMessage(buildTemplate(target.dateIso, target.activity, spot, horaire));
  }, [spot, horaire, target, messageTouched]);

  const doSend = async (resend: boolean) => {
    if (!target) return;
    try {
      const data = await send.mutateAsync({
        date: target.dateIso,
        activity: target.activity,
        groupId: target.groupId,
        message: message.trim(),
        resend,
        recipients: recipients.map((m) => ({
          reservationId: m.kind === "visitor" ? m.id : null,
          name: m.name,
          phone: m.phone ?? "",
        })),
      });
      setResults(data.results);
      if (data.sent > 0) toast.success(`${data.sent} SMS envoyé(s).`);
      if (data.skipped > 0) toast.info(`${data.skipped} déjà envoyé(s) : aucun doublon créé.`);
      if (data.failed > 0) toast.error(`${data.failed} envoi(s) en échec ou incertain(s).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const hasDuplicates = (results ?? []).some((r) => r.status === "duplicate");

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            SMS de rendez-vous
          </DialogTitle>
          <DialogDescription>
            {target && (
              <>
                {ACTIVITY_LABEL[target.activity] ?? target.activity} ·{" "}
                {format(new Date(`${target.dateIso}T12:00:00`), "dd/MM/yyyy")} — l'envoi n'est
                jamais automatique : vérifiez puis confirmez.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium" htmlFor="sms-spot">Spot</label>
              <Input
                id="sms-spot"
                value={spot}
                onChange={(e) => setSpot(e.target.value)}
                placeholder="Port de Carqueiranne"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="sms-horaire">Horaire</label>
              <Input
                id="sms-horaire"
                value={horaire}
                onChange={(e) => setHoraire(e.target.value)}
                placeholder="9h00"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="sms-message">Contenu du SMS</label>
            <Textarea
              id="sms-message"
              rows={4}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setMessageTouched(true);
              }}
              maxLength={459}
            />
            <p className="text-xs text-muted-foreground mt-1">{message.trim().length}/459 caractères.</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              Destinataires ({recipients.length})
              {withoutPhone > 0 && (
                <span className="text-muted-foreground font-normal">
                  {" "}— {withoutPhone} sans téléphone, non inclus
                </span>
              )}
            </p>
            {recipients.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Aucun participant avec un numéro de téléphone.
              </p>
            ) : (
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {recipients.map((m) => {
                  const r = results?.find(
                    (x) => x.name === m.name && (m.phone ?? "").replace(/\D/g, "").endsWith(x.phone_last4),
                  );
                  return (
                    <li
                      key={`${m.kind}-${m.id}`}
                      className="flex items-center justify-between gap-2 text-sm p-2 rounded-md bg-muted/40"
                    >
                      <span className="truncate">
                        {m.name} <span className="text-muted-foreground">· {m.phone}</span>
                      </span>
                      {r && (
                        <Badge variant="outline" className={STATUS_STYLE[r.status] ?? ""}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {hasDuplicates && (
            <Button
              variant="outline"
              onClick={() => void doSend(true)}
              disabled={send.isPending}
            >
              Renvoyer malgré tout (renvoi manuel)
            </Button>
          )}
          <Button
            onClick={() => void doSend(false)}
            disabled={
              send.isPending || recipients.length === 0 || message.trim().length === 0
            }
          >
            {send.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Confirmer l'envoi ({recipients.length} SMS)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
