import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Loader2 } from "lucide-react";
import { AutomationCard, type AutomationCardProps } from "./AutomationCard";
import type { Automation, AutomationRun } from "@/features/admin-automations/types";

interface Props extends Omit<AutomationCardProps, "automation" | "lastRun" | "running"> {
  automations: Automation[];
  loading: boolean;
  running: string | null;
  runsByAutomation: (id: string) => AutomationRun[];
  testResult: Record<string, unknown> | null;
}

export const AutomationsList = ({
  automations, loading, running, runsByAutomation, testResult, ...actions
}: Props) => (
  <>
    {loading ? (
      <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
    ) : automations.length === 0 ? (
      <Card><CardContent className="py-12 text-center text-muted-foreground">
        Aucune automatisation. Créez votre premier scénario.
      </CardContent></Card>
    ) : automations.map((a) => (
      <AutomationCard
        key={a.id}
        automation={a}
        lastRun={runsByAutomation(a.id)[0]}
        running={running === a.id}
        {...actions}
      />
    ))}

    {testResult && (
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="h-4 w-4" /> Résultat de la dernière exécution
          {testResult.mode === "test" && <Badge variant="secondary">mode test — aucun envoi</Badge>}
        </CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted/40 rounded-md p-4 overflow-auto max-h-80">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </CardContent>
      </Card>
    )}
  </>
);
