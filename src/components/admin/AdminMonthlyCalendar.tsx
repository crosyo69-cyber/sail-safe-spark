import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Users, CalendarDays, UserPlus, Download, FileSpreadsheet, LockOpen, Lock, Plus, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import CalendarAddReservation from "./CalendarAddReservation";
import CalendarReservationActions from "./CalendarReservationActions";
import CalendarQuickSession from "./CalendarQuickSession";
import { XCircle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

type Activity = "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte" | "stage_100_glisse";

interface ReservationInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  participants: number;
  skill_level: string;
  status: string;
  source?: "reservation" | "package";
  package_code?: string;
}

interface SessionSummary {
  id: string;
  date: string;
  activity: Activity;
  time_slot: string;
  max_participants: number;
  reservation_count: number;
  status: string;
  reservations: ReservationInfo[];
}

const ACTIVITY_DOT_COLORS: Record<Activity, string> = {
  kitesurf: "bg-primary",
  wingfoil: "bg-accent",
  pumpfoil: "bg-turquoise",
  foil_tracte: "bg-ocean-dark",
  stage_100_glisse: "bg-sunset",
};

const ACTIVITY_LABELS: Record<Activity, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

const SLOT_SHORT: Record<string, string> = {
  morning: "Mat.",
  early_afternoon: "AM",
  late_afternoon: "PM",
};

interface AdminMonthlyCalendarProps {
  onNavigateToSession?: (date: Date) => void;
}

const AdminMonthlyCalendar = ({ onNavigateToSession }: AdminMonthlyCalendarProps = {}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<Activity | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "reservation" | "package">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending">("all");
  const [addingToSession, setAddingToSession] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<SessionSummary | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  useEffect(() => {
    const fetchMonth = async () => {
      setLoading(true);
      const from = format(calStart, "yyyy-MM-dd");
      const to = format(calEnd, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("sessions")
        .select(`
          id, date, activity, time_slot, max_participants, status,
          reservations(id, first_name, last_name, email, phone, participants, skill_level, status),
          package_bookings(id, status, client_packages(package_code, first_name, last_name, email, phone))
        `)
        .gte("date", from)
        .lte("date", to);

      if (!error && data) {
        setSessions(
          data.map((s: any) => {
            const reservationParticipants: ReservationInfo[] = (s.reservations || [])
              .map((r: any) => ({
                id: r.id,
                first_name: r.first_name,
                last_name: r.last_name,
                email: r.email,
                phone: r.phone,
                participants: r.participants,
                skill_level: r.skill_level,
                status: r.status,
                source: "reservation" as const,
              }));
            const packageParticipants: ReservationInfo[] = (s.package_bookings || [])
              .filter((b: any) => b.client_packages)
              .map((b: any) => ({
                id: `pkg-${b.id}`,
                first_name: b.client_packages.first_name,
                last_name: b.client_packages.last_name,
                email: b.client_packages.email,
                phone: b.client_packages.phone || "",
                participants: 1,
                skill_level: "-",
                status: b.status,
                source: "package" as const,
                package_code: b.client_packages.package_code,
              }));
            const all = [...reservationParticipants, ...packageParticipants];
            return {
              id: s.id,
              date: s.date,
              activity: s.activity,
              time_slot: s.time_slot,
              max_participants: s.max_participants,
              reservation_count: all.filter((r) => r.status === "confirmed" || r.status === "pending").length,
              status: s.status,
              reservations: all,
            };
          })
        );
      }
      setLoading(false);
    };
    fetchMonth();
  }, [currentMonth]);

  const refreshSessions = useCallback(() => {
    setCurrentMonth(prev => new Date(prev));
  }, []);

  const toggleSessionStatus = useCallback(async (sessionId: string, currentStatus: string) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    await supabase.from("sessions").update({ status: newStatus }).eq("id", sessionId);
    refreshSessions();
  }, [refreshSessions]);

  const confirmCancelSession = useCallback(async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const reason = cancelReason.trim();
    const { error } = await supabase
      .from("sessions")
      .update({ status: "cancelled", cancellation_reason: reason || null })
      .eq("id", cancelTarget.id);
    setCancelling(false);
    if (error) {
      toast.error("Annulation impossible", { description: error.message });
      return;
    }
    const count = cancelTarget.reservations.filter(r => r.status === "confirmed" || r.status === "pending").length;
    toast.success("Session annulée", {
      description: `${count} élève(s) recrédité(s) et notifié(s) par email.`,
    });
    setCancelTarget(null);
    setCancelReason("");
    refreshSessions();
  }, [cancelTarget, cancelReason, refreshSessions]);

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => activityFilter === "all" || s.activity === activityFilter)
      .map((s) => {
        const filtered = s.reservations.filter((r) => {
          if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
          if (statusFilter !== "all" && r.status !== statusFilter) return false;
          if (statusFilter === "all" && r.status !== "confirmed" && r.status !== "pending") return false;
          return true;
        });
        return {
          ...s,
          reservations: filtered,
          reservation_count: filtered.reduce((n, r) => n + (r.participants || 1), 0),
        };
      });
  }, [sessions, activityFilter, sourceFilter, statusFilter]);

  const exportCSV = useCallback(() => {
    const allReservations = filteredSessions.flatMap((s) =>
      s.reservations
        .filter((r) => r.status === "confirmed" || r.status === "pending")
        .map((r) => ({
          date: s.date,
          activite: ACTIVITY_LABELS[s.activity],
          creneau: SLOT_SHORT[s.time_slot] || s.time_slot,
          prenom: r.first_name,
          nom: r.last_name,
          email: r.email,
          telephone: r.phone,
          participants: r.participants,
          niveau: r.skill_level,
          statut: r.status === "confirmed" ? "Confirmé" : "En attente",
        }))
    );
    if (allReservations.length === 0) return;
    const headers = Object.keys(allReservations[0]);
    const csv = "\uFEFF" + [headers.join(";"), ...allReservations.map((r) => headers.map((h) => `"${(r as any)[h]}"`).join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscriptions-${format(currentMonth, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredSessions, currentMonth]);

  const exportParticipantsCSV = useCallback(() => {
    const rows = filteredSessions.flatMap((s) =>
      s.reservations.map((r) => ({
        activite: ACTIVITY_LABELS[s.activity],
        journee: s.date,
        nom: `${r.first_name} ${r.last_name}`,
        statut: r.status === "confirmed" ? "Confirmé" : "En attente",
        source: r.source === "package" ? "Pack KP" : "Réservation",
      }))
    );
    if (rows.length === 0) {
      toast("Aucune donnée à exporter", { icon: "ℹ️" });
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = "\uFEFF" + [headers.join(";"), ...rows.map((r) => headers.map((h) => `"${(r as any)[h]}"`).join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participants-${format(currentMonth, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredSessions, currentMonth]);

  const exportParticipantsXLSX = useCallback(() => {
    const rows = filteredSessions.flatMap((s) =>
      s.reservations.map((r) => ({
        Activité: ACTIVITY_LABELS[s.activity],
        Journée: s.date,
        Nom: `${r.first_name} ${r.last_name}`,
        Statut: r.status === "confirmed" ? "Confirmé" : "En attente",
        Source: r.source === "package" ? "Pack KP" : "Réservation",
      }))
    );
    if (rows.length === 0) {
      toast("Aucune donnée à exporter", { icon: "ℹ️" });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants");
    XLSX.writeFile(wb, `participants-${format(currentMonth, "yyyy-MM")}.xlsx`);
  }, [filteredSessions, currentMonth]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionSummary[]> = {};
    filteredSessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [filteredSessions]);

  const getFillRate = (daySessions: SessionSummary[]) => {
    const total = daySessions.reduce((a, s) => a + s.max_participants, 0);
    const filled = daySessions.reduce((a, s) => a + s.reservation_count, 0);
    if (total === 0) return 0;
    return Math.round((filled / total) * 100);
  };

  const getFillColor = (rate: number) => {
    if (rate === 0) return "text-muted-foreground";
    if (rate < 50) return "text-yellow-600";
    if (rate < 80) return "text-primary";
    return "text-green-600";
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <Card className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={exportCSV} title="Exporter les inscriptions en CSV">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Activity filter */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <button
          onClick={() => setActivityFilter("all")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors",
            activityFilter === "all"
              ? "border-primary bg-primary/10 text-primary font-semibold"
              : "border-border text-muted-foreground hover:bg-muted/50"
          )}
        >
          Toutes
        </button>
        {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
          <button
            key={a}
            onClick={() => setActivityFilter(activityFilter === a ? "all" : a)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors",
              activityFilter === a
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", ACTIVITY_DOT_COLORS[a])} />
            {ACTIVITY_LABELS[a]}
          </button>
        ))}
      </div>

      {/* Source & status filters + reset */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs items-center">
        <span className="text-muted-foreground self-center mr-1">Source :</span>
        {([
          { id: "all", label: "Toutes" },
          { id: "reservation", label: "Réservations" },
          { id: "package", label: "Pack KP" },
        ] as const).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSourceFilter(opt.id)}
            className={cn(
              "px-2.5 py-1 rounded-full border transition-colors min-h-[28px]",
              sourceFilter === opt.id
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border text-muted-foreground hover:bg-muted/50",
            )}
          >
            {opt.label}
          </button>
        ))}
        <span className="text-muted-foreground self-center ml-2 mr-1">Statut :</span>
        {([
          { id: "all", label: "Tous" },
          { id: "confirmed", label: "Confirmés" },
          { id: "pending", label: "En attente" },
        ] as const).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setStatusFilter(opt.id)}
            className={cn(
              "px-2.5 py-1 rounded-full border transition-colors min-h-[28px]",
              statusFilter === opt.id
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border text-muted-foreground hover:bg-muted/50",
            )}
          >
            {opt.label}
          </button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs min-h-[28px] px-2.5 py-1 rounded-full hover:bg-muted/50 text-muted-foreground"
          onClick={exportParticipantsCSV}
          title="Exporter les participants filtrés en CSV"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs min-h-[28px] px-2.5 py-1 rounded-full hover:bg-muted/50 text-muted-foreground"
          onClick={exportParticipantsXLSX}
          title="Exporter les participants filtrés en XLSX"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          XLSX
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs ml-auto min-h-[28px] px-2.5 py-1 rounded-full hover:bg-muted/50 text-muted-foreground"
          onClick={() => {
            setActivityFilter("all");
            setSourceFilter("all");
            setStatusFilter("all");
          }}
          title="Réinitialiser tous les filtres"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Réinitialiser
        </Button>
      </div>

      {/* Participant count */}
      <div className="mb-4 text-sm">
        {(() => {
          let confirmed = 0;
          let pending = 0;
          filteredSessions.forEach((s) => {
            s.reservations.forEach((r) => {
              if (r.status === "confirmed") confirmed += r.participants || 1;
              else if (r.status === "pending") pending += r.participants || 1;
            });
          });
          const total = confirmed + pending;
          return (
            <span className="text-muted-foreground">
              {total} participant{total !== 1 ? "s" : ""} trouvé{total !== 1 ? "s" : ""}
              {total > 0 && (
                <>
                  {" "}—{" "}
                  <span className="text-green-600 font-medium">{confirmed} confirmé{confirmed !== 1 ? "s" : ""}</span>
                  {" "}et{" "}
                  <span className="text-yellow-600 font-medium">{pending} en attente</span>
                </>
              )}
            </span>
          );
        })()}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {/* Week day headers */}
        {weekDays.map((d) => (
          <div key={d} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const daySessions = sessionsByDate[dateStr] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDay === dateStr;
          const fillRate = getFillRate(daySessions);

          return (
            <button
              key={dateStr}
              onClick={() => { setSelectedDay(isSelected ? null : dateStr); setCreatingSession(false); setAddingToSession(null); }}
              className={cn(
                "bg-card p-1.5 min-h-[70px] md:min-h-[90px] text-left transition-colors hover:bg-muted/30 relative",
                !isCurrentMonth && "bg-muted/20",
                isSelected && "ring-2 ring-primary ring-inset bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-xs font-medium leading-none",
                    isToday && "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center",
                    !isCurrentMonth && !isToday && "text-muted-foreground/60"
                  )}
                >
                  {!isCurrentMonth ? format(day, "d MMM", { locale: fr }) : format(day, "d")}
                </span>
                {daySessions.length > 0 && (
                  <span className={cn("text-[10px] font-bold", getFillColor(fillRate))}>
                    {fillRate}%
                  </span>
                )}
              </div>

              {/* Activity dots */}
              {daySessions.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {daySessions.map((s, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        ACTIVITY_DOT_COLORS[s.activity],
                        s.reservation_count > 0 && "ring-1 ring-green-400"
                      )}
                      title={`${ACTIVITY_LABELS[s.activity]} ${SLOT_SHORT[s.time_slot]} — ${s.reservation_count}/${s.max_participants}`}
                    />
                  ))}
                </div>
              )}

              {/* Fill bar */}
              {daySessions.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all",
                      fillRate < 50 ? "bg-yellow-400" : fillRate < 80 ? "bg-primary" : "bg-green-500"
                    )}
                    style={{ width: `${fillRate}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground capitalize">
              {format(new Date(selectedDay + "T12:00:00"), "EEEE d MMMM", { locale: fr })}
            </h3>
            <div className="flex items-center gap-2">
              {!creatingSession && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => setCreatingSession(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nouvelle session
                </Button>
              )}
              {onNavigateToSession && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => onNavigateToSession(new Date(selectedDay + "T12:00:00"))}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Gérer les sessions
                </Button>
              )}
            </div>
          </div>

          {/* Quick session creator */}
          {creatingSession && (
            <CalendarQuickSession
              date={selectedDay}
              onClose={() => setCreatingSession(false)}
              onCreated={refreshSessions}
            />
          )}

          {/* Existing sessions */}
          {sessionsByDate[selectedDay] && sessionsByDate[selectedDay].length > 0 ? (
            <div className="space-y-4">
              {sessionsByDate[selectedDay]
                .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
                .map((s, i) => {
                  const rate = s.max_participants > 0
                    ? Math.round((s.reservation_count / s.max_participants) * 100)
                    : 0;
                  const activeReservations = s.reservations.filter(r => r.status === 'confirmed' || r.status === 'pending');
                  return (
                    <div key={i} className={cn("rounded-lg bg-card border", s.status === "closed" && "opacity-50")}>
                      <div className="flex items-center gap-3 p-3">
                        <div className={cn("w-3 h-8 rounded-full", ACTIVITY_DOT_COLORS[s.activity])} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {ACTIVITY_LABELS[s.activity]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {SLOT_SHORT[s.time_slot]}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 w-7 p-0",
                            s.status === "open" ? "text-green-600 hover:bg-green-500/10" : "text-destructive hover:bg-destructive/10"
                          )}
                          onClick={() => toggleSessionStatus(s.id, s.status)}
                          title={s.status === "open" ? "Fermer la session" : "Ouvrir la session"}
                        >
                          {s.status === "open" ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                          onClick={() => setAddingToSession(addingToSession === s.id ? null : s.id)}
                          title="Inscrire un stagiaire"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                        {s.status !== "cancelled" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-11 w-11 p-0 shrink-0"
                            onClick={() => { setCancelReason(""); setCancelTarget(s); }}
                            title="Annuler la session"
                            aria-label="Annuler la session"
                          >
                            <XCircle className="w-5 h-5" />
                          </Button>
                        )}
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className={cn("text-sm font-semibold", getFillColor(rate))}>
                              {s.reservation_count}/{s.max_participants}
                            </span>
                          </div>
                          <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                rate < 50 ? "bg-yellow-400" : rate < 80 ? "bg-primary" : "bg-green-500"
                              )}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {addingToSession === s.id && (
                        <div className="px-3 pb-3">
                          <CalendarAddReservation
                            sessionId={s.id}
                            activityLabel={ACTIVITY_LABELS[s.activity]}
                            activity={s.activity}
                            timeSlot={s.time_slot}
                            sessionDate={selectedDay}
                            slotLabel={SLOT_SHORT[s.time_slot] || s.time_slot}
                            dateLabel={format(new Date(selectedDay + "T12:00:00"), "d MMMM", { locale: fr })}
                            onClose={() => setAddingToSession(null)}
                            onAdded={refreshSessions}
                          />
                        </div>
                      )}
                      {activeReservations.length > 0 && (
                        <div className="border-t border-border px-3 pb-3 pt-2 space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inscrits</p>
                          {activeReservations.map((r, j) => (
                            <div key={r.id || j}>
                              <div className="flex items-center justify-between text-xs bg-muted/40 rounded-md px-2.5 py-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={cn(
                                    "inline-block w-1.5 h-1.5 rounded-full",
                                    r.status === 'confirmed' ? "bg-green-500" : "bg-yellow-400"
                                  )} />
                                  <span className="font-medium text-foreground truncate">
                                    {r.first_name} {r.last_name}
                                  </span>
                                  {r.participants > 1 && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                      ×{r.participants}
                                    </Badge>
                                  )}
                                  {r.source === "package" && r.package_code && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary font-mono">
                                      {r.package_code}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground shrink-0 ml-2">
                                  <span>{r.phone}</span>
                                  <Badge variant={r.status === 'confirmed' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                    {r.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                                  </Badge>
                                  <CalendarReservationActions reservation={r} onUpdated={refreshSessions} sessionActivity={s.activity} sessionTimeSlot={s.time_slot} sessionDate={selectedDay} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : !creatingSession && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune session ce jour. Cliquez sur « Nouvelle session » pour en créer une.
            </p>
          )}
        </div>
      )}

      {loading && (
        <p className="text-center text-sm text-muted-foreground mt-4">Chargement…</p>
      )}

      <AlertDialog open={!!cancelTarget} onOpenChange={(v) => !v && !cancelling && (setCancelTarget(null), setCancelReason(""))}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette session ?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget && (
                <>
                  Les <strong className="text-destructive">
                    {cancelTarget.reservations.filter(r => r.status === "confirmed" || r.status === "pending").length} élève(s) inscrit(s)
                  </strong> seront automatiquement recrédité(s) et notifié(s) par email.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {["Vent insuffisant", "Conditions météo", "Mer agitée"].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant={cancelReason === preset ? "default" : "outline"}
                  className="h-9 text-xs"
                  onClick={() => setCancelReason(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Motif (optionnel) — visible dans l'email aux élèves"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[80px] text-sm"
              maxLength={200}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmCancelSession(); }}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? "Annulation…" : "Confirmer l'annulation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default AdminMonthlyCalendar;
