import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownAZ, ArrowDownZA, RotateCcw } from "lucide-react";
import {
  eventFilterLabel,
  type DebugFilters,
  type EventFilter,
} from "@/features/admin-conversion-funnel/types";

const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface Props {
  pendingImport: DebugFilters | null;
  setPendingImport: React.Dispatch<React.SetStateAction<DebugFilters | null>>;
  onConfirm: () => void;
  onCancel: () => void;
  onResetEdits: () => void;
}

export const ImportFiltersDialog = ({
  pendingImport,
  setPendingImport,
  onConfirm,
  onCancel,
  onResetEdits,
}: Props) => (
  <Dialog open={!!pendingImport} onOpenChange={(open) => !open && onCancel()}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Importer les filtres</DialogTitle>
        <DialogDescription>
          Vérifiez et modifiez les filtres déduits du fichier JSON avant de les appliquer.
        </DialogDescription>
      </DialogHeader>
      {pendingImport && (
        <div className="space-y-3 py-2">
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 flex flex-wrap gap-3 items-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Résumé</span>
            <Badge variant="secondary" className="text-xs">
              {eventFilterLabel(pendingImport.eventFilter)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {pendingImport.sortNewest ? "Plus récents" : "Plus anciens"}
            </Badge>
            {(pendingImport.appliedDateFrom || pendingImport.appliedDateTo) && (
              <Badge variant="outline" className="text-xs font-mono">
                {pendingImport.appliedDateFrom ? fmtDate(pendingImport.appliedDateFrom) : "—"}
                <span className="mx-1">→</span>
                {pendingImport.appliedDateTo ? fmtDate(pendingImport.appliedDateTo) : "—"}
              </Badge>
            )}
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Événement</Label>
              <Select
                value={pendingImport.eventFilter}
                onValueChange={(v) =>
                  setPendingImport((prev) => prev && { ...prev, eventFilter: v as EventFilter })
                }
              >
                <SelectTrigger className="w-full text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les événements</SelectItem>
                  <SelectItem value="phone_click">Clics téléphone</SelectItem>
                  <SelectItem value="form_submit">Formulaires</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Recherche page</Label>
              <Input
                type="text"
                placeholder="Rechercher une page…"
                value={pendingImport.pageSearch}
                onChange={(e) =>
                  setPendingImport((prev) => prev && { ...prev, pageSearch: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Tri</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setPendingImport((prev) => prev && { ...prev, sortNewest: !prev.sortNewest })
                }
                className="gap-1.5 h-8"
              >
                {pendingImport.sortNewest ? (
                  <ArrowDownZA className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                )}
                <span className="text-xs">
                  {pendingImport.sortNewest ? "Plus récents" : "Plus anciens"}
                </span>
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Plage horaire</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="datetime-local"
                  value={pendingImport.appliedDateFrom}
                  onChange={(e) =>
                    setPendingImport((prev) => prev && { ...prev, appliedDateFrom: e.target.value })
                  }
                  className="h-8 text-xs flex-1"
                />
                <span className="text-xs text-muted-foreground">à</span>
                <Input
                  type="datetime-local"
                  value={pendingImport.appliedDateTo}
                  onChange={(e) =>
                    setPendingImport((prev) => prev && { ...prev, appliedDateTo: e.target.value })
                  }
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <DialogFooter className="gap-2">
        <Button variant="ghost" size="sm" onClick={onResetEdits} className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          Réinitialiser
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={onConfirm}>Confirmer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);