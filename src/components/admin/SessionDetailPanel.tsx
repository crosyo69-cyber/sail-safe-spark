import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Phone,
  X,
  Plus,
  Minus,
  RotateCcw,
  User,
  CreditCard,
  Info,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Activity = "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte" | "stage_100_glisse";
type TimeSlot = "morning" | "early_afternoon" | "late_afternoon";

interface Reservation {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  skill_level: string;
  participants: number;
  status: string;
}

interface NestedClientPackage {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  package_code: string;
  package_type: string;
  total_sessions: number;
  used_sessions: number;
}

interface PackageBooking {
  id: string;
  status: string;
  client_packages: NestedClientPackage | null;
}

export interface SessionDetail {
  id: string;
  date: string;
  time_slot: TimeSlot;
  activity: Activity;
  max_participants: number;
  status: string;
  notes: string | null;
  weather_condition: string | null;
  reservations?: Reservation[];
  package_bookings?: PackageBooking[];
}

const ACTIVITY_LABELS: Record<Activity, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: "Matin",
  early_afternoon: "Début d'après-midi",
  late_afternoon: "Fin d'après-midi",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  open: "bg-green-100 text-green-800 border-green-300",
  closed: "bg-slate-100 text-slate-800 border-slate-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  open: "Ouverte",
  closed: "Fermée",
};

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

interface SessionDetailPanelProps {
  session: SessionDetail | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const SessionDetailPanel = ({ session, open, onClose, onRefresh }: SessionDetailPanelProps) => {
  const [cancelTarget, setCancelTarget] = useState<{
    type: "booking" | "reservation";
    id: string;
    name: string;
  } | null>(null);
  const [recreditTarget, setRecreditTarget] = useState<{
    pkgId: string;
    pkgName: string;
  } | null>(null);
  const [recreditAmount, setRecreditAmount] = useState(1);
  const [recreditReason, setRecreditReason] = useState("");
  const [recrediting, setRecrediting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [slotOccupancy, setSlotOccupancy] = useState<{
    capacity: number; stage: number; a_la_carte: number; weather: number; taken: number;
  } | null>(null);

  useEffect(() => {
    if (!session || !open) { setSlotOccupancy(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_slot_occupancy", {
        p_date: session.date, p_slot: session.time_slot as any,
      });
      if (!cancelled && data) setSlotOccupancy(data as any);
    })();
    return () => { cancelled = true; };
  }, [session, open]);

  if (!session) return null;

  const dateLabel = format(parseISO(session.date), "EEEE d MMMM yyyy", { locale: fr });
  const occupied =
    (session.reservations?.reduce((sum, r) => sum + (r.status !== "cancelled" ? r.participants : 0), 0) || 0) +
    (session.package_bookings?.filter((b) => b.status === "confirmed").length || 0);

  const handleCancelBooking = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const { error } = await supabase
      .from("package_bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", cancelTarget.id);
    setCancelling(false);
    setCancelTarget(null);
    if (error) {
      toast.error("Erreur lors de l'annulation : " + error.message);
    } else {
      toast.success("Inscription annulée · Le crédit a été restitué automatiquement.");
      onRefresh();
    }
  };

  const handleCancelReservation = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", cancelTarget.id);
    setCancelling(false);
    setCancelTarget(null);
    if (error) {
      toast.error("Erreur lors de l'annulation : " + error.message);
    } else {
      toast.success("Réservation annulée.");
      onRefresh();
    }
  };

  const handleRecredit = async () => {
    if (!recreditTarget || !recreditReason.trim()) return;
    setRecrediting(true);
    const { data, error } = await supabase.rpc("admin_adjust_package_credits", {
      p_package_id: recreditTarget.pkgId,
      p_delta: recreditAmount,
      p_reason: recreditReason.trim(),
    });
    setRecrediting(false);
    if (error) {
      toast.error("Erreur recrédit : " + error.message);
    } else {
      const result = data as { remaining?: number } | null;
      toast.success(`Crédit recrédité · Solde restant : ${result?.remaining ?? "?"}`);
      setRecreditTarget(null);
      setRecreditAmount(1);
      setRecreditReason("");
      onRefresh();
    }
  };

  const pkgBookings = session.package_bookings || [];
  const reservations = session.reservations || [];

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    {ACTIVITY_LABELS[session.activity]}
                  </Badge>
                  <span className="text-muted-foreground font-normal">·</span>
                  <span>{dateLabel}</span>
                  <span className="text-muted-foreground font-normal">·</span>
                  <span>{SLOT_LABELS[session.time_slot]}</span>
                </DialogTitle>
                <DialogDescription className="mt-1.5 flex items-center gap-3 text-xs">
                  <Badge variant="outline" className={cn(STATUS_COLORS[session.status], "text-[10px]")}>
                    {STATUS_LABELS[session.status] || session.status}
                  </Badge>
                  <span className="text-muted-foreground">
                    {occupied} / {session.max_participants} places occupées
                  </span>
                  {slotOccupancy && (
                    <span className="ml-2 inline-flex flex-wrap gap-1.5 text-[10px]">
                      <Badge variant="outline" className="bg-primary/5">Stage : {slotOccupancy.stage}</Badge>
                      <Badge variant="outline" className="bg-secondary">Carte : {slotOccupancy.a_la_carte}</Badge>
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">Météo : {slotOccupancy.weather}</Badge>
                      <Badge variant={slotOccupancy.taken >= slotOccupancy.capacity ? "destructive" : "default"}>
                        Restantes : {Math.max(0, slotOccupancy.capacity - slotOccupancy.taken)} / {slotOccupancy.capacity}
                      </Badge>
                    </span>
                  )}
                  {session.notes && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" /> {session.notes}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="p-6 pt-4 space-y-8">
              {/* ── Inscrits par pack ── */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Inscrits par pack ({pkgBookings.filter((b) => b.status === "confirmed").length})
                </h3>
                {pkgBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun inscrit par pack.</p>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[140px]">Nom</TableHead>
                          <TableHead className="w-[180px]">Contact</TableHead>
                          <TableHead>Pack</TableHead>
                          <TableHead className="w-[100px]">Solde</TableHead>
                          <TableHead className="w-[90px]">Statut</TableHead>
                          <TableHead className="w-[120px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pkgBookings.map((b) => {
                          const pkg = b.client_packages;
                          const remaining = pkg ? pkg.total_sessions - pkg.used_sessions : 0;
                          const isConfirmed = b.status === "confirmed";
                          return (
                            <TableRow key={b.id} className={!isConfirmed ? "opacity-60" : ""}>
                              <TableCell className="font-medium text-foreground">
                                {pkg ? `${pkg.first_name} ${pkg.last_name}` : "—"}
                              </TableCell>
                              <TableCell>
                                {pkg ? (
                                  <div className="space-y-0.5 text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Mail className="w-3 h-3" />
                                      <span>{pkg.email}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <CreditCard className="w-3 h-3" />
                                      <span className="font-mono tracking-wide">{pkg.package_code}</span>
                                    </div>
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {pkg?.package_type || "—"}
                              </TableCell>
                              <TableCell>
                                {pkg ? (
                                  <div className="text-sm">
                                    <span className={remaining <= 1 ? "text-destructive font-semibold" : "text-foreground font-medium"}>
                                      {remaining}
                                    </span>
                                    <span className="text-muted-foreground"> / {pkg.total_sessions}</span>
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[b.status])}>
                                  {STATUS_LABELS[b.status] || b.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {pkg && isConfirmed && (
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                      title="Annuler l'inscription (recrédite le pack)"
                                      onClick={() =>
                                        setCancelTarget({
                                          type: "booking",
                                          id: b.id,
                                          name: `${pkg.first_name} ${pkg.last_name}`,
                                        })
                                      }
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-primary hover:text-primary"
                                      title="Recréditer manuellement"
                                      onClick={() =>
                                        setRecreditTarget({
                                          pkgId: pkg.id,
                                          pkgName: `${pkg.first_name} ${pkg.last_name} — ${pkg.package_code}`,
                                        })
                                      }
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>

              {/* ── Réservations directes ── */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-accent" />
                  Réservations directes ({reservations.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.participants, 0)} places)
                </h3>
                {reservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune réservation directe.</p>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[140px]">Nom</TableHead>
                          <TableHead className="w-[180px]">Contact</TableHead>
                          <TableHead className="w-[80px]">Niveau</TableHead>
                          <TableHead className="w-[60px]">Pers.</TableHead>
                          <TableHead className="w-[90px]">Statut</TableHead>
                          <TableHead className="w-[80px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservations.map((r) => (
                          <TableRow key={r.id} className={r.status === "cancelled" ? "opacity-60" : ""}>
                            <TableCell className="font-medium text-foreground">
                              {r.first_name} {r.last_name}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5 text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Mail className="w-3 h-3" />
                                  <span>{r.email}</span>
                                </div>
                                {r.phone && r.phone !== "Non renseigné" && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    <span>{r.phone}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {LEVEL_LABELS[r.skill_level] || r.skill_level}
                            </TableCell>
                            <TableCell className="text-sm">{r.participants}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[r.status])}>
                                {STATUS_LABELS[r.status] || r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {r.status !== "cancelled" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  title="Annuler la réservation"
                                  onClick={() =>
                                    setCancelTarget({
                                      type: "reservation",
                                      id: r.id,
                                      name: `${r.first_name} ${r.last_name}`,
                                    })
                                  }
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ── Dialog de confirmation d'annulation ── */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette inscription ?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.type === "booking"
                ? `L'inscription de ${cancelTarget.name} sera annulée et son crédit restitué automatiquement.`
                : `La réservation de ${cancelTarget?.name} sera annulée.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={cancelTarget?.type === "booking" ? handleCancelBooking : handleCancelReservation}
              disabled={cancelling}
            >
              {cancelling ? "Traitement…" : "Confirmer l'annulation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog de recrédit manuel ── */}
      <Dialog open={!!recreditTarget} onOpenChange={(v) => !v && setRecreditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recréditer manuellement</DialogTitle>
            <DialogDescription>{recreditTarget?.pkgName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Nombre de sessions à ajouter</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setRecreditAmount((v) => Math.max(1, v - 1))}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={recreditAmount}
                  onChange={(e) => setRecreditAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8 w-20 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setRecreditAmount((v) => Math.min(20, v + 1))}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm">Motif</Label>
              <Textarea
                value={recreditReason}
                onChange={(e) => setRecreditReason(e.target.value)}
                placeholder="Ex. : Session annulée par l'école, élève malade…"
                className="mt-1.5 min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRecreditTarget(null)}>
              Annuler
            </Button>
            <Button
              onClick={handleRecredit}
              disabled={!recreditReason.trim() || recrediting}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {recrediting ? "Traitement…" : "Recréditer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SessionDetailPanel;
