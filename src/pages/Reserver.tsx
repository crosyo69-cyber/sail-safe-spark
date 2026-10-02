import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, Ticket, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { parisStartOfToday, toParisDateOnly } from "@/lib/booking-dates";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { StageBookingPanel } from "@/features/reservation/components/StageBookingPanel";
import { useReserver } from "@/hooks/client/useReserver";

const ReserverPage = () => {
  const {
    activities,
    activity,
    setActivity,
    selectedDate,
    setSelectedDate,
    code,
    setCode,
    waitlistOpen,
    setWaitlistOpen,
    availability,
    activityAvail,
    activityUsesGroups,
    isFull,
    loading,
    booking,
    handleBookWithCode,
    goToSpace,
  } = useReserver();

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
          {activities.map((a) => (
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
          <StageBookingPanel code={code} onBooked={goToSpace} />
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
        activityLabel={activities.find((a) => a.value === activity)?.label || activity}
      />
    </div>
  );
};

export default ReserverPage;
