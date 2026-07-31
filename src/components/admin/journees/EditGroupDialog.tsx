import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVITY_LABEL, type DailyGroup } from "@/features/admin-journees/types";

interface Props {
  group: DailyGroup | null;
  onGroupChange: (g: DailyGroup | null) => void;
  onSave: () => void;
}

export const EditGroupDialog = ({ group, onGroupChange, onSave }: Props) => (
  <Dialog open={!!group} onOpenChange={(o) => !o && onGroupChange(null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Modifier le groupe</DialogTitle>
        <DialogDescription>
          {group && `${ACTIVITY_LABEL[group.activity]} · Groupe #${group.group_index}`}
        </DialogDescription>
      </DialogHeader>
      {group && (
        <div className="space-y-4">
          <div>
            <Label>Capacité maximale</Label>
            <Input type="number" min={1} max={10} value={group.max_participants}
              onChange={(e) => onGroupChange({ ...group, max_participants: parseInt(e.target.value) || 1 })} />
            <p className="text-xs text-muted-foreground mt-1">
              Occupation actuelle : {group.taken}. Défaut : Kite 4 / Wing 3.
            </p>
          </div>
          <div>
            <Label>Statut</Label>
            <div className="flex gap-2 mt-1">
              {(["open", "closed", "cancelled"] as const).map((s) => (
                <Button key={s} type="button" size="sm"
                  variant={group.status === s ? "default" : "outline"}
                  onClick={() => onGroupChange({ ...group, status: s })}>
                  {s === "open" ? "Ouvert" : s === "closed" ? "Fermé" : "Annulé"}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>Notes internes</Label>
            <Textarea value={group.notes || ""} onChange={(e) => onGroupChange({ ...group, notes: e.target.value })} rows={3} />
          </div>
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={() => onGroupChange(null)}>Annuler</Button>
        <Button onClick={onSave}>Enregistrer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
