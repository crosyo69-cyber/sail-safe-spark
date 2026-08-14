import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useJoinWaitlist } from "@/hooks/client/useWaitlist";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: string | null;
  activity: string;
  activityLabel: string;
}

export const WaitlistDialog = ({ open, onOpenChange, date, activity, activityLabel }: Props) => {
  const {
    firstName, setFirstName,
    lastName, setLastName,
    email, setEmail,
    phone, setPhone,
    participants, setParticipants,
    valid,
    busy,
    submit,
  } = useJoinWaitlist(date, activity, () => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejoindre la liste d'attente</DialogTitle>
          <DialogDescription>
            {activityLabel}
            {date && ` · ${format(parseISO(date), "EEEE d MMMM yyyy", { locale: fr })}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="wl-first">Prénom</Label>
            <Input id="wl-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wl-last">Nom</Label>
            <Input id="wl-last" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="wl-email">Email</Label>
            <Input id="wl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wl-phone">Téléphone (optionnel)</Label>
            <Input id="wl-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wl-part">Participants</Label>
            <Input id="wl-part" type="number" min={1} max={4} value={participants}
              onChange={(e) => setParticipants(Math.min(4, Math.max(1, Number(e.target.value) || 1)))} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Dès qu'une place se libère, le premier inscrit reçoit un email et dispose de 24 h pour
          confirmer. Les horaires sont communiqués la veille par téléphone selon les conditions
          météorologiques.
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Annuler</Button>
          <Button onClick={submit} disabled={!valid || busy} className="min-h-[44px]">
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            M'inscrire sur la liste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistDialog;