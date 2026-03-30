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
import { ChevronLeft, ChevronRight, Users, CalendarDays, UserPlus } from "lucide-react";
import CalendarAddReservation from "./CalendarAddReservation";
import CalendarReservationActions from "./CalendarReservationActions";

type Activity = "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte";

interface ReservationInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  participants: number;
  skill_level: string;
  status: string;
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
};

const ACTIVITY_LABELS: Record<Activity, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
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
  const [addingToSession, setAddingToSession] = useState<string | null>(null);

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
        .select("id, date, activity, time_slot, max_participants, status, reservations(id, first_name, last_name, email, phone, participants, skill_level, status)")
        .gte("date", from)
        .lte("date", to);

      if (!error && data) {
        setSessions(
          data.map((s: any) => ({
            id: s.id,
            date: s.date,
            activity: s.activity,
            time_slot: s.time_slot,
            max_participants: s.max_participants,
            reservation_count: s.reservations?.filter((r: any) => r.status === 'confirmed' || r.status === 'pending').length || 0,
            status: s.status,
            reservations: (s.reservations || []).map((r: any) => ({
              id: r.id,
              first_name: r.first_name,
              last_name: r.last_name,
              email: r.email,
              phone: r.phone,
              participants: r.participants,
              skill_level: r.skill_level,
              status: r.status,
            })),
          }))
        );
      }
      setLoading(false);
    };
    fetchMonth();
  }, [currentMonth]);

  const refreshSessions = useCallback(() => {
    setCurrentMonth(prev => new Date(prev));
  }, []);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionSummary[]> = {};
    sessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [sessions]);

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
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
          <div key={a} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-full", ACTIVITY_DOT_COLORS[a])} />
            <span className="text-muted-foreground">{ACTIVITY_LABELS[a]}</span>
          </div>
        ))}
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
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={cn(
                "bg-card p-1.5 min-h-[70px] md:min-h-[90px] text-left transition-colors hover:bg-muted/30 relative",
                !isCurrentMonth && "opacity-40",
                isSelected && "ring-2 ring-primary ring-inset bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-xs font-medium leading-none",
                    isToday && "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center"
                  )}
                >
                  {format(day, "d")}
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
      {selectedDay && sessionsByDate[selectedDay] && (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground capitalize">
              {format(new Date(selectedDay + "T12:00:00"), "EEEE d MMMM", { locale: fr })}
            </h3>
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
                        className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                        onClick={() => setAddingToSession(addingToSession === s.id ? null : s.id)}
                        title="Inscrire un stagiaire"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
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
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground shrink-0 ml-2">
                                <span>{r.phone}</span>
                                <Badge variant={r.status === 'confirmed' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                  {r.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                                </Badge>
                                <CalendarReservationActions reservation={r} onUpdated={refreshSessions} />
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
        </div>
      )}

      {loading && (
        <p className="text-center text-sm text-muted-foreground mt-4">Chargement…</p>
      )}
    </Card>
  );
};

export default AdminMonthlyCalendar;
