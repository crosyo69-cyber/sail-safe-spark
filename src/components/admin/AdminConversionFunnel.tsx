import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Phone, Mail, TrendingUp } from "lucide-react";

type RangeKey = "24h" | "7d" | "30d";

const RANGES: { key: RangeKey; label: string; hours: number }[] = [
  { key: "24h", label: "24 h", hours: 24 },
  { key: "7d", label: "7 jours", hours: 24 * 7 },
  { key: "30d", label: "30 jours", hours: 24 * 30 },
];

type EventRow = {
  event_type: "page_view" | "phone_click" | "form_submit";
  session_id: string;
  page_path: string | null;
  location: string | null;
  created_at: string;
};

type Stats = {
  visitors: number;
  pageViews: number;
  phoneClicks: number;
  phoneSessions: number;
  formSubmits: number;
  formSessions: number;
  leadSessions: number;
  topPages: { path: string; count: number }[];
};

function computeStats(rows: EventRow[]): Stats {
  const visitors = new Set<string>();
  const phoneSessions = new Set<string>();
  const formSessions = new Set<string>();
  const leadSessions = new Set<string>();
  const pageCounts = new Map<string, number>();
  let pageViews = 0;
  let phoneClicks = 0;
  let formSubmits = 0;

  for (const r of rows) {
    visitors.add(r.session_id);
    if (r.event_type === "page_view") {
      pageViews += 1;
      const p = r.page_path || "/";
      pageCounts.set(p, (pageCounts.get(p) ?? 0) + 1);
    } else if (r.event_type === "phone_click") {
      phoneClicks += 1;
      phoneSessions.add(r.session_id);
      leadSessions.add(r.session_id);
    } else if (r.event_type === "form_submit") {
      formSubmits += 1;
      formSessions.add(r.session_id);
      leadSessions.add(r.session_id);
    }
  }

  const topPages = [...pageCounts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    visitors: visitors.size,
    pageViews,
    phoneClicks,
    phoneSessions: phoneSessions.size,
    formSubmits,
    formSessions: formSessions.size,
    leadSessions: leadSessions.size,
    topPages,
  };
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)} %`;
}

export default function AdminConversionFunnel() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const hours = RANGES.find((r) => r.key === range)?.hours ?? 168;
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    supabase
      .from("analytics_events")
      .select("event_type, session_id, page_path, location, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10000)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          setRows([]);
        } else {
          setRows((data ?? []) as EventRow[]);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const stats = useMemo(() => computeStats(rows), [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground">
            Tunnel de conversion
          </h2>
          <p className="text-sm text-muted-foreground">
            Visiteurs uniques, clics téléphone et soumissions formulaire
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              size="sm"
              variant={range === r.key ? "default" : "outline"}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Erreur de chargement : {error}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Visiteurs uniques"
              value={stats.visitors}
              hint={`${stats.pageViews} pages vues`}
            />
            <StatCard
              icon={<Phone className="w-4 h-4" />}
              label="Clics téléphone"
              value={stats.phoneClicks}
              hint={`${stats.phoneSessions} visiteurs · ${pct(stats.phoneSessions, stats.visitors)}`}
            />
            <StatCard
              icon={<Mail className="w-4 h-4" />}
              label="Formulaires envoyés"
              value={stats.formSubmits}
              hint={`${stats.formSessions} visiteurs · ${pct(stats.formSessions, stats.visitors)}`}
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Taux de conversion"
              value={pct(stats.leadSessions, stats.visitors)}
              hint={`${stats.leadSessions} leads / ${stats.visitors} visiteurs`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tunnel visiteurs → leads</CardTitle>
            </CardHeader>
            <CardContent>
              <FunnelTable stats={stats} />
            </CardContent>
          </Card>

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
                    <li
                      key={p.path}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="font-mono text-foreground truncate pr-4">
                        {p.path}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {p.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
          {icon}
          <span>{label}</span>
        </div>
        <div className="mt-2 text-2xl font-display font-bold text-foreground tabular-nums">
          {value}
        </div>
        {hint && (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelTable({ stats }: { stats: Stats }) {
  const steps = [
    {
      label: "Visiteurs uniques",
      sessions: stats.visitors,
      rateFromTop: 1,
    },
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
              <td className="py-2 text-right tabular-nums text-foreground">
                {s.sessions}
              </td>
              <td className="py-2 text-right tabular-nums text-muted-foreground">
                {stats.visitors
                  ? `${(s.rateFromTop * 100).toFixed(1)} %`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}