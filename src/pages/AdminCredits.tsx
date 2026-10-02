import { useCallback, useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAdmin } from "@/hooks/useAdmin";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { creditService } from "@/services/credit.service";
import { settle } from "@/services/_shared/result";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Search, Download, Plus, Minus, CalendarDays, Wallet } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { RECREDIT_REASONS } from "@/components/admin/RecreditDialog";

type Wallet = {
  package_id: string;
  package_code: string;
  email: string;
  first_name: string;
  last_name: string;
  activity: string;
  package_type: string;
  status: string;
  expires_at: string;
  created_at: string;
  purchased: number;
  consumed: number;
  recredited: number;
  remaining: number;
  total_sessions: number;
};

type HistoryRow = {
  id: string;
  delta: number;
  kind: string;
  action: string | null;
  reason: string | null;
  activity: string | null;
  balance_after: number;
  created_at: string;
};

type Credit = {
  id: string;
  activity: string;
  origin: string;
  status: string;
  reason: string | null;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
};

const ORIGIN_BADGE: Record<string, { label: string; className: string }> = {
  purchase: { label: "🟢 Achat", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  weather_recredit: { label: "🔵 Recrédit météo", className: "bg-sky-500/15 text-sky-700 dark:text-sky-400" },
  commercial: { label: "🟠 Geste commercial", className: "bg-orange-500/15 text-orange-700 dark:text-orange-400" },
  reschedule: { label: "🟣 Report", className: "bg-purple-500/15 text-purple-700 dark:text-purple-400" },
  admin: { label: "⚪ Ajustement", className: "bg-muted text-muted-foreground" },
};

const CREDIT_STATUS: Record<string, string> = {
  available: "Disponible",
  consumed: "Consommée",
  expired: "🔴 Expirée",
};

const ACTIVITY_LABEL: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

const KIND_LABEL: Record<string, string> = {
  initial: "Achat initial",
  booking: "Réservation",
  cancellation: "Annulation",
  admin_credit: "Recrédit admin",
  admin_debit: "Débit admin",
  report: "Report",
  group_cancel: "Journée annulée",
};

const AdminCredits = () => {
  const { isAdmin, isLoading, user } = useAdmin();
  const [query, setQuery] = useState("");
  const [activity, setActivity] = useState("all");
  const [season, setSeason] = useState("all");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [creditFilter, setCreditFilter] = useState("all");
  const [editCredit, setEditCredit] = useState<{ credit: Credit; mode: "extend" | "reactivate" } | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editReason, setEditReason] = useState("");
  const [adjust, setAdjust] = useState<{ wallet: Wallet; sign: 1 | -1 } | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState(RECREDIT_REASONS[0].value);
  const [adjustCustom, setAdjustCustom] = useState("");
  const [busy, setBusy] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    const { data, error } = settle(
      await creditService.searchWallets({
        p_query: query || null,
        p_activity: activity === "all" ? null : activity,
        p_season: season === "all" ? null : season,
      }),
    );
    setLoading(false);
    if (error) return toast.error(error.message);
    setWallets((data as unknown as Wallet[]) || []);
  }, [query, activity, season]);

  useEffect(() => { if (isAdmin) search(); }, [isAdmin, search]);

  const openWallet = async (w: Wallet) => {
    setSelected(w);
    const { data } = settle(await creditService.getWalletByCode({ p_code: w.package_code }));
    const res = data as any;
    setHistory((res?.history as HistoryRow[]) || []);
    const { data: c } = settle(await creditService.listCredits({ p_package_id: w.package_id }));
    setCredits((c as unknown as Credit[]) || []);
  };

  const submitCreditEdit = async () => {
    if (!editCredit || editReason.trim().length < 3 || !editDate) return;
    setBusy(true);
    const iso = new Date(`${editDate}T12:00:00`).toISOString();
    const { error } = settle(
      await (editCredit.mode === "extend"
        ? creditService.extendCredit({
            p_credit_id: editCredit.credit.id,
            p_new_expires_at: iso,
            p_reason: editReason.trim(),
          })
        : creditService.reactivateCredit({
            p_credit_id: editCredit.credit.id,
            p_new_expires_at: iso,
            p_reason: editReason.trim(),
          })),
    );
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editCredit.mode === "extend" ? "Expiration prolongée" : "Crédit réactivé");
    setEditCredit(null);
    if (selected) await openWallet(selected);
  };

  const exportCreditsCsv = () => {
    if (!selected) return;
    const header = ["Code pack", "Client", "Activité", "Origine", "Statut", "Créé le", "Expire le", "Consommé le", "Motif"];
    const rows = credits.map((c) => [
      selected.package_code, `${selected.first_name} ${selected.last_name}`,
      ACTIVITY_LABEL[c.activity] || c.activity,
      (ORIGIN_BADGE[c.origin]?.label || c.origin).replace(/^\S+\s/, ""),
      CREDIT_STATUS[c.status] || c.status,
      format(parseISO(c.created_at), "dd/MM/yyyy"),
      format(parseISO(c.expires_at), "dd/MM/yyyy"),
      c.consumed_at ? format(parseISO(c.consumed_at), "dd/MM/yyyy") : "",
      c.reason || "",
    ]);
    const csv = "\uFEFF" + [header, ...rows]
      .map((r) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `credits-${selected.package_code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const finalReason = adjustReason === "Autre" ? adjustCustom.trim() : adjustReason;

  const submitAdjust = async () => {
    if (!adjust || finalReason.length < 3) return;
    setBusy(true);
    const { error } = settle(
      await creditService.adjustPackageCredits({
        p_package_id: adjust.wallet.package_id,
        p_delta: adjust.sign * adjustQty,
        p_reason: finalReason,
      }),
    );
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(adjust.sign > 0 ? "Crédits ajoutés" : "Crédits retirés");
    setAdjust(null);
    await search();
    if (selected?.package_id === adjust.wallet.package_id) {
      const refreshed = { ...selected };
      await openWallet(refreshed);
    }
  };

  const exportCsv = () => {
    const header = [
      "Code pack", "Prénom", "Nom", "Email", "Activité", "Type",
      "Achetées", "Consommées", "Recréditées", "Restantes", "Statut", "Expire le",
    ];
    const rows = wallets.map((w) => [
      w.package_code, w.first_name, w.last_name, w.email,
      ACTIVITY_LABEL[w.activity] || w.activity, w.package_type,
      w.purchased, w.consumed, w.recredited, w.remaining, w.status,
      w.expires_at ? format(parseISO(w.expires_at), "dd/MM/yyyy") : "",
    ]);
    const csv = "\uFEFF" + [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `credits-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  const seasons = Array.from(
    new Set(wallets.map((w) => (w.created_at ? w.created_at.slice(0, 4) : ""))),
  ).filter(Boolean).sort().reverse();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Gestion des crédits | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              <Wallet className="w-7 h-7 text-primary" /> Gestion des crédits
            </h1>
            <p className="text-sm text-muted-foreground">
              Portefeuille de séances par client — achetées, consommées, recréditées, restantes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/journees"><CalendarDays className="w-4 h-4 mr-2" />Journées</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!wallets.length}>
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
          </div>
        </div>

        <Card className="p-4 mb-6">
          <form
            className="flex flex-wrap gap-3 items-end"
            onSubmit={(e) => { e.preventDefault(); search(); }}
          >
            <div className="flex-1 min-w-[220px]">
              <Label htmlFor="q">Rechercher un client</Label>
              <Input id="q" placeholder="Nom, email ou code pack" value={query}
                onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div>
              <Label>Activité</Label>
              <Select value={activity} onValueChange={setActivity}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {Object.entries(ACTIVITY_LABEL).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Saison</Label>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {seasons.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="min-h-[44px]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-2" />Rechercher</>}
            </Button>
          </form>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {wallets.length === 0 && !loading && (
              <Card className="p-6 text-center text-muted-foreground">Aucun pack trouvé.</Card>
            )}
            {wallets.map((w) => (
              <Card key={w.package_id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{w.first_name} {w.last_name}</span>
                      <Badge variant="outline" className="font-mono text-xs">{w.package_code}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {ACTIVITY_LABEL[w.activity] || w.activity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{w.email} · {w.package_type}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary leading-none">{w.remaining}</div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">restantes</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                  <div className="rounded-md bg-muted/50 py-2">
                    <div className="font-bold text-sm">{w.purchased}</div>achetées
                  </div>
                  <div className="rounded-md bg-muted/50 py-2">
                    <div className="font-bold text-sm">{w.consumed}</div>consommées
                  </div>
                  <div className="rounded-md bg-primary/10 py-2">
                    <div className="font-bold text-sm">{w.recredited}</div>recréditées
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => openWallet(w)}>Historique</Button>
                  <Button size="sm" variant="outline"
                    onClick={() => { setAdjust({ wallet: w, sign: 1 }); setAdjustQty(1); setAdjustReason(RECREDIT_REASONS[0].value); setAdjustCustom(""); }}>
                    <Plus className="w-4 h-4 mr-1" />Ajouter
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={() => { setAdjust({ wallet: w, sign: -1 }); setAdjustQty(1); setAdjustReason(RECREDIT_REASONS[0].value); setAdjustCustom(""); }}>
                    <Minus className="w-4 h-4 mr-1" />Retirer
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div>
            {selected && (
              <Card className="p-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="font-semibold">Crédits individuels (FIFO)</h2>
                  <div className="flex gap-2">
                    <Select value={creditFilter} onValueChange={setCreditFilter}>
                      <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="available">Disponibles</SelectItem>
                        <SelectItem value="consumed">Consommées</SelectItem>
                        <SelectItem value="expired">Expirées</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={exportCreditsCsv} disabled={!credits.length}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {credits.filter((c) => creditFilter === "all" || c.status === creditFilter).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun crédit.</p>
                ) : (
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {credits
                      .filter((c) => creditFilter === "all" || c.status === creditFilter)
                      .map((c) => (
                        <div key={c.id} className="rounded-md border p-2 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className={ORIGIN_BADGE[c.origin]?.className}>
                              {ORIGIN_BADGE[c.origin]?.label || c.origin}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {CREDIT_STATUS[c.status] || c.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {ACTIVITY_LABEL[c.activity] || c.activity}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Expire le {format(parseISO(c.expires_at), "d MMM yyyy", { locale: fr })}
                            {c.consumed_at
                              ? ` · consommée le ${format(parseISO(c.consumed_at), "d MMM yyyy", { locale: fr })}`
                              : ""}
                            {c.reason ? ` · ${c.reason}` : ""}
                          </p>
                          {c.status !== "consumed" && (
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline"
                                onClick={() => {
                                  setEditCredit({ credit: c, mode: c.status === "expired" ? "reactivate" : "extend" });
                                  setEditDate(format(new Date(Date.now() + 180 * 86400000), "yyyy-MM-dd"));
                                  setEditReason("");
                                }}>
                                {c.status === "expired" ? "Réactiver" : "Prolonger"}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            )}
            <Card className="p-4 sticky top-24">
              <h2 className="font-semibold mb-3">
                {selected ? `Historique — ${selected.first_name} ${selected.last_name}` : "Historique"}
              </h2>
              {!selected ? (
                <p className="text-sm text-muted-foreground">
                  Sélectionnez un client pour afficher tous ses mouvements de crédits.
                </p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun mouvement.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {history.map((h) => (
                    <div key={h.id} className="rounded-md border p-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{KIND_LABEL[h.kind] || h.kind}</span>
                        <span className={h.delta > 0 ? "text-primary font-bold" : h.delta < 0 ? "text-muted-foreground font-bold" : "text-muted-foreground"}>
                          {h.delta > 0 ? `+${h.delta}` : h.delta === 0 ? "±0" : h.delta}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{h.reason}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {format(parseISO(h.created_at), "d MMM yyyy 'à' HH'h'mm", { locale: fr })}
                        {" · solde : "}{h.balance_after}
                        {h.activity ? ` · ${ACTIVITY_LABEL[h.activity] || h.activity}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={!!adjust} onOpenChange={(o) => !o && !busy && setAdjust(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjust?.sign === 1 ? "Ajouter des crédits" : "Retirer des crédits"}
            </DialogTitle>
            <DialogDescription>
              {adjust && `${adjust.wallet.first_name} ${adjust.wallet.last_name} — pack ${adjust.wallet.package_code}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motif</Label>
              <Select value={adjustReason} onValueChange={setAdjustReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECREDIT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {adjustReason === "Autre" && (
              <div className="space-y-2">
                <Label htmlFor="custom">Précisez</Label>
                <Input id="custom" value={adjustCustom} onChange={(e) => setAdjustCustom(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="qty">Nombre de séances</Label>
              <Input id="qty" type="number" min={1} max={20} value={adjustQty}
                onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value) || 1))} />
            </div>
            <p className="text-xs text-muted-foreground">
              Le paiement Stripe n'est jamais modifié. Le mouvement est enregistré dans l'historique.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdjust(null)} disabled={busy}>Annuler</Button>
            <Button onClick={submitAdjust} disabled={busy || finalReason.length < 3}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCredit} onOpenChange={(o) => !o && !busy && setEditCredit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCredit?.mode === "extend" ? "Prolonger l'expiration" : "Réactiver un crédit expiré"}
            </DialogTitle>
            <DialogDescription>
              {editCredit &&
                `${ACTIVITY_LABEL[editCredit.credit.activity] || editCredit.credit.activity} — expire actuellement le ${format(parseISO(editCredit.credit.expires_at), "d MMM yyyy", { locale: fr })}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newdate">Nouvelle date d'expiration</Label>
              <Input id="newdate" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editreason">Motif (journalisé)</Label>
              <Input id="editreason" value={editReason} onChange={(e) => setEditReason(e.target.value)}
                placeholder="Ex : geste commercial, saison sans vent…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditCredit(null)} disabled={busy}>Annuler</Button>
            <Button onClick={submitCreditEdit} disabled={busy || editReason.trim().length < 3 || !editDate}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCredits;