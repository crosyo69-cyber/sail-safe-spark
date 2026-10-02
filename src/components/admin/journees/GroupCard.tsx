import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRightLeft, Ban, RotateCcw, Settings2, Trash2 } from "lucide-react";
import { STATUS_STYLES, statusLabel, type DailyGroup, type Member } from "@/features/admin-journees/types";

export interface GroupCardProps {
  group: DailyGroup;
  onEdit: (g: DailyGroup) => void;
  onCancel: (g: DailyGroup) => void;
  onRemove: (m: Member) => void;
  onMove: (m: Member, g: DailyGroup) => void;
  onRecredit: (m: Member) => void;
  onCancelGroupRecredit: (g: DailyGroup) => void;
}

export const GroupCard = ({
  group: g, onEdit, onCancel, onRemove, onMove, onRecredit, onCancelGroupRecredit,
}: GroupCardProps) => (
  <Card className="p-4">
    <div className="flex items-start justify-between gap-2 mb-3">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold">Groupe #{g.group_index}</h3>
          <Badge className={cn("border", STATUS_STYLES[g.status])} variant="outline">
            {statusLabel(g.status)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {g.taken}/{g.max_participants} places
          </span>
        </div>
        {g.notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{g.notes}</p>}
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(g)} title="Modifier">
          <Settings2 className="w-4 h-4" />
        </Button>
        {g.status !== "cancelled" && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCancelGroupRecredit(g)}
              title="Annuler la journée et recréditer tous les clients"
            >
              <RotateCcw className="w-4 h-4 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onCancel(g)} title="Annuler le groupe">
              <Ban className="w-4 h-4 text-rose-600" />
            </Button>
          </>
        )}
      </div>
    </div>
    <div className="space-y-2">
      {g.members.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Aucun participant</p>
      ) : (
        g.members.map((m) => (
          <div key={`${m.kind}-${m.id}`} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/40">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{m.name}</span>
                <Badge variant="outline" className="text-xs">
                  {m.kind === "package" ? `Pack ${m.package_code}` : `${m.participants} pers.`}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {m.email} {m.phone && `· ${m.phone}`}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={() => onRecredit(m)} title="Annuler et recréditer">
                <RotateCcw className="w-4 h-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onMove(m, g)} title="Reporter à une autre date">
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onRemove(m)} title="Retirer">
                <Trash2 className="w-4 h-4 text-rose-600" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  </Card>
);
