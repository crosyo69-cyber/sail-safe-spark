import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { eur, ACTIVITY_LABEL } from "@/components/admin/crm-types";
import type { Briefing, BriefingOpportunity, BriefingSeverity } from "@/components/admin/briefing-types";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarDays, CheckCircle2, CloudSun,
  Lightbulb, Megaphone, RefreshCw, TrendingUp, Users, Wallet,
} from "lucide-react";

const SEVERITY_STYLE: Record<BriefingSeverity, string> = {
  critical: "border-destructive/40 bg-destructive/5",
  warning: "border-orange-500/40 bg-orange-500/5",
  info: "border-primary/30 bg-primary/5",
};

const dateFr = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-lg border bg-card p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-semibold">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const Evolution = ({ pct }: { pct: number | null }) => {
  if (pct === null || pct === undefined) return <span className="text-muted-foreground">n/a</span>;
  const up = pct >= 0;
  return (
    <span className={up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
      {up ? <ArrowUpRight className="inline h-3.5 w-3.5" /> : <ArrowDownRight className="inline h-3.5 w-3.5" />}
      {pct > 0 ? "+" : ""}{pct} %
    </span>
  );
};

type Props = {
  /** Permet de poser une question dans le chat depuis une opportunité ou une suggestion. */
  onAsk: (question: string) => void;
  /** Remonte les questions contextuelles calculées côté serveur. */
  onSuggestions?: (questions: string[]) => void;
  /** ÉTAPE IA 3 : prépare un brouillon d'action à partir d'une opportunité (aucun envoi). */
  onPrepare?: (opportunity: BriefingOpportunity) => void;
};

export const AssistantBriefing = ({ onAsk, onSuggestions, onPrepare }: Props) => {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("assistant_briefing");
    if (rpcError) {
      setError(rpcError.message);
      setBriefing(null);
    } else {
      const parsed = data as unknown as Briefing;
      setBriefing(parsed);
      onSuggestions?.(parsed?.questions_suggerees ?? []);
    }
    setLoading(false);
  }, [onSuggestions]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex items-center justify-between gap-3 p-4 text-sm">
          <span className="text-destructive">Briefing indisponible : {error ?? "aucune donnée"}</span>
          <Button variant="outline" size="sm" onClick={() => void load()} className="min-h-[44px]">
            <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const a = briefing.activite_du_jour;
  const b = briefing.business;
  const crm = briefing.crm;
  const mk = briefing.marketing;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Bonjour Yoanne 👋</h2>
          <p className="text-muted-foreground">
            Voici votre briefing du jour — {dateFr(briefing.date)}.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} className="min-h-[44px]">
          <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
        </Button>
      </div>

      {/* Activité du jour */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" /> Activité du jour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Réservations" value={String(a.reservations)} />
            <Stat label="Participants" value={String(a.participants)} hint={`${a.groupes} groupe(s)`} />
            <Stat label="Places restantes" value={String(a.places_restantes)} hint={`Capacité ${a.capacite_totale}`} />
            <Stat label="Journées complètes" value={String(a.journees_completes)} />
            <Stat label="Taux de remplissage" value={`${a.taux_remplissage_pct} %`} />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(a.par_activite ?? {}).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune séance programmée aujourd'hui.</p>
            ) : (
              Object.entries(a.par_activite).map(([act, n]) => (
                <Badge key={act} variant="secondary">
                  {ACTIVITY_LABEL[act] ?? act} : {n}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" /> Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Acomptes encaissés aujourd'hui" value={eur(b.acomptes_jour_eur)} hint={`${b.transactions_jour} transaction(s)`} />
            <Stat label="CA du mois" value={eur(b.ca_mois_eur)} />
            <Stat label="CA de la saison" value={eur(b.ca_saison_eur)} />
            <Stat label="Panier moyen (mois)" value={eur(b.panier_moyen_eur)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">Évolution vs N-1 (mois)</p>
              <p className="font-medium"><Evolution pct={b.evolution_mois_pct} /> <span className="text-muted-foreground">({eur(b.ca_mois_n1_eur)})</span></p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">Évolution vs N-1 (saison)</p>
              <p className="font-medium"><Evolution pct={b.evolution_saison_pct} /> <span className="text-muted-foreground">({eur(b.ca_saison_n1_eur)})</span></p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">Activité la plus rentable</p>
              <p className="font-medium">
                {b.activite_plus_rentable ? (ACTIVITY_LABEL[b.activite_plus_rentable] ?? b.activite_plus_rentable) : "—"}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">Packs vendus (mois)</p>
              <p className="font-medium">{b.packs_vendus_mois} · {eur(b.acomptes_packs_mois_eur)}</p>
            </div>
          </div>
          {Object.keys(b.par_activite_mois ?? {}).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(b.par_activite_mois).map(([act, ca]) => (
                <Badge key={act} variant="outline">
                  {ACTIVITY_LABEL[act] ?? act} : {eur(ca)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alertes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-orange-500" /> Alertes
              {briefing.alertes.length > 0 && <Badge variant="secondary">{briefing.alertes.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {briefing.alertes.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Aucune alerte aujourd'hui.
              </p>
            ) : (
              briefing.alertes.map((al) => (
                <div key={al.code} className={`rounded-lg border p-3 ${SEVERITY_STYLE[al.severite]}`}>
                  <p className="text-sm font-medium">{al.titre}</p>
                  <p className="text-xs text-muted-foreground">{al.detail}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Opportunités */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" /> Opportunités
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {briefing.opportunites.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune opportunité détectée aujourd'hui.</p>
            ) : (
              briefing.opportunites.map((o: BriefingOpportunity) => (
                <div key={o.id} className="rounded-lg border bg-primary/5 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{o.titre}</p>
                    <Badge variant="outline" className="text-xs">{o.type}</Badge>
                    <Badge variant="outline" className={`text-xs ${PRIORITY_META[opportunityAction(o.type).priority] ?? ""}`}>
                      priorité {opportunityAction(o.type).priority}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{o.pourquoi}</p>
                  <p className="mt-1 text-xs">
                    Action proposée :{" "}
                    <span className="font-medium">
                      {ACTION_META[opportunityAction(o.type).type].emoji} {ACTION_META[opportunityAction(o.type).type].label}
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {onPrepare && (
                      <Button size="sm" className="min-h-[44px]" onClick={() => onPrepare(o)}>
                        Préparer
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="min-h-[44px]" onClick={() => onAsk(o.prompt)}>
                      Analyser avec l'assistant
                    </Button>
                    <Badge variant="outline" className="text-xs">Brouillon uniquement — aucun envoi</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* CRM */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" /> CRM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Nouveaux (30 j)" value={String(crm.nouveaux_30j)} />
              <Stat label="Actifs" value={String(crm.actifs)} />
              <Stat label="Inactifs" value={String(crm.inactifs)} />
              <Stat label="Sans venue 6 mois" value={String(crm.sans_reservation_6m)} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Meilleurs clients</p>
              <ul className="space-y-1 text-sm">
                {crm.top_clients.length === 0 && <li className="text-muted-foreground">Aucun client.</li>}
                {crm.top_clients.map((c) => (
                  <li key={c.email} className="flex justify-between gap-2">
                    <span className="truncate">{c.nom || c.email}</span>
                    <span className="shrink-0 font-medium">{eur(c.ca_eur)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Clients à relancer</p>
              <ul className="space-y-1 text-sm">
                {crm.a_relancer.length === 0 && <li className="text-muted-foreground">Personne à relancer.</li>}
                {crm.a_relancer.map((c) => (
                  <li key={c.email} className="flex justify-between gap-2">
                    <span className="truncate">{c.nom || c.email}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{c.raison}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Marketing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-primary" /> Marketing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Campagnes actives" value={String(mk.campagnes_actives)} />
              <Stat label="Automatisations (7 j)" value={String(mk.automatisations_executees_7j)} hint={`${mk.automatisations_actives} active(s)`} />
              <Stat label="Base marketing" value={String(mk.base_marketing)} />
              <Stat label="Consentants" value={String(mk.contacts_consentants)} />
            </div>
            <p className="text-sm text-muted-foreground">
              Prochaine automatisation :{" "}
              {mk.prochaine_automatisation
                ? `${mk.prochaine_automatisation.nom} — ${dateFr(mk.prochaine_automatisation.le)}`
                : "aucune planifiée"}
            </p>
            {mk.campagnes_recentes.length > 0 && (
              <ul className="space-y-1 text-sm">
                {mk.campagnes_recentes.map((c) => (
                  <li key={c.nom} className="flex justify-between gap-2">
                    <span className="truncate">{c.nom}</span>
                    <Badge variant="outline" className="shrink-0 text-xs">{c.statut}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Météo */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CloudSun className="h-4 w-4 text-primary" /> Prévisions météo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[88px] items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
          {briefing.meteo.message}
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" />
        Briefing calculé en une seule requête sécurisée (<code>assistant_briefing</code>), strictement en lecture seule.
      </p>
    </div>
  );
};

export default AssistantBriefing;