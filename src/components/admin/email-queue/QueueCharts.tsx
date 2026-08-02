import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { TemplateStatusDatum } from "@/features/admin-email-queue/types";

interface Props {
  hours: number;
  templateStatusData: TemplateStatusDatum[];
  avgTimeData: { name: string; avgSec: number }[];
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

export const QueueCharts = ({ hours, templateStatusData, avgTimeData }: Props) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
      <BarChart3 className="w-4 h-4 text-primary" />
      Analyse par template ({hours}h)
    </h3>
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-3">Répartition des statuts par template</h4>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={templateStatusData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="pending" name="En attente" stackId="a" fill="hsl(217, 91%, 60%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="sent" name="Envoyé" stackId="a" fill="hsl(142, 71%, 45%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="dlq" name="DLQ" stackId="a" fill="hsl(0, 84%, 60%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="suppressed" name="Supprimé" stackId="a" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-3">Temps moyen de traitement (s) — emails envoyés</h4>
        {avgTimeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={avgTimeData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={100} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}s`, "Temps moyen"]} />
              <Bar dataKey="avgSec" name="Secondes" fill="hsl(189, 94%, 37%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-10">Aucun email envoyé sur la période</p>
        )}
      </Card>
    </div>
  </div>
);
