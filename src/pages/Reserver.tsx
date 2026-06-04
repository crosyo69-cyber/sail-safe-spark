import { useEffect, useMemo, useState } from "react";
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
import { Calendar as CalendarIcon, Loader2, Ticket, Wind, Waves, Anchor, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

type Activity = "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte";

const ACTIVITIES: { value: Activity; label: string; icon: any }[] = [
  { value: "kitesurf", label: "Kitesurf", icon: Wind },
  { value: "wingfoil", label: "Wingfoil", icon: Waves },
  { value: "pumpfoil", label: "Pumpfoil", icon: Anchor },
  { value: "foil_tracte", label: "Foil tracté", icon: Plane },
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
}

const ReserverPage = () => {
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity>("kitesurf");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [sessions, setSessions] = useState<AvailableSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    let query = supabase
      .from("sessions")
      .select("id, date, time_slot, activity, max_participants")
      .eq("activity", activity as any)
      .eq("status", "open")
      .gte("date", date ? format(date, "yyyy-MM-dd") : today)
      .order("date", { ascending: true })
      .limit(60);
    if (date) query = query.lte("date", format(date, "yyyy-MM-dd"));
    const { data: raw } = await query;
    setLoading(false);
    if (!raw || raw.length === 0) {
      setSessions([]);
      return;
    }
    const ids = raw.map((s) => s.id);
    const [{ data: resv }, { data: pb }] = await Promise.all([
      supabase.from("reservations").select("session_id, participants, status").in("session_id", ids).neq("status", "cancelled"),
      supabase.from("package_bookings").select("session_id, status").in("session_id", ids).eq("status", "confirmed"),
    ]);
    const taken: Record<string, number> = {};
    (resv || []).forEach((r: any) => { taken[r.session_id] = (taken[r.session_id] || 0) + (r.participants || 1); });
    (pb || []).forEach((b: any) => { taken[b.session_id] = (taken[b.session_id] || 0) + 1; });
    setSessions(raw.map((s: any) => ({ ...s, taken: taken[s.id] || 0 })));
  };

  useEffect(() => { loadSessions(); /* eslint-disable-next-line */ }, [activity, date]);

  const handleBookWithCode = async (sessionId: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      toast.error("Saisissez votre code de pack ci-dessous, ou achetez un pack.");
      return;
    }
    setBooking(sessionId);
    const { data, error } = await supabase.rpc("book_session_with_code", {
      p_code: clean, p_session_id: sessionId,
    });
    setBooking(null);
    if (error) return toast.error("Erreur : " + error.message);
    const res = data as any;
    if (!res?.ok) {
      const messages: Record<string, string> = {
        invalid_code: "Code de pack invalide",
        package_not_active: "Pack inactif",
        package_expired: "Pack expiré",
        no_credits_left: "Plus de crédits disponibles sur ce pack",
        session_not_found: "Session introuvable",
        activity_mismatch: "Ce pack ne couvre pas cette activité",
        session_closed: "Session fermée",
        session_in_past: "Session passée",
        session_full: "Session complète",
      };
      return toast.error(messages[res?.error] || "Réservation impossible");
    }
    toast.success("Session réservée ! Email de confirmation envoyé.");
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
        {loading ? (
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
                            <Badge variant={full ? "destructive" : "secondary"}>
                              {s.taken}/{s.max_participants}
                            </Badge>
                          </div>
                          <Button
                            className="w-full min-h-[44px]"
                            disabled={full || booking === s.id}
                            onClick={() => handleBookWithCode(s.id)}
                          >
                            {booking === s.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : full ? "Complet" : "Réserver avec mon code"}
                          </Button>
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