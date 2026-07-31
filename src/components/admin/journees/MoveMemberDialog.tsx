import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fr } from "date-fns/locale";
import { RECREDIT_REASONS } from "@/components/admin/RecreditDialog";
import { ACTIVITY_LABEL, type DailyGroup, type Member } from "@/features/admin-journees/types";

interface Props {
  target: { member: Member; group: DailyGroup } | null;
  onClose: () => void;
  moveDate: Date | undefined;
  onMoveDateChange: (d: Date | undefined) => void;
  reason: string;
  onReasonChange: (r: string) => void;
  onConfirm: () => void;
}

export const MoveMemberDialog = ({
  target, onClose, moveDate, onMoveDateChange, reason, onReasonChange, onConfirm,
}: Props) => (
  <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Reporter une réservation</DialogTitle>
        <DialogDescription>
          {target && `${target.member.name} — ${ACTIVITY_LABEL[target.group.activity]}`}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="flex justify-center">
          <Calendar mode="single" selected={moveDate} onSelect={onMoveDateChange} locale={fr}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
        </div>
        <div className="space-y-2">
          <Label>Motif du report</Label>
          <Select value={reason} onValueChange={onReasonChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RECREDIT_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Le paiement et les crédits restent inchangés. Le client reçoit un email avec la nouvelle
          date et le rappel que les horaires sont communiqués la veille par téléphone.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={onConfirm} disabled={!moveDate}>Reporter</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
