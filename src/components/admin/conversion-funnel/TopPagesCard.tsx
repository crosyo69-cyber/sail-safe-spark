import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stats } from "@/features/admin-conversion-funnel/types";

export const TopPagesCard = ({ stats }: { stats: Stats }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Top pages vues</CardTitle>
    </CardHeader>
    <CardContent>
      {stats.topPages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune donnée.</p>
      ) : (
        <ul className="divide-y divide-border">
          {stats.topPages.map((p) => (
            <li key={p.path} className="flex items-center justify-between py-2 text-sm">
              <span className="font-mono text-foreground truncate pr-4">{p.path}</span>
              <span className="text-muted-foreground tabular-nums">{p.count}</span>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);