import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stats } from "@/features/admin-conversion-funnel/types";

export const FunnelTable = ({ stats }: { stats: Stats }) => {
  const steps = [
    { label: "Visiteurs uniques", sessions: stats.visitors, rateFromTop: 1 },
    {
      label: "Visiteurs ayant cliqué sur le téléphone",
      sessions: stats.phoneSessions,
      rateFromTop: stats.visitors ? stats.phoneSessions / stats.visitors : 0,
    },
    {
      label: "Visiteurs ayant envoyé le formulaire",
      sessions: stats.formSessions,
      rateFromTop: stats.visitors ? stats.formSessions / stats.visitors : 0,
    },
    {
      label: "Leads (téléphone OU formulaire)",
      sessions: stats.leadSessions,
      rateFromTop: stats.visitors ? stats.leadSessions / stats.visitors : 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tunnel visiteurs → leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 font-medium">Étape</th>
                <th className="py-2 font-medium text-right">Visiteurs</th>
                <th className="py-2 font-medium text-right">% des visiteurs</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s) => (
                <tr key={s.label} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{s.label}</td>
                  <td className="py-2 text-right tabular-nums text-foreground">{s.sessions}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">
                    {stats.visitors ? `${(s.rateFromTop * 100).toFixed(1)} %` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};