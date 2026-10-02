import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  fmtDateTime, STATUS_BADGE, type Automation, type AutomationRun,
} from "@/features/admin-automations/types";

interface Props {
  runs: AutomationRun[];
  automations: Automation[];
}

export const AutomationRunsTable = ({ runs, automations }: Props) => (
  <Card><CardContent className="p-0">
    <Table>
      <TableHeader><TableRow>
        <TableHead>Date</TableHead>
        <TableHead>Automatisation</TableHead>
        <TableHead>Mode</TableHead>
        <TableHead>Destinataires</TableHead>
        <TableHead>Ignorés</TableHead>
        <TableHead>Campagne</TableHead>
        <TableHead>Résultat</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {runs.length === 0 && (
          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
            Aucune exécution enregistrée.
          </TableCell></TableRow>
        )}
        {runs.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="whitespace-nowrap">{fmtDateTime(r.started_at)}</TableCell>
            <TableCell>{automations.find((a) => a.id === r.automation_id)?.name ?? "—"}</TableCell>
            <TableCell><Badge variant={r.mode === "live" ? "default" : "secondary"}>{r.mode === "live" ? "Réel" : "Test"}</Badge></TableCell>
            <TableCell>{r.recipients_count}</TableCell>
            <TableCell>{r.skipped_count}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{r.campaign_id ? "générée" : "—"}</TableCell>
            <TableCell>
              <Badge className={STATUS_BADGE[r.status]}>{r.status}</Badge>
              {r.error && <span className="block text-xs text-destructive mt-1">{r.error}</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent></Card>
);
