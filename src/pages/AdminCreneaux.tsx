import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, Loader2, AlertTriangle, Plus, Trash2, Edit3,
  ArrowRightLeft, UserPlus, Ban, Unlock, Lock, ArrowLeft, ClipboardCheck, CheckCircle2, XCircle,
} from "lucide-react";

type TimeSlot = "morning" | "early_afternoon" | "late_afternoon";
type Activity = "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte" | "stage_100_glisse";

type AuditFix = "reopen" | "close" | "delete";
interface AuditIssue { id: string; label: string; detail: string; fixable?: AuditFix; }
interface AuditGroup { key: string; title: string; severity: "critical" | "warning" | "info"; items: AuditIssue[]; }
interface AuditReport { generatedAt: string; totalSessions: number; groups: AuditGroup[]; }

const SLOTS: TimeSlot[] = ["morning", "early_afternoon", "late_afternoon"];
const SLOT_LABEL: Record<TimeSlot, string> = {
  morning: "Matin",
  early_afternoon: "Milieu de journée",
  late_afternoon: "Après-midi",
};
const ACTIVITY_LABEL: Record<Activity, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};
const ACTIVITY_MAX: Partial<Record<Activity, number>> = {
  kitesurf: 4,
  wingfoil: 3,
};
const STATUS_LABEL: Record<string, string> = {
  open: "Ouverte",
  closed: "Fermée",
  cancelled: "Annulée",
};

// Libellé calculé à partir des données réelles (statut + occupation)
function effectiveStatus(s: { status: string; max_participants: number }, occ: number):
  { key: "cancelled" | "full" | "empty_closed" | "closed" | "open"; label: string } {
  if (s.status === "cancelled") return { key: "cancelled", label: "Annulée" };
  if (occ >= s.max_participants && s.max_participants > 0) return { key: "full", label: "Complète" };
  if (s.status === "closed" && occ === 0) return { key: "empty_closed", label: "Fermée (vide)" };
  if (s.status === "closed") return { key: "closed", label: "Fermée" };
  return { key: "open", label: "Ouverte" };
}

interface Reservation {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  participants: number;
  status: string;
}
interface PackageBooking {
  id: string;
  status: string;
  package_id: string;
  client_packages: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    package_code: string;
  } | null;
}
interface Session {
  id: string;
  date: string;
  time_slot: TimeSlot;
  activity: Activity;
  max_participants: number;
  status: string;
  notes: string | null;
  created_at: string;
  reservations: Reservation[];
  package_bookings: PackageBooking[];
}

function slotKey(date: string, slot: TimeSlot) {
  return `${date}__${slot}`;
}
function occupancy(s: Session): number {
  const r = s.reservations.filter(r => r.status !== "cancelled").reduce((a, b) => a + (b.participants || 1), 0);
  const p = s.package_bookings.filter(b => b.status === "confirmed").length;
  return r + p;
}

const AdminCreneaux = () => {
  const { isAdmin, isLoading, user } = useAdmin();
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActivity, setFilterActivity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCreation, setFilterCreation] = useState<string>("all");
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [newCapacity, setNewCapacity] = useState<number>(4);
  const [createSlot, setCreateSlot] = useState<{ date: string; slot: TimeSlot } | null>(null);
  const [createActivity, setCreateActivity] = useState<Activity>("kitesurf");
  const [createCapacity, setCreateCapacity] = useState<number>(4);
  const [addStudentSession, setAddStudentSession] = useState<Session | null>(null);
  const [addCode, setAddCode] = useState("");
  const [moveBooking, setMoveBooking] = useState<{ bookingId: string; kind: "reservation" | "package"; currentSessionId: string } | null>(null);
  const [moveTarget, setMoveTarget] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<Session | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const rangeStart = format(weekStart, "yyyy-MM-dd");
  const rangeEnd = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        id, date, time_slot, activity, max_participants, status, notes, created_at,
        reservations(id, first_name, last_name, email, participants, status),
        package_bookings(id, status, package_id, client_packages(id, first_name, last_name, email, package_code))
      `)
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .order("date")
      .order("time_slot");
    if (error) {
      toast({ title: "Erreur de chargement", description: error.message, variant: "destructive" });
    } else {
      setSessions((data as any) || []);
    }
    setLoading(false);
  }, [rangeStart, rangeEnd, toast]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  const filtered = useMemo(() => sessions.filter(s => {
    if (filterActivity !== "all" && s.activity !== filterActivity) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterCreation === "auto" && !(s.notes || "").toLowerCase().includes("auto-créée")) return false;
    if (filterCreation === "manual" && (s.notes || "").toLowerCase().includes("auto-créée")) return false;
    return true;
  }), [sessions, filterActivity, filterStatus, filterCreation]);

  const byKey = useMemo(() => {
    const m = new Map<string, Session[]>();
    for (const s of filtered) {
      const k = slotKey(s.date, s.time_slot);
      const arr = m.get(k) || [];
      arr.push(s);
      m.set(k, arr);
    }
    return m;
  }, [filtered]);

  const anomalies = useMemo(() => {
    const overCap: Session[] = [];
    const staleAuto: Session[] = [];
    const emptyClosed: Session[] = [];
    const now = Date.now();
    for (const s of sessions) {
      const occ = occupancy(s);
      if (occ > s.max_participants) overCap.push(s);
      const isAuto = (s.notes || "").toLowerCase().includes("auto-créée");
      const ageDays = (now - new Date(s.created_at).getTime()) / 86400000;
      if (isAuto && ageDays > 7 && occ === 0) staleAuto.push(s);
      if (s.status === "closed" && occ === 0 && s.date >= format(new Date(), "yyyy-MM-dd")) {
        emptyClosed.push(s);
      }
    }
    return { overCap, staleAuto, emptyClosed };
  }, [sessions]);

  const [stuckCount, setStuckCount] = useState<number | null>(null);
  useEffect(() => {
    // Signal fiable : notifications admin non lues du webhook Stripe (14 derniers jours).
    (async () => {
      const since = new Date(Date.now() - 14 * 86400000).toISOString();
      const { count, error } = await supabase
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .eq("kind", "stripe_webhook_error")
        .is("read_at", null)
        .gte("created_at", since);
      if (!error) setStuckCount(count ?? 0);
      else setStuckCount(0);
    })();
  }, []);

  const reopenEmptyClosed = async () => {
    const ids = anomalies.emptyClosed.map(s => s.id);
    if (!ids.length) return;
    const { error } = await supabase.from("sessions").update({ status: "open" }).in("id", ids);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: `${ids.length} session(s) rouverte(s)` }); load(); }
  };

  const changeStatus = async (s: Session, status: string) => {
    const { error } = await supabase.from("sessions").update({ status }).eq("id", s.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Statut mis à jour" }); load(); }
  };
  const saveCapacity = async () => {
    if (!editSession) return;
    const { error } = await supabase.from("sessions").update({ max_participants: newCapacity }).eq("id", editSession.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Capacité mise à jour" }); setEditSession(null); load(); }
  };
  const deleteSession = async () => {
    if (!deleteConfirm) return;
    if (occupancy(deleteConfirm) > 0) {
      toast({ title: "Impossible", description: "La session contient des inscriptions.", variant: "destructive" });
      setDeleteConfirm(null);
      return;
    }
    const { error } = await supabase.from("sessions").delete().eq("id", deleteConfirm.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Session supprimée" }); setDeleteConfirm(null); load(); }
  };
  const createSession = async () => {
    if (!createSlot) return;
    const { error } = await supabase.from("sessions").insert({
      date: createSlot.date,
      time_slot: createSlot.slot,
      activity: createActivity,
      max_participants: createCapacity,
      status: "open",
    } as any);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Session créée" }); setCreateSlot(null); load(); }
  };
  const addStudentByCode = async () => {
    if (!addStudentSession || !addCode.trim()) return;
    const { data, error } = await supabase.rpc("book_session_with_code", {
      p_code: addCode.trim(), p_session_id: addStudentSession.id,
    } as any);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else if ((data as any)?.ok === false) toast({ title: "Refusé", description: (data as any).error, variant: "destructive" });
    else { toast({ title: "Élève inscrit" }); setAddStudentSession(null); setAddCode(""); load(); }
  };
  const moveStudent = async () => {
    if (!moveBooking || !moveTarget) return;
    const table = moveBooking.kind === "reservation" ? "reservations" : "package_bookings";
    const { error } = await supabase.from(table as any).update({ session_id: moveTarget }).eq("id", moveBooking.bookingId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Élève déplacé" }); setMoveBooking(null); setMoveTarget(""); load(); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
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

  const activeSessionsForMove = sessions.filter(s => s.status !== "cancelled" && s.id !== moveBooking?.currentSessionId);

  const runAudit = async () => {
    setAuditRunning(true);
    setAuditOpen(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const sinceDate = format(addDays(new Date(), -30), "yyyy-MM-dd");

      const sessRes = await supabase.from("sessions").select(`
          id, date, time_slot, activity, max_participants, status, notes, created_at,
          reservations(id, participants, status),
          package_bookings(id, status)
        `).gte("date", sinceDate).order("date");
      const notifRes = await supabase.from("admin_notifications").select("id, kind, title, body, created_at, read_at")
        .in("kind", ["stripe_webhook_error", "session_generation"]).is("read_at", null).gte("created_at", since);
      const resvRes = await supabase.from("reservations").select("id, session_id, status, created_at")
        .is("session_id", null).gte("created_at", since);
      const pkgRes = await supabase.from("package_bookings").select("id, session_id, status, created_at")
        .is("session_id", null).gte("created_at", since);

      const all = ((sessRes.data as any) || []) as Session[];
      const overCap: AuditIssue[] = [];
      const emptyClosed: AuditIssue[] = [];
      const openButFull: AuditIssue[] = [];
      const closedButAvailable: AuditIssue[] = [];
      const badCapacity: AuditIssue[] = [];
      const staleAuto: AuditIssue[] = [];
      const duplicateSlot: AuditIssue[] = [];
      const cancelledWithBookings: AuditIssue[] = [];

      const now = Date.now();
      const seen = new Map<string, Session[]>();

      for (const s of all) {
        const occ = occupancy(s);
        const isFuture = s.date >= today;
        const isAuto = (s.notes || "").toLowerCase().includes("auto-créée");
        const ageDays = (now - new Date(s.created_at).getTime()) / 86400000;
        const label = `${format(new Date(s.date), "d MMM", { locale: fr })} · ${SLOT_LABEL[s.time_slot]} · ${ACTIVITY_LABEL[s.activity]}`;

        if (occ > s.max_participants) overCap.push({ id: s.id, label, detail: `${occ}/${s.max_participants} inscrits` });
        if (isFuture && s.status === "closed" && occ === 0) emptyClosed.push({ id: s.id, label, detail: "Fermée sans inscription", fixable: "reopen" });
        if (isFuture && s.status === "open" && occ >= s.max_participants && s.max_participants > 0)
          openButFull.push({ id: s.id, label, detail: `Complète (${occ}/${s.max_participants}) mais toujours « ouverte »`, fixable: "close" });
        if (isFuture && s.status === "closed" && occ > 0 && occ < s.max_participants)
          closedButAvailable.push({ id: s.id, label, detail: `${occ}/${s.max_participants} — place(s) libre(s) mais fermée`, fixable: "reopen" });

        const expectedMax = ACTIVITY_MAX[s.activity];
        if (expectedMax && s.max_participants !== expectedMax)
          badCapacity.push({ id: s.id, label, detail: `Capacité ${s.max_participants} au lieu de ${expectedMax}` });

        if (isFuture && isAuto && ageDays > 7 && occ === 0)
          staleAuto.push({ id: s.id, label, detail: `Auto-créée il y a ${Math.round(ageDays)}j, aucune inscription`, fixable: "delete" });

        if (s.status === "cancelled" && occ > 0)
          cancelledWithBookings.push({ id: s.id, label, detail: `Annulée mais ${occ} inscription(s) encore actives` });

        const k = `${s.date}__${s.time_slot}__${s.activity}`;
        const arr = seen.get(k) || [];
        arr.push(s); seen.set(k, arr);
      }
      for (const [k, arr] of seen) {
        if (arr.length > 1) {
          const s = arr[0];
          duplicateSlot.push({
            id: s.id,
            label: `${format(new Date(s.date), "d MMM", { locale: fr })} · ${SLOT_LABEL[s.time_slot]} · ${ACTIVITY_LABEL[s.activity]}`,
            detail: `${arr.length} sessions identiques (doublon)`,
          });
        }
      }

      const stripeStuck: AuditIssue[] = ((notifRes.data as any) || [])
        .filter((n: any) => n.kind === "stripe_webhook_error")
        .map((n: any) => ({ id: n.id, label: n.title || "Erreur Stripe", detail: n.body || "" }));
      const genAlerts: AuditIssue[] = ((notifRes.data as any) || [])
        .filter((n: any) => n.kind === "session_generation")
        .map((n: any) => ({ id: n.id, label: n.title, detail: n.body || "" }));

      const orphanResv: AuditIssue[] = ((resvRes.data as any) || [])
        .map((r: any) => ({ id: r.id, label: `Réservation ${r.id.slice(0, 8)}`, detail: `Sans session (${r.status})` }));
      const orphanPkg: AuditIssue[] = ((pkgRes.data as any) || [])
        .map((b: any) => ({ id: b.id, label: `Booking pack ${b.id.slice(0, 8)}`, detail: `Sans session (${b.status})` }));

      const report: AuditReport = {
        generatedAt: new Date().toISOString(),
        totalSessions: all.length,
        groups: [
          { key: "overCap", title: "Capacité dépassée", severity: "critical", items: overCap },
          { key: "cancelledWithBookings", title: "Sessions annulées avec inscriptions actives", severity: "critical", items: cancelledWithBookings },
          { key: "duplicateSlot", title: "Doublons (même date/créneau/activité)", severity: "critical", items: duplicateSlot },
          { key: "orphanResv", title: "Réservations orphelines (sans session)", severity: "critical", items: orphanResv },
          { key: "orphanPkg", title: "Bookings pack orphelins (sans session)", severity: "critical", items: orphanPkg },
          { key: "stripeStuck", title: "Paiements Stripe non convertis", severity: "critical", items: stripeStuck },
          { key: "emptyClosed", title: "Fermées sans inscription (à rouvrir)", severity: "warning", items: emptyClosed },
          { key: "openButFull", title: "Ouvertes alors que complètes", severity: "warning", items: openButFull },
          { key: "closedButAvailable", title: "Fermées avec places libres", severity: "warning", items: closedButAvailable },
          { key: "badCapacity", title: "Capacité incohérente avec l'activité", severity: "warning", items: badCapacity },
          { key: "staleAuto", title: "Sessions auto-créées obsolètes", severity: "info", items: staleAuto },
          { key: "genAlerts", title: "Alertes de génération de sessions", severity: "info", items: genAlerts },
        ],
      };
      setAuditReport(report);
    } catch (e: any) {
      toast({ title: "Erreur audit", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setAuditRunning(false);
    }
  };

  const applyAuditFixes = async () => {
    if (!auditReport) return;
    const toOpen = new Set<string>();
    const toClose = new Set<string>();
    const toDelete = new Set<string>();
    for (const g of auditReport.groups) {
      for (const it of g.items) {
        if (it.fixable === "reopen") toOpen.add(it.id);
        else if (it.fixable === "close") toClose.add(it.id);
        else if (it.fixable === "delete") toDelete.add(it.id);
      }
    }
    const ops: any[] = [];
    if (toOpen.size) ops.push(supabase.from("sessions").update({ status: "open" }).in("id", Array.from(toOpen)));
    if (toClose.size) ops.push(supabase.from("sessions").update({ status: "closed" }).in("id", Array.from(toClose)));
    if (toDelete.size) ops.push(supabase.from("sessions").delete().in("id", Array.from(toDelete)));
    const results = await Promise.all(ops);
    const err = results.find((r: any) => r?.error);
    if (err?.error) toast({ title: "Erreur", description: err.error.message, variant: "destructive" });
    else {
      toast({ title: "Corrections appliquées", description: `${toOpen.size} rouverte(s) · ${toClose.size} fermée(s) · ${toDelete.size} supprimée(s)` });
      setAuditOpen(false);
      setAuditReport(null);
      load();
      runAudit();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Gestion des créneaux | Kitesurf Passion</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Button asChild variant="ghost" size="sm"><Link to="/admin"><ArrowLeft className="w-4 h-4 mr-1" />Admin</Link></Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Gestion des créneaux</h1>
          <Button size="sm" variant="default" className="ml-auto" onClick={runAudit} disabled={auditRunning}>
            {auditRunning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ClipboardCheck className="w-4 h-4 mr-1" />}
            Lancer l'audit
          </Button>
        </div>

        {/* Anomalies */}
        {(anomalies.overCap.length > 0 || anomalies.emptyClosed.length > 0 || anomalies.staleAuto.length > 0 || (stuckCount ?? 0) > 0) && (
          <Card className="p-4 mb-6 border-destructive/40 bg-destructive/5">
            <div className="flex items-center gap-2 mb-3 text-destructive font-semibold">
              <AlertTriangle className="w-5 h-5" /> Anomalies détectées
            </div>
            <ul className="space-y-1 text-sm">
              {anomalies.overCap.length > 0 && <li>• {anomalies.overCap.length} session(s) en dépassement de capacité</li>}
              {anomalies.emptyClosed.length > 0 && (
                <li className="flex items-center gap-2 flex-wrap">
                  • {anomalies.emptyClosed.length} session(s) fermée(s) sans aucune inscription (affichées à tort comme « Complète »)
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={reopenEmptyClosed}>
                    Rouvrir automatiquement
                  </Button>
                </li>
              )}
              {(stuckCount ?? 0) > 0 && <li>• {stuckCount} paiement(s) Stripe potentiellement bloqué(s) (14 derniers jours)</li>}
              {anomalies.staleAuto.length > 0 && <li>• {anomalies.staleAuto.length} session(s) auto-créée(s) &gt; 7 jours sans inscription</li>}
            </ul>
          </Card>
        )}

        {/* Filters + week nav */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="w-4 h-4" /></Button>
              <div className="min-w-[220px] text-center font-medium">
                Semaine du {format(weekStart, "d MMM", { locale: fr })} au {format(addDays(weekStart, 6), "d MMM yyyy", { locale: fr })}
              </div>
              <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Aujourd'hui</Button>
            </div>
            <div className="flex flex-wrap gap-2 ml-auto">
              <Select value={filterActivity} onValueChange={setFilterActivity}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes activités</SelectItem>
                  {(Object.keys(ACTIVITY_LABEL) as Activity[]).map(a => <SelectItem key={a} value={a}>{ACTIVITY_LABEL[a]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="open">Ouvertes</SelectItem>
                  <SelectItem value="closed">Complètes</SelectItem>
                  <SelectItem value="cancelled">Annulées</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCreation} onValueChange={setFilterCreation}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes créations</SelectItem>
                  <SelectItem value="manual">Manuelle</SelectItem>
                  <SelectItem value="auto">Auto Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {weekDays.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              return (
                <Card key={dateStr} className="p-3">
                  <div className="font-semibold text-sm mb-2 capitalize">
                    {format(day, "EEE d MMM", { locale: fr })}
                  </div>
                  <div className="space-y-2">
                    {SLOTS.map(slot => {
                      const items = byKey.get(slotKey(dateStr, slot)) || [];
                      return (
                        <div key={slot} className="rounded-md border border-border p-2 bg-muted/20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">{SLOT_LABEL[slot]}</span>
                            {items.length === 0 && (
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                setCreateSlot({ date: dateStr, slot });
                                setCreateActivity("kitesurf");
                                setCreateCapacity(4);
                              }} title="Créer une session">
                                <Plus className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          {items.length === 0 && <div className="text-xs text-muted-foreground italic">Libre</div>}
                          {items.map(s => {
                            const occ = occupancy(s);
                            const over = occ > s.max_participants;
                            const eff = effectiveStatus(s, occ);
                            const reservations = s.reservations.filter(r => r.status !== "cancelled");
                            const pkgBookings = s.package_bookings.filter(b => b.status === "confirmed");
                            return (
                              <div key={s.id} className={cn("rounded-md p-2 mb-1 text-xs", over ? "bg-destructive/10 border border-destructive/40" : "bg-card border border-border")}>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <Badge variant={eff.key === "cancelled" ? "destructive" : eff.key === "full" ? "secondary" : eff.key === "empty_closed" || eff.key === "closed" ? "outline" : "default"} className="text-[10px]">
                                    {ACTIVITY_LABEL[s.activity]}
                                  </Badge>
                                  <span className={cn("font-semibold", over && "text-destructive")}>{occ}/{s.max_participants}</span>
                                </div>
                                <div className={cn("text-[10px] mb-1", eff.key === "empty_closed" ? "text-amber-600 font-medium" : "text-muted-foreground")}>{eff.label}</div>
                                {over && <Badge variant="destructive" className="text-[10px] mb-1">Capacité dépassée</Badge>}
                                {(reservations.length + pkgBookings.length) > 0 && (
                                  <ul className="space-y-0.5 mb-2 max-h-32 overflow-y-auto">
                                    {reservations.map(r => (
                                      <li key={r.id} className="flex items-center justify-between gap-1 text-[11px]">
                                        <span className="truncate">{r.first_name} {r.last_name}{r.participants > 1 ? ` (×${r.participants})` : ""}</span>
                                        <button className="text-muted-foreground hover:text-primary" title="Déplacer" onClick={() => { setMoveBooking({ bookingId: r.id, kind: "reservation", currentSessionId: s.id }); setMoveTarget(""); }}>
                                          <ArrowRightLeft className="w-3 h-3" />
                                        </button>
                                      </li>
                                    ))}
                                    {pkgBookings.map(b => (
                                      <li key={b.id} className="flex items-center justify-between gap-1 text-[11px]">
                                        <span className="truncate">
                                          {b.client_packages?.first_name} {b.client_packages?.last_name}
                                          {b.client_packages?.package_code && <span className="text-muted-foreground"> · {b.client_packages.package_code}</span>}
                                        </span>
                                        <button className="text-muted-foreground hover:text-primary" title="Déplacer" onClick={() => { setMoveBooking({ bookingId: b.id, kind: "package", currentSessionId: s.id }); setMoveTarget(""); }}>
                                          <ArrowRightLeft className="w-3 h-3" />
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                <div className="flex flex-wrap gap-1">
                                  {s.status !== "open" && <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => changeStatus(s, "open")}><Unlock className="w-3 h-3 mr-0.5" />Ouvrir</Button>}
                                  {s.status !== "closed" && <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => changeStatus(s, "closed")}><Lock className="w-3 h-3 mr-0.5" />Fermer</Button>}
                                  {s.status !== "cancelled" && <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => changeStatus(s, "cancelled")}><Ban className="w-3 h-3 mr-0.5" />Annuler</Button>}
                                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => { setEditSession(s); setNewCapacity(s.max_participants); }}><Edit3 className="w-3 h-3 mr-0.5" />Capacité</Button>
                                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => { setAddStudentSession(s); setAddCode(""); }}><UserPlus className="w-3 h-3 mr-0.5" />Ajouter</Button>
                                  {occ === 0 && <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] text-destructive" onClick={() => setDeleteConfirm(s)}><Trash2 className="w-3 h-3" /></Button>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      {/* Edit capacity */}
      <Dialog open={!!editSession} onOpenChange={(o) => !o && setEditSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la capacité</DialogTitle>
            <DialogDescription>
              {editSession && `${ACTIVITY_LABEL[editSession.activity]} · ${format(new Date(editSession.date), "d MMM yyyy", { locale: fr })} · ${SLOT_LABEL[editSession.time_slot]}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nombre maximum de participants</Label>
            <Input type="number" min={1} max={20} value={newCapacity} onChange={(e) => setNewCapacity(parseInt(e.target.value) || 1)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSession(null)}>Annuler</Button>
            <Button onClick={saveCapacity}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create session */}
      <Dialog open={!!createSlot} onOpenChange={(o) => !o && setCreateSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une session</DialogTitle>
            <DialogDescription>
              {createSlot && `${format(new Date(createSlot.date), "d MMM yyyy", { locale: fr })} · ${SLOT_LABEL[createSlot.slot]}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Activité</Label>
              <Select value={createActivity} onValueChange={(v) => {
                const a = v as Activity;
                setCreateActivity(a);
                setCreateCapacity(ACTIVITY_MAX[a] ?? 4);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACTIVITY_LABEL) as Activity[]).map(a => <SelectItem key={a} value={a}>{ACTIVITY_LABEL[a]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Capacité</Label>
              <Input type="number" min={1} max={20} value={createCapacity} onChange={(e) => setCreateCapacity(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSlot(null)}>Annuler</Button>
            <Button onClick={createSession}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add student by package code */}
      <Dialog open={!!addStudentSession} onOpenChange={(o) => !o && setAddStudentSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un élève</DialogTitle>
            <DialogDescription>Saisissez le code pack (KP-...) de l'élève à inscrire.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Code pack</Label>
            <Input value={addCode} onChange={(e) => setAddCode(e.target.value)} placeholder="KP-XXXXX" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStudentSession(null)}>Annuler</Button>
            <Button onClick={addStudentByCode}>Inscrire</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move student */}
      <Dialog open={!!moveBooking} onOpenChange={(o) => !o && setMoveBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déplacer l'élève</DialogTitle>
            <DialogDescription>Choisissez la session de destination.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Session de destination</Label>
            <Select value={moveTarget} onValueChange={setMoveTarget}>
              <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>
                {activeSessionsForMove.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {format(new Date(s.date), "d MMM", { locale: fr })} · {SLOT_LABEL[s.time_slot]} · {ACTIVITY_LABEL[s.activity]} ({occupancy(s)}/{s.max_participants})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveBooking(null)}>Annuler</Button>
            <Button onClick={moveStudent} disabled={!moveTarget}>Déplacer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la session ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm && `${ACTIVITY_LABEL[deleteConfirm.activity]} · ${format(new Date(deleteConfirm.date), "d MMM yyyy", { locale: fr })} · ${SLOT_LABEL[deleteConfirm.time_slot]}`}. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSession}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCreneaux;