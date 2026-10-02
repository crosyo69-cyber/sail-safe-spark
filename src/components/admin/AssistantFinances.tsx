import { useCallback, useEffect, useMemo, useState } from "react";
import { assistantService } from "@/services/assistant.service";
import { settle } from "@/services/_shared/result";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { eur, ACTIVITY_LABEL } from "@/components/admin/crm-types";
import type { FinancialSummary, FinanceDetailKey } from "@/components/admin/finance-types";
import { ArrowDownRight, ArrowUpRight, CreditCard, Euro, Package, PiggyBank, RefreshCw, Wallet } from "lucide-react";

const dateFr = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const evolution = (current: number, previous: number) => {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const Evolution = ({ pct }: { pct: number | null }) => {
  if (pct === null) return <span className="text-muted-foreground">N-1 : n/a</span>;
  const up = pct >= 0;
  return (
    <span className={up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
      {up ? <ArrowUpRight className="inline h-3.5 w-3.5" /> : <ArrowDownRight className="inline h-3.5 w-3.5" />}
      {pct > 0 ? "+" : ""}{pct} % vs N-1
    </span>
  );
};

const Line = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

const DETAIL_TITLE: Record<FinanceDetailKey, string> = {
  acomptes: "Acomptes encaissés",
  prestations: "Valeur des prestations réservées",
  solde: "Solde restant à encaisser",
  credits: "Crédits disponibles",
};

type Props = { onAsk?: (question: string) => void };

export const AssistantFinances = ({ onAsk }: Props) => {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<FinanceDetailKey | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: rpcError } = settle(await assistantService.financialSummary());
    if (rpcError) {
      setError(rpcError.message);
      setData(null);
    } else {
      setData(res as unknown as FinancialSummary);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const bars = useMemo(() => {
    if (!data) return [];
    const r = data.repartition;
    const max = Math.max(r.acomptes_eur, r.prestations_eur, r.credits_eur, 1);
    return [
      { key: "acomptes" as FinanceDetailKey, label: "Acomptes encaissés", value: r.acomptes_eur, color: "bg-primary" },
      { key: "prestations" as FinanceDetailKey, label: "Prestations réservées", value: r.prestations_eur, color: "bg-orange-500" },
      { key: "credits" as FinanceDetailKey, label: "Crédits disponibles", value: r.credits_eur, color: "bg-emerald-500" },
    ].map((b) => ({ ...b, pct: Math.round((b.value / max) * 100) }));
  }, [data]);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4 text-sm">
          <span className="text-destructive">Finances indisponibles : {error ?? "aucune donnée"}</span>
          <Button size="sm" variant="outline" onClick={() => void load()} className="min-h-[44px]">
            <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const rows = detail ? data.details[detail] : [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Euro className="h-5 w-5 text-primary" /> 💰 Finances
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Lecture seule</Badge>
          <Button size="sm" variant="ghost" onClick={() => void load()} className="min-h-[44px]">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button
            onClick={() => setDetail("acomptes")}
            className="rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
          >
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4 text-primary" /> 💳 Acomptes encaissés
            </p>
            <Line label="Aujourd'hui" value={eur(data.acomptes.jour_eur)} />
            <Line label="Ce mois" value={eur(data.acomptes.mois_eur)} />
            <Line label="Cette saison" value={eur(data.acomptes.saison_eur)} />
            <p className="mt-2 text-xs">
              <Evolution pct={evolution(data.acomptes.saison_eur, data.acomptes.saison_n1_eur)} />
            </p>
          </button>

          <button
            onClick={() => setDetail("prestations")}
            className="rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
          >
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Wallet className="h-4 w-4 text-orange-500" /> 🪁 Valeur des prestations
            </p>
            <Line label="Aujourd'hui" value={eur(data.prestations.jour_eur)} />
            <Line label="Ce mois" value={eur(data.prestations.mois_eur)} />
            <Line label="Cette saison" value={eur(data.prestations.saison_eur)} />
            <p className="mt-2 text-xs">
              <Evolution pct={evolution(data.prestations.saison_eur, data.prestations.saison_n1_eur)} />
            </p>
          </button>

          <button
            onClick={() => setDetail("solde")}
            className="rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
          >
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <PiggyBank className="h-4 w-4 text-primary" /> 💵 Solde restant à encaisser
            </p>
            <p className="text-2xl font-semibold">{eur(data.solde_restant.total_eur)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.solde_restant.clients_concernes} client(s) concerné(s)
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Prestations − acomptes déjà encaissés</p>
          </button>

          <button
            onClick={() => setDetail("credits")}
            className="rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
          >
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-emerald-500" /> 📦 Crédits disponibles
            </p>
            <Line label="Nombre" value={String(data.credits.nombre)} />
            <Line label="Valeur totale" value={eur(data.credits.valeur_eur)} />
            <Line label="Expire &lt; 30 j" value={eur(data.credits.valeur_expirant_30j_eur)} />
            <p className="mt-1 text-xs text-muted-foreground">
              {data.credits.nombre_expirant_30j} crédit(s) expirant sous 30 jours
            </p>
          </button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">📊 Répartition (saison en cours)</p>
          <div className="space-y-2">
            {bars.map((b) => (
              <button key={b.key} onClick={() => setDetail(b.key)} className="w-full text-left">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-medium">{eur(b.value)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Acomptes = encaissements Stripe. Prestations = valeur des réservations confirmées ({data.tarifs_source}).
          Crédits = séances achetées non encore consommées.
        </p>

        {onAsk && (
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={() => onAsk("Quel est mon chiffre d'affaires ? Détaille acomptes encaissés, valeur des prestations et solde restant.")}
          >
            Demander le détail à l'assistant
          </Button>
        )}
      </CardContent>

      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail ? DETAIL_TITLE[detail] : ""}</DialogTitle>
            <DialogDescription>100 dernières lignes — lecture seule.</DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Activité</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Client</th>
                  <th className="py-2 pr-3 text-right">Montant</th>
                  <th className="py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-muted-foreground">Aucune ligne.</td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-3">{r.activite ? ACTIVITY_LABEL[r.activite] ?? r.activite : "—"}</td>
                    <td className="py-2 pr-3">{dateFr(r.date)}</td>
                    <td className="py-2 pr-3">{r.client || r.email || "—"}</td>
                    <td className="py-2 pr-3 text-right font-medium">{eur(r.montant_eur)}</td>
                    <td className="py-2"><Badge variant="outline">{r.statut ?? "—"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
