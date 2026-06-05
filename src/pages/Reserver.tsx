import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, Ticket, Wind, Waves, Anchor, Plane, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Activity = "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte" | "stage_100_glisse";

const ACTIVITIES: { value: Activity; label: string; icon: any }[] = [
  { value: "kitesurf", label: "Kitesurf", icon: Wind },
  { value: "wingfoil", label: "Wingfoil", icon: Waves },
  { value: "pumpfoil", label: "Pumpfoil", icon: Anchor },
  { value: "foil_tracte", label: "Foil tracté", icon: Plane },
  { value: "stage_100_glisse", label: "Stage 100% Glisse (5 jours)", icon: Wind },
];

const SLOT_LABELS: Record<string, string> = {
  morning: "Matin",
  early_afternoon: "Début d'après-midi",
  late_afternoon: "Fin d'après-midi",
};

interface AvailableSession {
  id: string;
  date: string;
  time_slot: string;
  activity: Activity;
  max_participants: number;
  taken: number;
  private_count: number;
}

const ReserverPage = () => {
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity>("kitesurf");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [sessions, setSessions] = useState<AvailableSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState<string | null>(null);

  const loadSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    // Fetch ALL open sessions in the window (any activity) so we can compute
    // shared-slot occupancy (Stage 100% Glisse + Cours à la carte + crédits météo).
    let query = supabase
      .from("sessions")
      .select("id, date, time_slot, activity, max_participants")
      .eq("status", "open")
      .gte("date", date ? format(date, "yyyy-MM-dd") : today)
      .order("date", { ascending: true })
      .limit(200);
    if (date) query = query.lte("date", format(date, "yyyy-MM-dd"));
    const { data: rawAll } = await query;
    if (!silent) setLoading(false);
    if (!rawAll || rawAll.length === 0) {
      setSessions([]);
      return;
    }
    const ids = rawAll.map((s) => s.id);
    const [{ data: resv }, { data: pb }] = await Promise.all([
      supabase.from("reservations").select("session_id, participants, status, notes").in("session_id", ids).neq("status", "cancelled"),
      supabase.from("package_bookings").select("session_id, status").in("session_id", ids).eq("status", "confirmed"),
    ]);
    // Group sessions by (date, time_slot) and compute shared occupancy
    const slotTaken: Record<string, number> = {};
    const slotCapacity: Record<string, number> = {};
    const slotPrivate: Record<string, number> = {};
    const sessionToSlot: Record<string, string> = {};
    rawAll.forEach((s: any) => {
      const key = `${s.date}|${s.time_slot}`;
      sessionToSlot[s.id] = key;
      slotCapacity[key] = Math.min(slotCapacity[key] ?? Infinity, s.max_participants);
    });
    (resv || []).forEach((r: any) => {
      const k = sessionToSlot[r.session_id];
      if (!k) return;
      const seats = r.participants || 1;
      slotTaken[k] = (slotTaken[k] || 0) + seats;
      if (r.status === "confirmed" && typeof r.notes === "string" && /cours\s+particulier/i.test(r.notes)) {
        slotPrivate[k] = (slotPrivate[k] || 0) + seats;
      }
    });
    (pb || []).forEach((b: any) => {
      const k = sessionToSlot[b.session_id];
      if (k) slotTaken[k] = (slotTaken[k] || 0) + 1;
    });
    const visible = rawAll
      .filter((s: any) => s.activity === activity)
      .map((s: any) => {
        const key = `${s.date}|${s.time_slot}`;
        return {
          ...s,
          max_participants: slotCapacity[key] ?? s.max_participants,
          taken: slotTaken[key] || 0,
          private_count: slotPrivate[key] || 0,
        };
      });
    setSessions(visible as AvailableSession[]);
  }, [activity, date]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden || booking) return;
      loadSessions(true);
    }, 30000);
    return () => clearInterval(id);
  }, [loadSessions, booking]);

  const handleBookWithCode = async (sessionId: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      toast.error("Saisissez votre code de pack ci-dessous, ou achetez un pack.");
      return;
    }
    setBooking(sessionId);
    // For Stage 100% Glisse, find the session row to get the start date and book 5 consecutive days
    let data: any, error: any;
    if (activity === "stage_100_glisse") {
      const s = sessions.find(x => x.id === sessionId);
      if (!s) { setBooking(null); return toast.error("Session introuvable"); }
      ({ data, error } = await supabase.rpc("book_stage_100_glisse", {
        p_code: clean, p_start_date: s.date, p_time_slot: s.time_slot as any,
      }));
    } else {
      ({ data, error } = await supabase.rpc("book_session_with_code", {
        p_code: clean, p_session_id: sessionId,
      }));
    }
    setBooking(null);
    if (error) return toast.error("Erreur : " + error.message);
    const res = data as any;
    if (!res?.ok) {
      const messages: Record<string, string> = {
        invalid_code: "Code de pack invalide",
        package_not_active: "Pack inactif",
        package_expired: "Pack expiré",
        no_credits_left: "Plus de crédits disponibles sur ce pack",
        not_enough_credits: "Pas assez de crédits pour réserver les 5 jours du stage",
        not_a_stage_package: "Ce code ne correspond pas à un Stage 100% Glisse",
        start_in_past: "Date de début passée",
        session_not_found: "Session introuvable",
        activity_mismatch: "Ce pack ne couvre pas cette activité",
        session_closed: "Session fermée",
        session_in_past: "Session passée",
        session_full: "Session complète",
      };
      const errKey = String(res?.error || "");
      if (errKey.startsWith("day_full:")) {
        return toast.error(`Journée complète : ${errKey.replace("day_full:", "")}`);
      }
      return toast.error(messages[errKey] || "Réservation impossible");
    }
    toast.success(activity === "stage_100_glisse"
      ? "Stage 100% Glisse réservé sur 5 jours consécutifs !"
      : "Session réservée ! Email de confirmation envoyé.");
    navigate(`/mon-espace/${clean}`);
  };

  const grouped = useMemo(() => {
    const map: Record<string, AvailableSession[]> = {};
    sessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [sessions]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Réserver une session – Kitesurf Passion Hyères</title>
        <meta name="description" content="Réservez votre session kitesurf, wingfoil, pumpfoil ou foil tracté à Hyères. Choisissez votre activité et votre date." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
          Réserver une session
        </h1>
        <p className="text-muted-foreground mb-8">
          Choisissez votre activité et votre date. La décision d'ouverture selon le vent reste à la discrétion de l'école.
        </p>

        {/* Activity filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ACTIVITIES.map((a) => (
            <Button
              key={a.value}
              variant={activity === a.value ? "default" : "outline"}
              onClick={() => setActivity(a.value)}
              className="gap-2 min-h-[44px]"
            >
              <a.icon className="w-4 h-4" /> {a.label}
            </Button>
          ))}
        </div>

        {/* Date filter */}
        <div className="flex flex-wrap gap-2 mb-8 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 min-h-[44px]">
                <CalendarIcon className="w-4 h-4" />
                {date ? format(date, "EEEE d MMMM yyyy", { locale: fr }) : "Toutes les dates à venir"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single" selected={date} onSelect={setDate}
                disabled={(d) => d < new Date(new Date().toDateString())}
                locale={fr} className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {date && (
            <Button variant="ghost" size="sm" onClick={() => setDate(undefined)}>
              Effacer
            </Button>
          )}
        </div>

        {/* Code input (sticky-ish) */}
        <Card className="mb-8 border-primary/30">
          <CardContent className="py-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Ticket className="w-4 h-4 text-primary" /> Votre code pack
            </div>
            <Input
              placeholder="KP-2026-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono uppercase tracking-widest max-w-xs"
              maxLength={20}
            />
            <span className="text-xs text-muted-foreground sm:ml-auto">
              Pas de pack ?{" "}
              <a href="/tarifs-cours-kitesurf-wingfoil-hyeres" className="text-primary underline">
                Acheter un pack
              </a>
            </span>
          </CardContent>
        </Card>

        {/* Sessions */}
        {activity === "stage_100_glisse" ? (
          <StageBookingPanel
            code={code}
            onBooked={(c) => navigate(`/mon-espace/${c}`)}
          />
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : grouped.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Aucune session disponible pour ce choix. Essayez une autre date ou contactez-nous au 06 72 71 69 05.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(([d, list]) => (
              <section key={d}>
                <h2 className="text-lg font-semibold mb-3 capitalize">
                  {format(parseISO(d), "EEEE d MMMM yyyy", { locale: fr })}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => {
                    const full = s.taken >= s.max_participants;
                    const remaining = s.max_participants - s.taken;
                    return (
                      <Card key={s.id}>
                        <CardContent className="py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{SLOT_LABELS[s.time_slot] || s.time_slot}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {ACTIVITIES.find(a => a.value === s.activity)?.label}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={full ? "destructive" : "secondary"}>
                                {full ? "Complet" : "Ouverte"}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {full
                                  ? "0 place disponible"
                                  : `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
                              </p>
                            </div>
                          </div>
                          {s.private_count > 0 && (
                            <div className="flex items-center gap-2 rounded-md bg-accent/10 border border-accent/30 px-3 py-2 text-xs text-accent-foreground">
                              <UserCheck className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                              <span>
                                {s.private_count === 1
                                  ? "1 cours particulier confirmé"
                                  : `${s.private_count} cours particuliers confirmés`}
                              </span>
                            </div>
                          )}
                          {full ? (
                            <div className="w-full min-h-[44px] flex items-center justify-center rounded-md bg-muted text-muted-foreground text-sm font-medium">
                              Session complète — aucune place disponible
                            </div>
                          ) : (
                            <Button
                              className="w-full min-h-[44px]"
                              disabled={booking === s.id}
                              onClick={() => handleBookWithCode(s.id)}
                            >
                              {booking === s.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : "Réserver avec mon code"}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ReserverPage;

// ─────────────────────────────────────────────────────────────────────────────
// Stage 100% Glisse — sélection de date de début + créneau, réservation 5 jours
// ─────────────────────────────────────────────────────────────────────────────
function StageBookingPanel({ code, onBooked }: { code: string; onBooked: (code: string) => void }) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [slot, setSlot] = useState<"morning" | "early_afternoon" | "late_afternoon">("morning");
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<{ date: string; taken: number; capacity: number }[]>([]);

  useEffect(() => {
    if (!startDate) { setPreview([]); return; }
    let cancelled = false;
    (async () => {
      const days: { date: string; taken: number; capacity: number }[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const ds = format(d, "yyyy-MM-dd");
        const { data } = await supabase.rpc("get_slot_occupancy", { p_date: ds, p_slot: slot as any });
        const occ = (data as any) || { taken: 0, capacity: 4 };
        days.push({ date: ds, taken: occ.taken, capacity: occ.capacity });
      }
      if (!cancelled) setPreview(days);
    })();
    return () => { cancelled = true; };
  }, [startDate, slot]);

  const handleStageBook = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) return toast.error("Saisissez votre code de pack Stage 100% Glisse.");
    if (!startDate) return toast.error("Choisissez une date de début.");
    setSubmitting(true);
    const { data, error } = await supabase.rpc("book_stage_100_glisse", {
      p_code: clean,
      p_start_date: format(startDate, "yyyy-MM-dd"),
      p_time_slot: slot as any,
    });
    setSubmitting(false);
    if (error) return toast.error("Erreur : " + error.message);
    const res = data as any;
    if (!res?.ok) {
      const errKey = String(res?.error || "");
      if (errKey.startsWith("day_full:")) {
        return toast.error(`Journée complète : ${errKey.replace("day_full:", "")}`);
      }
      const messages: Record<string, string> = {
        invalid_code: "Code de pack invalide",
        package_not_active: "Pack inactif",
        package_expired: "Pack expiré",
        not_enough_credits: "Pas assez de crédits pour réserver les 5 jours",
        not_a_stage_package: "Ce code ne correspond pas à un Stage 100% Glisse",
        start_in_past: "Date de début passée",
      };
      return toast.error(messages[errKey] || "Réservation impossible");
    }
    toast.success("Stage 100% Glisse réservé sur 5 jours consécutifs !");
    onBooked(clean);
  };

  const anyFull = preview.some((p) => p.taken >= p.capacity);

  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Stage 100% Glisse — 5 jours consécutifs</h2>
        <p className="text-sm text-muted-foreground">
          Choisissez la date de début du stage et le créneau. Les 5 jours seront réservés automatiquement.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 min-h-[44px]">
              <CalendarIcon className="w-4 h-4" />
              {startDate ? format(startDate, "EEEE d MMMM yyyy", { locale: fr }) : "Date de début"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single" selected={startDate} onSelect={setStartDate}
              disabled={(d) => d < new Date(new Date().toDateString())}
              locale={fr} className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap gap-2">
          {(["morning","early_afternoon","late_afternoon"] as const).map((s) => (
            <Button key={s} size="sm" variant={slot === s ? "default" : "outline"} onClick={() => setSlot(s)}>
              {SLOT_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {preview.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Aperçu des 5 jours :</p>
          <ul className="space-y-1 text-sm">
            {preview.map((p) => {
              const remaining = Math.max(0, p.capacity - p.taken);
              const full = remaining === 0;
              return (
                <li key={p.date} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="capitalize">{format(parseISO(p.date), "EEEE d MMMM yyyy", { locale: fr })}</span>
                  <Badge variant={full ? "destructive" : "secondary"}>
                    {full ? "Complet" : `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Button
        className="w-full min-h-[44px]"
        onClick={handleStageBook}
        disabled={submitting || !startDate || anyFull}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> :
          anyFull ? "Au moins une journée est complète" : "Réserver les 5 jours avec mon code"}
      </Button>
    </Card>
  );
}