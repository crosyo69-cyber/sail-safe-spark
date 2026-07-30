import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, RotateCcw } from "lucide-react";

export const RECREDIT_REASONS = [
  { value: "Pas de vent", label: "🌬️ Pas de vent" },
  { value: "Trop de vent", label: "💨 Trop de vent" },
  { value: "Mauvaise météo", label: "⛈️ Mauvaise météo" },
  { value: "Panne bateau", label: "🚤 Panne bateau" },
  { value: "Annulation école", label: "👨‍🏫 Annulation école" },
  { value: "Autre", label: "✍️ Autre" },
];

export type RecreditPayload = { reason: string; sessions: number };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  /** Masque le sélecteur de quantité (cas « annuler et recréditer » = 1 séance). */
  fixedSessions?: number;
  confirmLabel?: string;
  onConfirm: (payload: RecreditPayload) => Promise<void>;
}

export const RecreditDialog = ({
  open, onOpenChange, title = "Recréditer une séance", description,
  fixedSessions, confirmLabel = "Confirmer le recrédit", onConfirm,
}: Props) => {
  const [reason, setReason] = useState(RECREDIT_REASONS[0].value);
  const [customReason, setCustomReason] = useState("");
  const [sessions, setSessions] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setReason(RECREDIT_REASONS[0].value);
      setCustomReason("");
      setSessions(fixedSessions ?? 1);
      setBusy(false);
    }
  }, [open, fixedSessions]);

  const finalReason = reason === "Autre" ? customReason.trim() : reason;
  const valid = finalReason.length >= 3 && sessions >= 1;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await onConfirm({ reason: finalReason, sessions: fixedSessions ?? sessions });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> {title}
          </DialogTitle>
          {description && <DialogDescription asChild><div>{description}</div></DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Motif</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECREDIT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === "Autre" && (
            <div className="space-y-2">
              <Label htmlFor="recredit-custom">Précisez le motif</Label>
              <Textarea
                id="recredit-custom"
                rows={2}
                placeholder="Ex : moniteur indisponible"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            </div>
          )}

          {fixedSessions === undefined && (
            <div className="space-y-2">
              <Label htmlFor="recredit-count">Nombre de séances à recréditer</Label>
              <Input
                id="recredit-count"
                type="number"
                min={1}
                max={20}
                value={sessions}
                onChange={(e) => setSessions(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Le paiement Stripe et l'historique de réservation ne sont pas modifiés. Le client reçoit
            un email l'invitant à choisir une nouvelle date.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Annuler</Button>
          <Button onClick={submit} disabled={!valid || busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecreditDialog;
