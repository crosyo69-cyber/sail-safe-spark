import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAdmin } from "@/hooks/useAdmin";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, Download, Users, ArrowLeft, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CrmClientSheet } from "@/components/admin/CrmClientSheet";
import {
  ACTIVITY_LABEL, LIFECYCLE_LABEL, eur, type CrmClient, type CrmDashboardStats,
} from "@/components/admin/crm-types";

const fmt = (d?: string | null) => {
  if (!d) return "—";
  try { return format(parseISO(d), "dd/MM/yyyy", { locale: fr }); } catch { return "—"; }
};

const AdminCRM = () => {
  const { isAdmin, isLoading, user } = useAdmin();
  const [query, setQuery] = useState("");
  const [activity, setActivity] = useState("all");
  const [status, setStatus] = useState("all");
  const [consent, setConsent] = useState("all");
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [stats, setStats] = useState<CrmDashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    const { data, error } = await supabase.rpc("crm_dashboard");
    if (error) { toast.error("Tableau de bord : " + error.message); return; }
    setStats(data as unknown as CrmDashboardStats);
  }, []);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("crm_list_clients", {
      p_query: query || null,
      p_activity: activity,
      p_status: status,
      p_consent: consent,
      p_limit: 500,
    });
    setLoading(false);
    if (error) { toast.error("Recherche : " + error.message); return; }
    setClients((data as unknown as CrmClient[]) ?? []);
  }, [query, activity, status, consent]);

  useEffect(() => { if (isAdmin) loadStats(); }, [isAdmin, loadStats]);

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(() => { loadClients(); }, 250);
    return () => clearTimeout(t);
  }, [isAdmin, loadClients]);

  const exportCsv = () => {
    const headers = [
      "Email", "Prénom", "Nom", "Téléphone", "Statut", "Activités", "Séances",
      "Packs", "Crédits dispo", "CA (EUR)", "Première venue", "Dernière venue", "Opt-in marketing",
    ];
    const rows = clients.map((c) => [
      c.email, c.first_name ?? "", c.last_name ?? "", c.phone ?? "",
      LIFECYCLE_LABEL[c.lifecycle]?.label ?? c.lifecycle,
      (c.activities ?? []).map((a) => ACTIVITY_LABEL[a] ?? a).join(" / "),
      c.reservations_count, c.packages_count, c.credits_remaining,
      String(Number(c.revenue ?? 0)).replace(".", ","),
      fmt(c.first_activity), fmt(c.last_activity),
      c.marketing_consent ? "Oui" : "Non",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `crm-clients-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const kpis = useMemo(() => stats ? [
    { label: "Clients", value: stats.total_clients },
    { label: "Nouveaux (30 j)", value: stats.new_clients_30d },
    { label: "Actifs (12 mois)", value: stats.active_clients },
    { label: "Inactifs", value: stats.inactive_clients },
    { label: "Panier moyen", value: eur(stats.avg_basket) },
    { label: "CA / client", value: eur(stats.revenue_per_client) },
    { label: "Séances / client", value: stats.avg_sessions },
    { label: "Fidélité", value: `${stats.loyalty_rate} %` },
  ] : [], [stats]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Vous n'avez pas les droits d'administration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>CRM Client | Kitesurf Passion</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />CRM Client
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm" className="min-h-11">
              <Link to="/admin"><ArrowLeft className="w-4 h-4 mr-2" />Administration</Link>
            </Button>
            <Button variant="outline" size="sm" className="min-h-11"
              onClick={() => { loadStats(); loadClients(); }}>
              <RefreshCw className="w-4 h-4 mr-2" />Actualiser
            </Button>
            <Button size="sm" className="min-h-11" onClick={exportCsv} disabled={clients.length === 0}>
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold text-foreground">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-4">
          <CardContent className="p-4 grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 min-h-11"
                placeholder="Nom, email ou téléphone…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Recherche client"
              />
            </div>
            <Select value={activity} onValueChange={setActivity}>
              <SelectTrigger className="min-h-11" aria-label="Filtrer par activité"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les activités</SelectItem>
                {Object.entries(ACTIVITY_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="min-h-11" aria-label="Filtrer par statut"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="new">Nouveaux (30 j)</SelectItem>
                  <SelectItem value="credits">Avec crédits</SelectItem>
                </SelectContent>
              </Select>
              <Select value={consent} onValueChange={setConsent}>
                <SelectTrigger className="min-h-11" aria-label="Filtrer par consentement"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Marketing : tous</SelectItem>
                  <SelectItem value="yes">Opt-in</SelectItem>
                  <SelectItem value="no">Sans opt-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mb-2">
          {loading ? "Recherche…" : `${clients.length} client${clients.length > 1 ? "s" : ""}`}
        </p>

        <div className="space-y-2">
          {clients.map((c) => {
            const lc = LIFECYCLE_LABEL[c.lifecycle];
            return (
              <button
                key={c.email}
                type="button"
                onClick={() => setSelected(c.email)}
                className="w-full text-left rounded-lg border border-border bg-card p-4 hover:border-primary/60 transition-colors min-h-11"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {lc && <Badge variant="secondary" className={lc.className}>{lc.label}</Badge>}
                      {(c.activities ?? []).map((a) => (
                        <Badge key={a} variant="outline">{ACTIVITY_LABEL[a] ?? a}</Badge>
                      ))}
                      {c.marketing_consent && <Badge variant="outline">Opt-in</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm shrink-0">
                    <div><span className="text-muted-foreground text-xs block">Séances</span>{c.reservations_count}</div>
                    <div><span className="text-muted-foreground text-xs block">Crédits</span>{c.credits_remaining}</div>
                    <div><span className="text-muted-foreground text-xs block">CA</span>{eur(c.revenue)}</div>
                    <div><span className="text-muted-foreground text-xs block">Dernière</span>{fmt(c.last_activity)}</div>
                  </div>
                </div>
              </button>
            );
          })}
          {!loading && clients.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucun client trouvé.</p>
          )}
        </div>
      </main>
      <Footer />

      <CrmClientSheet
        email={selected}
        onClose={() => setSelected(null)}
        onSaved={() => { loadClients(); loadStats(); }}
      />
    </div>
  );
};

export default AdminCRM;