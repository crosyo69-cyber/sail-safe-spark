import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FlaskConical, Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { TOPIC_OPTIONS } from "@/components/admin/segment-types";
import {
  fmtDateTime, STATUS_BADGE, TRIGGER_LABEL,
  type Automation, type AutomationRun,
} from "@/features/admin-automations/types";

export interface AutomationCardProps {
  automation: Automation;
  lastRun?: AutomationRun;
  running: boolean;
  onToggle: (a: Automation, active: boolean) => void;
  onTest: (a: Automation) => void;
  onExecute: (a: Automation) => void;
  onEdit: (a: Automation) => void;
  onDelete: (a: Automation) => void;
}

export const AutomationCard = ({
  automation: a, lastRun: last, running, onToggle, onTest, onExecute, onEdit, onDelete,
}: AutomationCardProps) => (
  <Card>
    <CardContent className="p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-lg">{a.name}</h2>
            <Badge variant="secondary">{TRIGGER_LABEL[a.trigger_type]}</Badge>
            {a.required_topic && (
              <Badge variant="outline">
                {TOPIC_OPTIONS.find((t) => t.value === a.required_topic)?.label ?? a.required_topic}
              </Badge>
            )}
            <Badge className={a.active ? STATUS_BADGE.success : STATUS_BADGE.skipped}>
              {a.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
          <p className="text-xs text-muted-foreground mt-2">
            Priorité {a.priority} · délai {a.delay_days} j · anti-doublon {a.dedupe_window_days} j ·
            {" "}dernière exécution {fmtDateTime(a.last_run_at)} · prochaine {fmtDateTime(a.next_run_at)}
            {last && ` · dernier résultat : ${last.status} (${last.recipients_count} dest.)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={a.active}
            onCheckedChange={(v) => onToggle(a, v)}
            aria-label="Activer l'automatisation"
          />
          <Button variant="outline" size="sm" className="min-h-[44px]"
            onClick={() => onTest(a)} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
            <span className="ml-2">Test</span>
          </Button>
          <Button size="sm" className="min-h-[44px]"
            onClick={() => onExecute(a)} disabled={running || !a.active}>
            <Send className="h-4 w-4 mr-2" /> Exécuter
          </Button>
          <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]"
            onClick={() => onEdit(a)} aria-label="Modifier">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]"
            onClick={() => onDelete(a)} aria-label="Supprimer">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);
