import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, RefreshCw, Plus, Minus, History, RotateCcw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecreditDialog } from "@/components/admin/RecreditDialog";

interface Pkg {
  id: string;
  package_code: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  activity: string;
  package_type: string;
  total_sessions: number;
  used_sessions: number;
  deposit_amount: number | null;
  deposit_paid_at: string | null;
  status: string;
  expires_at: string;
  created_at: string;
}

interface HistoryEntry {
  id: string;
  delta: number;
  kind: string;
  reason: string;
  balance_after: number;
  created_at: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
  expired: "outline",
};

const AdminPackagesManager = () => {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adjustPkg, setAdjustPkg] = useState<Pkg | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount] = useState(1);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [historyPkg, setHistoryPkg] = useState<Pkg | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [recreditPkg, setRecreditPkg] = useState<Pkg | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_packages")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Erreur de chargement : " + error.message);
      return;
    }
    setPackages((data as any) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdjustDialog = (p: Pkg, direction: "credit" | "debit") => {
    setAdjustPkg(p);
    setAdjustDirection(direction);
    setAdjustAmount(1);
    setAdjustReason("");
  };

  const submitAdjust = async () => {
    if (!adjustPkg) return;
    if (adjustReason.trim().length < 3) {
      toast.error("Le motif est obligatoire (3 caractères minimum)");
      return;
    }
    if (adjustAmount < 1) {
      toast.error("La quantité doit être supérieure à 0");
      return;
    }
    setAdjusting(true);
    const delta = adjustDirection === "credit" ? adjustAmount : -adjustAmount;
    const { data, error } = await supabase.rpc("admin_adjust_package_credits", {
      p_package_id: adjustPkg.id,
      p_delta: delta,
      p_reason: adjustReason.trim(),
    });
    setAdjusting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as any;
    toast.success(
      adjustDirection === "credit"
        ? `+${adjustAmount} crédit(s) ajouté(s). Solde : ${result?.remaining ?? "?"}`
        : `-${adjustAmount} crédit(s) retiré(s). Solde : ${result?.remaining ?? "?"}`
    );
    setAdjustPkg(null);
    load();
  };

  const openHistory = async (p: Pkg) => {
    setHistoryPkg(p);
    setHistoryEntries([]);
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("package_credit_history")
      .select("id, delta, kind, reason, balance_after, created_at")
      .eq("package_id", p.id)
      .order("created_at", { ascending: false });
    setHistoryLoading(false);
    if (error) {
      toast.error("Erreur historique : " + error.message);
      return;
    }
    setHistoryEntries((data as any) || []);
  };

  const setStatus = async (p: Pkg, status: string) => {
    setBusyId(p.id);
    const { error } = await supabase
      .from("client_packages")
      .update({ status })
      .eq("id", p.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Statut mis à jour");
    load();
  };

  const filtered = packages.filter((p) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      p.package_code.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      p.activity.toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Filtrer par code, email, nom, activité…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} pack{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Activité</TableHead>
                  <TableHead>Crédits</TableHead>
                  <TableHead>Acompte</TableHead>
                  <TableHead>Expire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.package_code}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {p.first_name} {p.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                      {p.phone && <div className="text-xs text-muted-foreground">{p.phone}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.activity}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">{p.package_type}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          disabled={busyId === p.id}
                          onClick={() => openAdjustDialog(p, "debit")}
                          title="Retirer des crédits"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-semibold tabular-nums">
                          {p.total_sessions - p.used_sessions}/{p.total_sessions}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          disabled={busyId === p.id}
                          onClick={() => openAdjustDialog(p, "credit")}
                          title="Ajouter des crédits"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => openHistory(p)}
                          title="Voir l'historique"
                        >
                          <History className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.deposit_amount ? `${p.deposit_amount}€` : "-"}
                      {p.deposit_paid_at && (
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(p.deposit_paid_at), "d MMM yyyy", { locale: fr })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(parseISO(p.expires_at), "d MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status] || "outline"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {p.status === "active" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setStatus(p, "cancelled")}
                            disabled={busyId === p.id}
                          >
                            Annuler
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setStatus(p, "active")}
                            disabled={busyId === p.id}
                          >
                            Réactiver
                          </Button>
                        )}
                        <a
                          href={`/mon-espace/${p.package_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline text-center"
                        >
                          Voir l'espace
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucun pack
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Adjust credits dialog */}
        <Dialog open={!!adjustPkg} onOpenChange={(o) => !o && setAdjustPkg(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {adjustDirection === "credit" ? "Ajouter des crédits" : "Retirer des crédits"}
              </DialogTitle>
              <DialogDescription>
                {adjustPkg && (
                  <>
                    {adjustPkg.first_name} {adjustPkg.last_name} — Pack{" "}
                    <span className="font-mono">{adjustPkg.package_code}</span>
                    <br />
                    Solde actuel : {adjustPkg.total_sessions - adjustPkg.used_sessions} session(s)
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={adjustDirection}
                  onValueChange={(v) => setAdjustDirection(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Crédit (+) — recréditer</SelectItem>
                    <SelectItem value="debit">Débit (−) — retirer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjust-amount">Quantité</Label>
                <Input
                  id="adjust-amount"
                  type="number"
                  min={1}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjust-reason">
                  Motif <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="adjust-reason"
                  placeholder="Ex : session annulée pour cause de vent trop fort"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Le motif est obligatoire et conservé dans l'historique.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAdjustPkg(null)} disabled={adjusting}>
                Annuler
              </Button>
              <Button onClick={submitAdjust} disabled={adjusting}>
                {adjusting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History dialog */}
        <Dialog open={!!historyPkg} onOpenChange={(o) => !o && setHistoryPkg(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Historique des crédits</DialogTitle>
              <DialogDescription>
                {historyPkg && (
                  <>
                    {historyPkg.first_name} {historyPkg.last_name} —{" "}
                    <span className="font-mono">{historyPkg.package_code}</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : historyEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun mouvement
              </p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Δ</TableHead>
                      <TableHead className="text-right">Solde</TableHead>
                      <TableHead>Motif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyEntries.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(parseISO(h.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              h.kind === "initial"
                                ? "secondary"
                                : h.delta > 0
                                  ? "default"
                                  : "outline"
                            }
                          >
                            {h.kind}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-semibold ${h.delta > 0 ? "text-emerald-600" : "text-destructive"}`}
                        >
                          {h.delta > 0 ? `+${h.delta}` : h.delta}
                        </TableCell>
                        <TableCell className="text-right font-mono">{h.balance_after}</TableCell>
                        <TableCell className="text-xs">{h.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminPackagesManager;