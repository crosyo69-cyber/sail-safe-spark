import { useCallback, useEffect, useState } from "react";
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
import {
  Calendar as CalendarIcon,
  Loader2,
  Ticket,
  Wind,
  Waves,
  Anchor,
  Plane,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parisStartOfToday, toParisDateOnly } from "@/lib/booking-dates";
import { WaitlistDialog } from "@/components/WaitlistDialog";

type Activity = "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte" | "stage_100_glisse";

const ACTIVITIES: { value: Activity; label: string; icon: any }[] = [
  { value: "kitesurf", label: "Kitesurf", icon: Wind },
  { value: "wingfoil", label: "Wingfoil", icon: Waves },
  { value: "pumpfoil", label: "Pumpfoil", icon: Anchor },
  { value: "foil_tracte", label: "Foil tracté", icon: Plane },
  { value: "stage_100_glisse", label: "Stage 100% Glisse (5 jours)", icon: Wind },
];

interface DayAvailability {
  date: string;
  kite: { places: number; groupes: number };
  wing: { places: number; groupes: number };
}

const ReserverPage = () => {
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity>("kitesurf");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availability, setAvailability] = useState<DayAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const loadAvailability = useCallback(async (d: Date) => {
    setLoading(true);
    const dateStr = toParisDateOnly(d);
    const { data } = await supabase.rpc("get_daily_availability", { p_date: dateStr });
    setLoading(false);
    const res = (data as any) || {};
    setAvailability({
      date: dateStr,
      kite: {
        places: res?.kitesurf?.places_restantes ?? (res?.kitesurf?.capacite_potentielle ?? 4),
        groupes: res?.kitesurf?.groupes ?? 0,
      },
      wing: {
        places: res?.wingfoil?.places_restantes ?? (res?.wingfoil?.capacite_potentielle ?? 3),
        groupes: res?.wingfoil?.groupes ?? 0,
      },
    });
  }, []);

  useEffect(() => {
    if (selectedDate) loadAvailability(selectedDate);
    else setAvailability(null);
  }, [selectedDate, loadAvailability]);

  const handleBookWithCode = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      toast.error("Saisissez votre code de pack ci-dessous, ou achetez un pack.");
      return;
    }
    if (!selectedDate) {
      toast.error("Choisissez une date.");
      return;
    }
    setBooking(true);
    const { data, error } = await supabase.rpc("book_daily_with_code", {
      p_code: clean,
      p_date: toParisDateOnly(selectedDate),
    });
    setBooking(false);
    if (error) return toast.error("Erreur : " + error.message);
    const res = data as any;
    if (!res?.ok) {
      const messages: Record<string, string> = {
        invalid_code: "Code de pack invalide",
        package_not_active: "Pack inactif",
        package_expired: "Pack expiré",
        no_credits_left: "Plus de crédits disponibles sur ce pack",
        credits_expired: "Vos séances restantes ont expiré — contactez l'école",
        date_in_past: "Date passée",
        already_booked_this_date: "Vous avez déjà réservé cette date",
      };
      return toast.error(messages[String(res?.error || "")] || "Réservation impossible");
    }
    toast.success("Journée réservée ✅ — horaire communiqué la veille selon les conditions météo.");
    navigate(`/mon-espace/${clean}`);
  };

  const activityAvail = availability
    ? activity === "wingfoil"
      ? availability.wing
      : availability.kite
    : null;
  const activityUsesGroups = activity === "kitesurf" || activity === "wingfoil";
  const isFull = !!activityAvail && activityUsesGroups && activityAvail.places <= 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Réserver une session – Kitesurf Passion Hyères</title>
        <meta
          name="description"
          content="Réservez votre session kitesurf, wingfoil, pumpfoil ou foil tracté à Hyères. Choisissez votre activité et votre date."
        />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
          Réserver une journée
        </h1>
        <p className="text-muted-foreground mb-8">
          Choisissez votre activité et votre date. L'horaire précis est communiqué la veille selon les
          conditions météo.
        </p>

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

        {activity === "stage_100_glisse" ? (
          <StageBookingPanel code={code} onBooked={(c) => navigate(`/mon-espace/${c}`)} />
        ) : (
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold mb-1">Choisissez votre date</h2>
              <p className="text-sm text-muted-foreground">
                Toutes les dates à venir sont ouvertes. Nous formons des groupes dynamiques : max 4 en
                kitesurf, max 3 en wingfoil.
              </p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 min-h-[44px] w-full sm:w-auto">
                  <CalendarIcon className="w-4 h-4" />
                  {selectedDate
                    ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
                    : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(d) => d < parisStartOfToday()}
                  locale={fr}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Chargement de la disponibilité…
              </div>
            )}

            {activityAvail && !loading && (
              <div className="rounded-md border p-4 space-y-2">
                <p className="text-sm font-medium capitalize">
                  {format(parseISO(availability!.date), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
                {activityUsesGroups ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isFull ? "destructive" : "secondary"}>
                      {isFull
                        ? "Complet"
                        : `${activityAvail.places} place${activityAvail.places > 1 ? "s" : ""} restante${activityAvail.places > 1 ? "s" : ""}`}
                    </Badge>
                    {activityAvail.groupes > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {activityAvail.groupes} groupe{activityAvail.groupes > 1 ? "s" : ""} déjà formé
                        {activityAvail.groupes > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Disponibilité confirmée directement par l'école selon les conditions.
                  </p>
                )}
              </div>
            )}

            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 flex gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                L'horaire de rendez-vous et le spot sont communiqués <strong>la veille</strong> selon les
                conditions météo (vent, mer, sécurité).
              </span>
            </div>

            <Button
              className="w-full min-h-[44px]"
              disabled={booking || !selectedDate || isFull}
              onClick={handleBookWithCode}
            >
              {booking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Réserver cette journée avec mon code"
              )}
            </Button>

            {isFull && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Cette journée est complète en {activity === "wingfoil" ? "wingfoil" : "kitesurf"}.
                  Inscrivez-vous sur la liste d'attente : vous serez prévenu par email dès qu'une place
                  se libère.
                </p>
                <Button
                  variant="outline"
                  className="w-full min-h-[44px]"
                  onClick={() => setWaitlistOpen(true)}
                >
                  Rejoindre la liste d'attente
                </Button>
              </div>
            )}
          </Card>
        )}
      </main>
      <Footer />

      <WaitlistDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        date={selectedDate ? toParisDateOnly(selectedDate) : null}
        activity={activity}
        activityLabel={ACTIVITIES.find((a) => a.value === activity)?.label || activity}
      />
    </div>
  );
};

export default ReserverPage;

// ─────────────────────────────────────────────────────────────────────────────
// Stage 100% Glisse — conserve son propre RPC historique (5 jours consécutifs).
// À migrer dans une phase ultérieure vers le modèle daily_groups.
// ─────────────────────────────────────────────────────────────────────────────
function StageBookingPanel({ code, onBooked }: { code: string; onBooked: (code: string) => void }) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<{ date: string; places: number; groupes: number }[]>([]);

  useEffect(() => {
    if (!startDate) {
      setPreview([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const days: { date: string; places: number; groupes: number }[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const ds = toParisDateOnly(d);
        const { data } = await supabase.rpc("get_daily_availability", { p_date: ds });
        const avail: any = data || {};
        // Un stage utilise l'activité stage_100_glisse ; on affiche la place disponible
        // dans le premier groupe stage ouvert, ou la capacité potentielle sinon.
        const stage = avail?.stage_100_glisse;
        const places = stage?.places_restantes ?? 4;
        const groupes = stage?.groupes ?? 0;
        days.push({ date: ds, places, groupes });
      }
      if (!cancelled) setPreview(days);
    })();
    return () => {
      cancelled = true;
    };
  }, [startDate]);

  const handleStageBook = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) return toast.error("Saisissez votre code de pack Stage 100% Glisse.");
    if (!startDate) return toast.error("Choisissez une date de début.");
    setSubmitting(true);
    const { data, error } = await supabase.rpc("book_stage_100_glisse", {
      p_code: clean,
      p_start_date: toParisDateOnly(startDate),
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

  const anyFull = preview.some((p) => p.places <= 0 && p.groupes > 0);

  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Stage 100% Glisse — 5 jours consécutifs</h2>
        <p className="text-sm text-muted-foreground">
          Choisissez la date de début. Les 5 jours seront réservés automatiquement.
          Les horaires seront communiqués la veille par téléphone en fonction des conditions météorologiques.
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
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              disabled={(d) => d < parisStartOfToday()}
              locale={fr}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {preview.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Aperçu des 5 jours :</p>
          <ul className="space-y-1 text-sm">
            {preview.map((p) => {
              const full = p.places <= 0 && p.groupes > 0;
              const remaining = Math.max(0, p.places);
              return (
                <li
                  key={p.date}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="capitalize">
                    {format(parseISO(p.date), "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                  <Badge variant={full ? "destructive" : "secondary"}>
                    {full
                      ? "Complet"
                      : p.groupes > 0
                        ? `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`
                        : "Disponible"}
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
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : anyFull ? (
          "Au moins une journée est complète"
        ) : (
          "Réserver les 5 jours avec mon code"
        )}
      </Button>
    </Card>
  );
}
