import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon, Plus, Trash2, Wind, CloudRain, Sun, Edit2, Users, X, Mail, Phone, Sparkles, Eye,
} from "lucide-react";
import SessionDetailPanel, { type SessionDetail } from "./SessionDetailPanel";
import BulkSessionGenerator from "./BulkSessionGenerator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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

interface Session {
  id: string;
  date: string;
  time_slot: TimeSlot;
  activity: Activity;
  max_participants: number;
  status: string;
  notes: string | null;
  weather_condition: string | null;
  reservation_count?: number;
  reservations?: Reservation[];
  package_bookings?: PackageBooking[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
};

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

const ACTIVITY_LABELS: Record<Activity, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

const ACTIVITY_COLORS: Record<Activity, string> = {
  kitesurf: "bg-primary/10 text-primary border-primary/30",
  wingfoil: "bg-accent/10 text-accent border-accent/30",
  pumpfoil: "bg-turquoise/10 text-turquoise border-turquoise/30",
  foil_tracte: "bg-ocean-dark/10 text-ocean-dark border-ocean-dark/30",
  stage_100_glisse: "bg-sunset/10 text-sunset border-sunset/30",
};

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: "Matin",
  early_afternoon: "Début d'après-midi",
  late_afternoon: "Fin d'après-midi",
};

const WEATHER_OPTIONS = [
  { value: "strong_wind", label: "Vent fort", icon: Wind },
  { value: "moderate_wind", label: "Vent modéré", icon: Wind },
  { value: "no_wind", label: "Pas de vent", icon: Sun },
  { value: "rain", label: "Pluie", icon: CloudRain },
];

const MAX_PARTICIPANTS: Record<Activity, number> = {
  kitesurf: 4,
  wingfoil: 3,
  pumpfoil: 6,
  foil_tracte: 6,
  stage_100_glisse: 4,
};

interface AdminSessionManagerProps {
  initialDate?: Date;
}

const AdminSessionManager = ({ initialDate }: AdminSessionManagerProps = {}) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  // New session form
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [deleteFrom, setDeleteFrom] = useState<Date | undefined>();
  const [deleteTo, setDeleteTo] = useState<Date | undefined>();
  const [deleting, setDeleting] = useState(false);
  const [newActivity, setNewActivity] = useState<Activity>("kitesurf");
  const [newSlot, setNewSlot] = useState<TimeSlot>("morning");
  const [newWeather, setNewWeather] = useState<string>("");
  const [newNotes, setNewNotes] = useState("");

  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [cancelSession, setCancelSession] = useState<Session | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchSessions = async () => {
    if (!selectedDate) return;
    setLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("sessions")
      .select(
        "*, reservations(id, first_name, last_name, email, phone, skill_level, participants, status), package_bookings(id, status, client_packages(id, first_name, last_name, email, package_code, package_type, total_sessions, used_sessions))"
      )
      .eq("date", dateStr)
      .order("time_slot");

    if (error) {
      console.error("Error fetching sessions:", error);
    } else {
      setSessions(
        (data || []).map((s: any) => ({
          ...s,
          reservation_count:
            (s.reservations?.filter((r: any) => r.status !== "cancelled").reduce((sum: number, r: any) => sum + (r.participants || 1), 0) || 0) +
            (s.package_bookings?.filter((b: any) => b.status === "confirmed").length || 0),
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (initialDate) setSelectedDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    fetchSessions();
  }, [selectedDate]);

  const handleAddSession = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { error } = await supabase.from("sessions").insert({
      date: dateStr,
      time_slot: newSlot,
      activity: newActivity,
      max_participants: MAX_PARTICIPANTS[newActivity],
      weather_condition: newWeather || null,
      notes: newNotes || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Session existante",
          description: "Une session avec cette activité et ce créneau existe déjà.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
      return;
    }

    toast({ title: "Session ajoutée ✓" });
    setShowForm(false);
    setNewNotes("");
    fetchSessions();
  };

  const handleDeleteSession = async (id: string) => {
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Session supprimée ✓" });
      fetchSessions();
    }
  };

  const handleToggleStatus = async (session: Session) => {
    const newStatus = session.status === "open" ? "closed" : "open";
    const { error } = await supabase
      .from("sessions")
      .update({ status: newStatus })
      .eq("id", session.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      fetchSessions();
    }
  };

  const handleCancelSession = async () => {
    if (!cancelSession) return;
    setCancelling(true);
    const reason = cancelReason.trim();
    const { error } = await supabase
      .from("sessions")
      .update({
        status: "cancelled",
        cancellation_reason: reason || null,
      })
      .eq("id", cancelSession.id);
    setCancelling(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Session annulée ✓",
        description: `${cancelSession.reservation_count || 0} inscrit(s) recrédité(s) et notifié(s) par email.`,
      });
      setCancelSession(null);
      setCancelReason("");
      fetchSessions();
    }
  };

  const handleChangeActivity = async (sessionId: string, activity: Activity) => {
    const { error } = await supabase
      .from("sessions")
      .update({ activity, max_participants: MAX_PARTICIPANTS[activity] })
      .eq("id", sessionId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      fetchSessions();
    }
  };

  const handleWeatherPreset = async (weatherCondition: string) => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    // Update all sessions for the day
    const { error } = await supabase
      .from("sessions")
      .update({ weather_condition: weatherCondition })
      .eq("date", dateStr);

    if (!error) {
      toast({ title: `Météo mise à jour : ${WEATHER_OPTIONS.find(w => w.value === weatherCondition)?.label}` });
      fetchSessions();
    }
  };

  const handleBulkDelete = async () => {
    if (!deleteFrom || !deleteTo) return;
    setDeleting(true);
    const fromStr = format(deleteFrom, "yyyy-MM-dd");
    const toStr = format(deleteTo, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("sessions")
      .delete()
      .gte("date", fromStr)
      .lte("date", toStr)
      .select("id");

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${data?.length || 0} session(s) supprimée(s) ✓` });
      setShowBulkDelete(false);
      setDeleteFrom(undefined);
      setDeleteTo(undefined);
      fetchSessions();
    }
    setDeleting(false);
  };

  const dateStr = selectedDate ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr }) : "";

  return (
    <div className="space-y-6">
      {/* Date picker + Weather */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <CalendarIcon className="w-4 h-4" />
              {dateStr || "Choisir une date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              disabled={() => false}
              className="pointer-events-auto"
              locale={fr}
            />
          </PopoverContent>
        </Popover>

        <div className="flex gap-2 flex-wrap">
          {WEATHER_OPTIONS.map((w) => (
            <Button
              key={w.value}
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
              onClick={() => handleWeatherPreset(w.value)}
            >
              <w.icon className="w-3 h-3" />
              {w.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Sessions list */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground text-sm">Chargement…</p>
        ) : sessions.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <p className="text-muted-foreground mb-4">Aucune session pour cette date.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Ajouter une session
              </Button>
              <Button onClick={() => setShowBulk(true)} variant="outline" className="gap-2">
                <Sparkles className="w-4 h-4" /> Générer en lot
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {(["morning", "early_afternoon", "late_afternoon"] as TimeSlot[]).map((slot) => {
              const slotSessions = sessions.filter((s) => s.time_slot === slot);
              if (slotSessions.length === 0) return null;

              return (
                <div key={slot}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {SLOT_LABELS[slot]}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {slotSessions.map((session) => (
                      <Card
                        key={session.id}
                        className={cn(
                          "p-4 border-l-4 transition-opacity",
                          session.status === "closed" && "opacity-50",
                          session.activity === "kitesurf" && "border-l-primary",
                          session.activity === "wingfoil" && "border-l-accent",
                          session.activity === "pumpfoil" && "border-l-turquoise",
                          session.activity === "foil_tracte" && "border-l-ocean-dark"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={ACTIVITY_COLORS[session.activity]}>
                            {ACTIVITY_LABELS[session.activity]}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {session.reservation_count}/{session.max_participants}
                            </span>
                          </div>
                        </div>

                        {session.weather_condition && (
                          <p className="text-xs text-muted-foreground mb-2">
                            🌤 {WEATHER_OPTIONS.find(w => w.value === session.weather_condition)?.label}
                          </p>
                        )}

                        {/* Reservations list */}
                        {session.reservations && session.reservations.length > 0 && (
                          <div className="mt-3 border-t border-border pt-2 space-y-1">
                            {session.reservations.map((r) => (
                              <Popover key={r.id}>
                                <PopoverTrigger asChild>
                                  <button className="flex items-center gap-2 text-xs w-full text-left hover:bg-muted/50 rounded px-1 py-0.5 transition-colors cursor-pointer">
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", STATUS_COLORS[r.status])}>
                                      {STATUS_LABELS[r.status] || r.status}
                                    </Badge>
                                    <span className="font-medium text-foreground">
                                      {r.first_name} {r.last_name}
                                    </span>
                                    {r.participants > 1 && (
                                      <span className="text-muted-foreground">({r.participants} pers.)</span>
                                    )}
                                    <span className="text-muted-foreground">{LEVEL_LABELS[r.skill_level] || r.skill_level}</span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-4 z-50" align="start" sideOffset={5}>
                                  <div className="space-y-3">
                                    <div>
                                      <p className="font-semibold text-foreground">{r.first_name} {r.last_name}</p>
                                      <Badge variant="outline" className={cn("text-xs mt-1", STATUS_COLORS[r.status])}>
                                        {STATUS_LABELS[r.status] || r.status}
                                      </Badge>
                                    </div>
                                    <div className="space-y-1.5 text-sm">
                                      <a href={`mailto:${r.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                        <Mail className="w-3.5 h-3.5" /> {r.email}
                                      </a>
                                      {r.phone && r.phone !== "Non renseigné" && (
                                        <a href={`tel:${r.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                          <Phone className="w-3.5 h-3.5" /> {r.phone}
                                        </a>
                                      )}
                                    </div>
                                    <div className="flex gap-3 text-xs text-muted-foreground">
                                      <span><strong>Niveau :</strong> {LEVEL_LABELS[r.skill_level] || r.skill_level}</span>
                                      <span><strong>Participants :</strong> {r.participants}</span>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-1 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1"
                            onClick={() => setDetailSession(session)}
                          >
                            <Eye className="w-3 h-3" /> Détail
                          </Button>
                          <Select
                            value={session.activity}
                            onValueChange={(v) => handleChangeActivity(session.id, v as Activity)}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
                                <SelectItem key={a} value={a}>{ACTIVITY_LABELS[a]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            size="sm"
                            variant={session.status === "open" ? "outline" : "default"}
                            className="h-8 text-xs"
                            onClick={() => handleToggleStatus(session)}
                            disabled={session.status === "cancelled"}
                          >
                            {session.status === "open" ? "Fermer" : "Ouvrir"}
                          </Button>

                          {session.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-11 sm:h-8 text-xs font-semibold flex-1 sm:flex-none"
                              onClick={() => {
                                setCancelReason("");
                                setCancelSession(session);
                              }}
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Annuler la session
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Add session button */}
      {sessions.length > 0 && !showForm && !showBulk && !showBulkDelete && (
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowForm(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Ajouter une session
          </Button>
          <Button onClick={() => setShowBulk(true)} variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" /> Générer en lot
          </Button>
          <Button onClick={() => setShowBulkDelete(true)} variant="outline" className="gap-2 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" /> Supprimer en lot
          </Button>
        </div>
      )}

      {/* Add session form */}
      {showForm && (
        <Card className="p-6 space-y-4 border-primary/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Nouvelle session</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Activité</label>
              <Select value={newActivity} onValueChange={(v) => setNewActivity(v as Activity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
                    <SelectItem key={a} value={a}>{ACTIVITY_LABELS[a]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Créneau</label>
              <Select value={newSlot} onValueChange={(v) => setNewSlot(v as TimeSlot)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SLOT_LABELS) as TimeSlot[]).map((s) => (
                    <SelectItem key={s} value={s}>{SLOT_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Météo</label>
              <Select value={newWeather} onValueChange={setNewWeather}>
                <SelectTrigger>
                  <SelectValue placeholder="Optionnel" />
                </SelectTrigger>
                <SelectContent>
                  {WEATHER_OPTIONS.map((w) => (
                    <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Notes</label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Notes internes"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleAddSession} className="gap-2">
              <Plus className="w-4 h-4" /> Ajouter
            </Button>
          </div>
        </Card>
      )}
      {showBulk && (
        <BulkSessionGenerator onComplete={() => { setShowBulk(false); fetchSessions(); }} />
      )}
      {showBulkDelete && (
        <Card className="p-6 space-y-4 border-destructive/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-destructive">Supprimer des sessions en lot</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowBulkDelete(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Sélectionnez une période pour supprimer toutes les sessions (sans réservations confirmées).
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Du</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {deleteFrom ? format(deleteFrom, "d MMM yyyy", { locale: fr }) : "Date de début"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deleteFrom}
                    onSelect={setDeleteFrom}
                    locale={fr}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Au</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {deleteTo ? format(deleteTo, "d MMM yyyy", { locale: fr }) : "Date de fin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deleteTo}
                    onSelect={setDeleteTo}
                    locale={fr}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowBulkDelete(false)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={!deleteFrom || !deleteTo || deleting}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Suppression…" : "Supprimer les sessions"}
            </Button>
          </div>
        </Card>
      )}

      <SessionDetailPanel
        session={detailSession as SessionDetail | null}
        open={!!detailSession}
        onClose={() => setDetailSession(null)}
        onRefresh={async () => {
          await fetchSessions();
          // Refresh the open panel in place so the user sees updated balances
          // and the toast confirmation, without unmounting the dialog.
          if (detailSession) {
            const { data } = await supabase
              .from("sessions")
              .select(
                "*, reservations(id, first_name, last_name, email, phone, skill_level, participants, status), package_bookings(id, status, client_packages(id, first_name, last_name, email, package_code, package_type, total_sessions, used_sessions))"
              )
              .eq("id", detailSession.id)
              .maybeSingle();
            if (data) setDetailSession(data as any);
          }
        }}
      />

      <Dialog open={!!cancelSession} onOpenChange={(v) => !v && !cancelling && setCancelSession(null)}>
        <DialogContent className="max-w-md p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg">Annuler cette session ?</DialogTitle>
            <DialogDescription className="text-sm">
              {cancelSession && (
                <>
                  <strong className="text-foreground">
                    {ACTIVITY_LABELS[cancelSession.activity]} · {SLOT_LABELS[cancelSession.time_slot]}
                  </strong>
                  <br />
                  Les <strong className="text-destructive">{cancelSession.reservation_count || 0} élève(s) inscrit(s)</strong>{" "}
                  seront recrédités et notifiés par email.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block">Motif (optionnel)</label>
            <div className="flex flex-wrap gap-2">
              {["Vent insuffisant", "Vent trop fort", "Conditions météo", "Mer agitée", "Pluie"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCancelReason(preset)}
                  className={cn(
                    "min-h-[36px] px-3 rounded-full text-xs font-medium border transition-colors",
                    cancelReason === preset
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-foreground border-border hover:bg-muted"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ou écrivez un motif personnalisé…"
              className="min-h-[72px] text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Le motif apparaîtra dans l'email envoyé aux élèves.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="h-11 sm:h-10"
              onClick={() => setCancelSession(null)}
              disabled={cancelling}
            >
              Retour
            </Button>
            <Button
              variant="destructive"
              className="h-11 sm:h-10 font-semibold"
              onClick={handleCancelSession}
              disabled={cancelling}
            >
              <X className="w-4 h-4 mr-1" />
              {cancelling ? "Annulation…" : "Confirmer l'annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSessionManager;
