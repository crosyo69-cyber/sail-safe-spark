import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Users,
  Phone,
  Mail,
  TrendingUp,
  Radio,
  Trash2,
  Search,
  ArrowDownAZ,
  ArrowDownZA,
  RotateCcw,
} from "lucide-react";

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

type LiveEvent = EventRow & { id: string; metadata?: Record<string, unknown> | null };

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
  const [debug, setDebug] = useState(false);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<string>("idle");
  const [eventFilter, setEventFilter] = useState<"all" | "phone_click" | "form_submit">("all");
  const [pageSearch, setPageSearch] = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  // Restore debug filters from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_debug_filters");
      if (raw) {
        const saved = JSON.parse(raw) as {
          eventFilter: typeof eventFilter;
          pageSearch: string;
          sortNewest: boolean;
          dateFrom: string;
          dateTo: string;
          appliedDateFrom: string;
          appliedDateTo: string;
        };
        if (saved.eventFilter) setEventFilter(saved.eventFilter);
        if (saved.pageSearch !== undefined) setPageSearch(saved.pageSearch);
        if (saved.sortNewest !== undefined) setSortNewest(saved.sortNewest);
        if (saved.dateFrom !== undefined) setDateFrom(saved.dateFrom);
        if (saved.dateTo !== undefined) setDateTo(saved.dateTo);
        if (saved.appliedDateFrom !== undefined) setAppliedDateFrom(saved.appliedDateFrom);
        if (saved.appliedDateTo !== undefined) setAppliedDateTo(saved.appliedDateTo);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Persist debug filters to localStorage
  useEffect(() => {
    localStorage.setItem(
      "admin_debug_filters",
      JSON.stringify({
        eventFilter,
        pageSearch,
        sortNewest,
        dateFrom,
        dateTo,
        appliedDateFrom,
        appliedDateTo,
      })
    );
  }, [eventFilter, pageSearch, sortNewest, dateFrom, dateTo, appliedDateFrom, appliedDateTo]);

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

  const filteredEvents = useMemo(() => {
    let list = [...liveEvents];
    if (eventFilter !== "all") {
      list = list.filter((ev) => ev.event_type === eventFilter);
    }
    if (pageSearch.trim()) {
      const q = pageSearch.trim().toLowerCase();
      list = list.filter((ev) => (ev.page_path || "/").toLowerCase().includes(q));
    }
    if (appliedDateFrom) {
      const from = new Date(appliedDateFrom).getTime();
      list = list.filter((ev) => new Date(ev.created_at).getTime() >= from);
    }
    if (appliedDateTo) {
      const to = new Date(appliedDateTo).getTime();
      list = list.filter((ev) => new Date(ev.created_at).getTime() <= to);
    }
    if (!sortNewest) {
      list = list.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return list;
  }, [liveEvents, eventFilter, pageSearch, sortNewest, appliedDateFrom, appliedDateTo]);

  const resetFilters = () => {
    setEventFilter("all");
    setPageSearch("");
    setSortNewest(true);
    setDateFrom("");
    setDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
  };

  // Realtime subscription for debug mode
  useEffect(() => {
    if (!debug) {
      setRealtimeStatus("idle");
      return;
    }
    setRealtimeStatus("connecting");
    const channel = supabase
      .channel("analytics_events_debug")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "analytics_events" },
        (payload) => {
          const ev = payload.new as LiveEvent;
          setLiveEvents((prev) => [ev, ...prev].slice(0, 50));
        },
      )
      .subscribe((status) => setRealtimeStatus(status));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [debug]);

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
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch
              id="conversion-debug-toggle"
              checked={debug}
              onCheckedChange={setDebug}
            />
            <Label htmlFor="conversion-debug-toggle" className="text-sm flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              Mode debug temps réel
            </Label>
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
      </div>

      {debug && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary animate-pulse" />
                Flux d'événements en direct
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant={realtimeStatus === "SUBSCRIBED" ? "default" : "secondary"}
                  className="font-mono text-[10px]"
                >
                  {realtimeStatus}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLiveEvents([])}
                  className="gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vider
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Select
                value={eventFilter}
                onValueChange={(v) => setEventFilter(v as typeof eventFilter)}
              >
                <SelectTrigger className="w-[180px] text-xs h-8">
                  <SelectValue placeholder="Tous les événements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les événements</SelectItem>
                  <SelectItem value="phone_click">Clics téléphone</SelectItem>
                  <SelectItem value="form_submit">Formulaires</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher une page…"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSortNewest((s) => !s)}
                className="gap-1.5 h-8"
              >
                {sortNewest ? (
                  <ArrowDownZA className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                )}
                <span className="text-xs">
                  {sortNewest ? "Plus récents" : "Plus anciens"}
                </span>
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  type="datetime-local"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 text-xs w-[170px]"
                />
                <span className="text-xs text-muted-foreground">à</span>
                <Input
                  type="datetime-local"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 text-xs w-[170px]"
                />
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 text-xs"
                  onClick={() => {
                    setAppliedDateFrom(dateFrom);
                    setAppliedDateTo(dateTo);
                  }}
                >
                  Appliquer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={resetFilters}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {liveEvents.length === 0
                  ? "En attente d'événements… Cliquez sur un bouton téléphone ou envoyez un formulaire dans un autre onglet pour vérifier."
                  : "Aucun événement ne correspond aux filtres sélectionnés."}
              </p>
            ) : (
              <ScrollArea className="h-[320px]">
                <ul className="divide-y divide-border/50">
                  {filteredEvents.map((ev) => (
                    <li key={ev.id} className="py-2 flex items-start gap-3 text-xs">
                      <Badge
                        variant={
                          ev.event_type === "form_submit"
                            ? "default"
                            : ev.event_type === "phone_click"
                              ? "secondary"
                              : "outline"
                        }
                        className="font-mono shrink-0"
                      >
                        {ev.event_type}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-foreground truncate">
                          {ev.page_path || "/"}
                          {ev.location && (
                            <span className="text-muted-foreground">
                              {" "}· {ev.location}
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-[10px] font-mono">
                          session {ev.session_id.slice(0, 12)}… ·{" "}
                          {new Date(ev.created_at).toLocaleTimeString("fr-FR")}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

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