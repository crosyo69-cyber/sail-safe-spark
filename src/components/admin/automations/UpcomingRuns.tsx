import { Card, CardContent } from "@/components/ui/card";
import { Clock, History } from "lucide-react";
import { fmtDateTime, TRIGGER_LABEL, type Automation } from "@/features/admin-automations/types";

export const UpcomingRuns = ({ upcoming }: { upcoming: Automation[] }) => (
  <Card><CardContent className="p-5 space-y-3">
    {upcoming.length === 0 ? (
      <p className="text-muted-foreground">Aucune automatisation active planifiée.</p>
    ) : upcoming.map((a) => (
      <div key={a.id} className="flex items-center justify-between border-b last:border-0 py-2">
        <div>
          <p className="font-medium">{a.name}</p>
          <p className="text-xs text-muted-foreground">{TRIGGER_LABEL[a.trigger_type]} · priorité {a.priority}</p>
        </div>
        <p className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {fmtDateTime(a.next_run_at)}</p>
      </div>
    ))}
    <p className="text-xs text-muted-foreground pt-2 flex items-center gap-2">
      <History className="h-3.5 w-3.5" /> Le planificateur quotidien exécute les automatisations actives dont l'échéance est atteinte.
    </p>
  </CardContent></Card>
);
