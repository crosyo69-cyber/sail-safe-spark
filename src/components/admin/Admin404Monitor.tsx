import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AggregatedRow {
  path: string;
  hits: number;
  lastSeen: string;
  topReferrer: string | null;
}

const Admin404Monitor = () => {
  const [rows, setRows] = useState<AggregatedRow[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [uniquePaths, setUniquePaths] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    const since = new Date();
    since.setDate(since.getDate() - 30);

    // Fetch raw logs (max 5000 to stay under default cap), aggregate client-side
    const { data, error: queryError } = await supabase
      .from("page_404_logs")
      .select("path, referrer, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000);

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const map = new Map<string, { hits: number; lastSeen: string; refs: Map<string, number> }>();
    (data ?? []).forEach((row) => {
      const existing = map.get(row.path);
      if (existing) {
        existing.hits += 1;
        if (row.created_at > existing.lastSeen) existing.lastSeen = row.created_at;
        if (row.referrer) {
          existing.refs.set(row.referrer, (existing.refs.get(row.referrer) ?? 0) + 1);
        }
      } else {
        const refs = new Map<string, number>();
        if (row.referrer) refs.set(row.referrer, 1);
        map.set(row.path, { hits: 1, lastSeen: row.created_at, refs });
      }
    });

    const aggregated: AggregatedRow[] = Array.from(map.entries())
      .map(([path, v]) => {
        let topReferrer: string | null = null;
        let topCount = 0;
        v.refs.forEach((count, ref) => {
          if (count > topCount) {
            topCount = count;
            topReferrer = ref;
          }
        });
        return { path, hits: v.hits, lastSeen: v.lastSeen, topReferrer };
      })
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 50);

    setRows(aggregated);
    setTotalHits(data?.length ?? 0);
    setUniquePaths(map.size);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const truncate = (text: string, max = 60) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent" />
              Monitoring des erreurs 404
            </CardTitle>
            <CardDescription>
              Top 50 des URLs introuvables sur les 30 derniers jours
            </CardDescription>
          </div>
          <Button onClick={load} variant="outline" size="sm" disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Hits totaux (30j)</p>
              <p className="text-2xl font-bold">{totalHits}{totalHits >= 5000 && "+"}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">URLs uniques</p>
              <p className="text-2xl font-bold">{uniquePaths}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 col-span-2 sm:col-span-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Affichées</p>
              <p className="text-2xl font-bold">{rows.length}</p>
            </div>
          </div>

          {totalHits >= 5000 && (
            <div className="p-3 rounded-md bg-accent/10 border border-accent/30 text-sm">
              ⚠️ Plus de 5000 hits sur 30 jours — les chiffres affichés sont basés sur un échantillon des plus récents.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              Erreur : {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune erreur 404 enregistrée sur les 30 derniers jours 🎉
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Hits</TableHead>
                    <TableHead>Dernière vue</TableHead>
                    <TableHead>Top referrer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={row.path}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs break-all max-w-xs">
                        {row.path}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={row.hits >= 10 ? "destructive" : row.hits >= 3 ? "default" : "secondary"}>
                          {row.hits}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(row.lastSeen)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs">
                        {row.topReferrer ? truncate(row.topReferrer, 50) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin404Monitor;
