import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2, Calendar as CalendarIcon, CheckCircle2, XCircle, Ticket,
  CloudRain, Plus, Info, Bell, BellOff, AlertTriangle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { parisStartOfTomorrow, toParisDateOnly } from "@/lib/booking-dates";

interface Booking {
  id: string;
  daily_group_id: string | null;
  session_id: string | null;
  status: string;
  date: string;
  activity: string;
  created_at: string;
}

interface PackageInfo {
  id: string;
  package_code: string;
  first_name: string;
  last_name: string;
  email: string;
  activity: string;
  package_type: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  status: string;
  expires_at: string;
  deposit_amount: number | null;
  bookings: Booking[];
}

interface CreditHistoryEntry {
  id: string;
  delta: number;
  kind: string;
  reason: string | null;
  balance_after: number;
  created_at: string;
  is_weather: boolean;
}

interface WalletEntry {
  package_code: string;
  activity: string;
  package_type: string;
  purchased: number;
  consumed: number;
  recredited: number;
  remaining: number;
  total_sessions: number;
}

const ACTIVITY_LABEL: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

const MonEspace = () => {
  const { code: codeParam } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const [codeInput, setCodeInput] = useState(codeParam || "");
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const [history, setHistory] = useState<CreditHistoryEntry[]>([]);
  const [wallet, setWallet] = useState<WalletEntry[]>([]);
  const [credits, setCredits] = useState<
    { id: string; activity: string; origin: string; status: string; expires_at: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState({ remind_30: true, remind_7: true, remind_0: true });
  const [savingReminders, setSavingReminders] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const loadPackage = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_package_by_code", { p_code: code });
    setLoading(false);
    if (error) {
      toast.error("Erreur de chargement");
      return;
    }
    if (!data) {
      toast.error("Code introuvable");
      setPkg(null);
      return;
    }
    setPkg(data as unknown as PackageInfo);
    if (codeParam !== code) navigate(`/mon-espace/${code}`, { replace: true });
    await loadHistory(code);
  };

  const loadHistory = async (code: string) => {
    const { data } = await supabase.rpc("get_package_credits_history", { p_code: code });
    setHistory((data as unknown as CreditHistoryEntry[]) || []);
    const { data: w } = await supabase.rpc("get_wallet_by_code", { p_code: code });
    setWallet(((w as any)?.wallet as WalletEntry[]) || []);
    setCredits(((w as any)?.credits as typeof credits) || []);
    const { data: r } = await supabase.rpc("get_credit_reminders", { p_code: code });
    if (r) setReminders(r as unknown as typeof reminders);
  };

  const updateReminders = async (next: typeof reminders) => {
    if (!pkg) return;
    const prev = reminders;
    setReminders(next);
    setSavingReminders(true);
    const { data, error } = await supabase.rpc("set_credit_reminders", {
      p_code: pkg.package_code,
      p_remind_30: next.remind_30,
      p_remind_7: next.remind_7,
      p_remind_0: next.remind_0,
    });
    setSavingReminders(false);
    if (error || !(data as any)?.ok) {
      setReminders(prev);
      toast.error("Impossible d'enregistrer vos préférences");
      return;
    }
    toast.success("Préférences de rappel enregistrées");
  };

  useEffect(() => {
    if (codeParam) loadPackage(codeParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  const bookedDates = useMemo(
    () => new Set(
      (pkg?.bookings || [])
        .filter((b) => b.status === "confirmed")
        .map((b) => b.date),
    ),
    [pkg],
  );

  const packageExpired = useMemo(() => {
    if (!pkg?.expires_at) return false;
    return new Date(pkg.expires_at) < new Date();
  }, [pkg]);

  const packageInactive = !!pkg && pkg.status !== "active";
  const noCredits = !!pkg && pkg.remaining_sessions <= 0;
  const canBook = !!pkg && !packageInactive && !packageExpired && !noCredits;

  const tomorrow = parisStartOfTomorrow();

  const handleBook = async () => {
    if (!pkg || !selectedDate) return;
    const dateStr = toParisDateOnly(selectedDate);
    if (bookedDates.has(dateStr)) {
      toast.error("Vous avez déjà réservé cette date");
      return;
    }
    setBusyAction(true);
    const { data, error } = await supabase.rpc("book_daily_with_code", {
      p_code: pkg.package_code,
      p_date: dateStr,
    });
    setBusyAction(false);
    if (error) return toast.error("Erreur : " + error.message);
    const res = data as any;
    if (!res?.ok) {
      const messages: Record<string, string> = {
        invalid_code: "Code invalide",
        package_not_active: "Pack inactif",
        package_expired: "Pack expiré",
        no_credits_left: "Plus de crédits disponibles",
        credits_expired: "Vos séances restantes ont expiré — contactez l'école",
        date_in_past: "Date passée",
        already_booked_this_date: "Vous avez déjà réservé cette date",
      };
      return toast.error(messages[res?.error] || "Réservation impossible");
    }
    toast.success("Journée réservée ✅ — horaire communiqué la veille");
    setSelectedDate(undefined);
    await loadPackage(pkg.package_code);
  };

  const handleCancel = async (bookingId: string) => {
    if (!pkg) return;
    setBusyAction(true);
    const { data, error } = await supabase.rpc("cancel_booking_with_code", {
      p_code: pkg.package_code,
      p_booking_id: bookingId,
    });
    setBusyAction(false);
    if (error) return toast.error("Erreur : " + error.message);
    const res = data as any;
    if (!res?.ok) {
      const m: Record<string, string> = {
        too_late_to_cancel: "Annulation possible jusqu'à 2 jours avant la journée",
      };
      return toast.error(m[res?.error] || "Annulation impossible");
    }
    toast.success("Journée annulée");
    await loadPackage(pkg.package_code);
  };

  const activityLabel = pkg?.activity === "wingfoil" ? "Wingfoil" : "Kitesurf";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mon espace réservation – Kitesurf Passion Hyères</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content="Espace de gestion de vos réservations Kitesurf Passion à Hyères. Réservez vos journées de cours selon les conditions météo." />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
          Mon espace réservation
        </h1>
        <p className="text-muted-foreground mb-8">
          Saisissez votre code de réservation pour gérer vos journées.
        </p>

        {!pkg && (
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" /> Votre code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => { e.preventDefault(); loadPackage(codeInput); }}
                className="flex gap-2"
              >
                <Input
                  placeholder="KP-2026-XXXX"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  className="font-mono uppercase tracking-widest"
                  maxLength={20}
                />
                <Button type="submit" disabled={loading || !codeInput.trim()} className="min-h-[44px]">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accéder"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-3">
                Vous avez reçu ce code par email après le paiement de votre acompte.
              </p>
            </CardContent>
          </Card>
        )}

        {pkg && (
          <div className="space-y-8">
            {/* Notification in-app d'expiration */}
            {(() => {
              const avail = credits.filter((c) => c.status === "available");
              const days = (c: { expires_at: string }) =>
                Math.floor((parseISO(c.expires_at).getTime() - Date.now()) / 86400000);
              const today = avail.filter((c) => days(c) <= 0);
              const week = avail.filter((c) => days(c) > 0 && days(c) <= 7);
              const month = avail.filter((c) => days(c) > 7 && days(c) <= 30);
              if (today.length + week.length + month.length === 0) return null;
              const urgent = today.length + week.length > 0;
              return (
                <div
                  role="status"
                  className={`rounded-lg border p-4 flex gap-3 ${
                    urgent
                      ? "border-destructive/40 bg-destructive/10"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${urgent ? "text-destructive" : "text-primary"}`}
                  />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold">
                      {urgent ? "Séances bientôt perdues" : "Séances à utiliser prochainement"}
                    </p>
                    <ul className="text-muted-foreground space-y-0.5">
                      {today.length > 0 && (
                        <li>• {today.length} séance{today.length > 1 ? "s" : ""} expire{today.length > 1 ? "nt" : ""} aujourd'hui</li>
                      )}
                      {week.length > 0 && (
                        <li>• {week.length} séance{week.length > 1 ? "s" : ""} dans les 7 prochains jours</li>
                      )}
                      {month.length > 0 && (
                        <li>• {month.length} séance{month.length > 1 ? "s" : ""} dans les 30 prochains jours</li>
                      )}
                    </ul>
                    <a href="#rappels" className="text-xs underline text-muted-foreground">
                      Gérer mes rappels par email
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* Summary */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-80">Pack {activityLabel}</p>
                    <h2 className="text-2xl font-bold mt-1">
                      {pkg.first_name} {pkg.last_name}
                    </h2>
                    <p className="text-sm opacity-90">{pkg.package_type}</p>
                    <p className="font-mono mt-2 text-sm bg-background/20 inline-block px-3 py-1 rounded">
                      {pkg.package_code}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold leading-none">
                      {pkg.remaining_sessions}
                      <span className="text-xl opacity-80"> / {pkg.total_sessions}</span>
                    </div>
                    <p className="text-xs uppercase tracking-widest opacity-80 mt-1">
                      journées restantes
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="pt-4 text-sm text-muted-foreground">
                Pack valable jusqu'au{" "}
                <strong className="text-foreground">
                  {format(parseISO(pkg.expires_at), "d MMMM yyyy", { locale: fr })}
                </strong>
                . Annulation possible jusqu'à 2 jours avant la journée.
              </CardContent>
            </Card>

            {/* Info bandeau */}
            {wallet.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" /> Mes crédits disponibles
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {wallet.map((w) => (
                    <Card key={`${w.package_code}-${w.activity}`}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold">
                              {ACTIVITY_LABEL[w.activity] || w.activity}
                            </div>
                            <p className="text-xs text-muted-foreground">{w.package_type}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-primary leading-none">
                              {w.remaining}
                            </div>
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              séance{w.remaining > 1 ? "s" : ""} restante{w.remaining > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                          <div className="rounded-md bg-muted/50 py-2">
                            <div className="font-bold text-sm">{w.purchased}</div>achetées
                          </div>
                          <div className="rounded-md bg-muted/50 py-2">
                            <div className="font-bold text-sm">{w.consumed}</div>consommées
                          </div>
                          <div className="rounded-md bg-primary/10 py-2">
                            <div className="font-bold text-sm">{w.recredited}</div>recréditées
                          </div>
                        </div>
                        {(() => {
                          const avail = credits
                            .filter((c) => c.status === "available" && c.activity === w.activity)
                            .sort((a, b) => a.expires_at.localeCompare(b.expires_at));
                          if (avail.length === 0) return null;
                          const soon = avail.filter(
                            (c) =>
                              (parseISO(c.expires_at).getTime() - Date.now()) / 86400000 < 30,
                          );
                          return (
                            <div className="mt-3 border-t pt-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Validité de vos séances
                              </p>
                              <ul className="space-y-0.5">
                                {avail.map((c) => (
                                  <li key={c.id} className="text-xs text-muted-foreground">
                                    • expire le{" "}
                                    <span className="text-foreground">
                                      {format(parseISO(c.expires_at), "d MMMM yyyy", { locale: fr })}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              {soon.length > 0 && (
                                <p className="mt-2 text-xs rounded-md bg-destructive/10 text-destructive px-2 py-1.5">
                                  ⚠️ {soon.length} séance{soon.length > 1 ? "s" : ""} expire
                                  {soon.length > 1 ? "nt" : ""} dans moins de 30 jours — pensez à
                                  réserver une date.
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-semibold mb-1">Comment ça marche ?</p>
                <p className="text-muted-foreground">
                  Choisissez simplement une date. <strong>L'horaire est déterminé la veille</strong> selon
                  les conditions météo (vent, mer, sécurité). Vous serez contacté(e) par KiteSurf Passion
                  pour connaître votre heure de rendez-vous.
                </p>
              </div>
            </div>

            {/* Already booked */}
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Mes journées réservées
              </h3>
              {pkg.bookings.filter((b) => b.status === "confirmed").length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune journée réservée pour le moment.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {pkg.bookings
                    .filter((b) => b.status === "confirmed")
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((b) => (
                      <Card key={b.id}>
                        <CardContent className="flex items-center justify-between gap-3 py-4">
                          <div>
                            <div className="font-semibold">
                              {format(parseISO(b.date), "EEEE d MMMM yyyy", { locale: fr })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Horaire communiqué la veille
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(b.id)}
                            disabled={busyAction}
                            className="min-h-[44px] text-destructive hover:text-destructive"
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Annuler
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </section>

            {/* Réservation */}
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-accent" /> Réserver une nouvelle journée
              </h3>

              {packageInactive && (
                <p className="text-sm text-destructive mb-3">
                  Votre pack est inactif. Contactez-nous au{" "}
                  <a href="tel:0672716905" className="underline">06 72 71 69 05</a>.
                </p>
              )}
              {packageExpired && (
                <p className="text-sm text-destructive mb-3">
                  Votre pack a expiré.{" "}
                  <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="underline text-primary">
                    Renouveler
                  </Link>
                </p>
              )}
              {noCredits && (
                <p className="text-sm text-muted-foreground mb-3">
                  Vous avez utilisé toutes vos journées.{" "}
                  <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="underline text-primary">
                    Acheter un nouveau pack
                  </Link>
                </p>
              )}

              {canBook && (
                <Card>
                  <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Choisissez une date disponible
                        </p>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(d) =>
                            d < tomorrow || bookedDates.has(toParisDateOnly(d))
                          }
                          modifiers={{
                            booked: (d) => bookedDates.has(toParisDateOnly(d)),
                          }}
                          modifiersClassNames={{
                            booked: "bg-primary/20 text-primary font-bold",
                          }}
                          locale={fr}
                          className="rounded-md border pointer-events-auto"
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                            Activité
                          </p>
                          <Badge variant="secondary" className="text-base py-1 px-3">
                            {activityLabel}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-2">
                            Capacité par groupe : {pkg.activity === "wingfoil" ? "3" : "4"} personnes
                          </p>
                        </div>
                        {selectedDate && (
                          <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                              Date sélectionnée
                            </p>
                            <p className="font-semibold">
                              {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        )}
                        <Button
                          size="lg"
                          onClick={handleBook}
                          disabled={!selectedDate || busyAction}
                          className="w-full md:w-auto min-h-[44px]"
                        >
                          {busyAction ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Réservation…</>
                          ) : (
                            "Réserver cette journée"
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Utilise 1 journée sur votre pack. Vous serez contacté(e) la veille pour
                          l'horaire de rendez-vous.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Credit history */}
            {history.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-primary" /> Historique des crédits
                </h3>
                <div className="grid gap-2">
                  {history.map((h) => {
                    const positive = h.delta > 0;
                    return (
                      <Card key={h.id} className={h.is_weather ? "border-primary/40 bg-primary/5" : ""}>
                        <CardContent className="flex items-center justify-between gap-3 py-3 text-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            {h.is_weather ? (
                              <CloudRain className="w-4 h-4 text-primary shrink-0" />
                            ) : positive ? (
                              <Plus className="w-4 h-4 text-accent shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {h.is_weather ? "Crédit météo" : h.reason || (positive ? "Crédit ajouté" : "Crédit utilisé")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(parseISO(h.created_at), "d MMM yyyy 'à' HH'h'mm", { locale: fr })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge variant={positive ? "default" : "secondary"} className="font-mono">
                              {positive ? "+" : ""}{h.delta}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              Solde : {h.balance_after}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setPkg(null);
                  setCodeInput("");
                  navigate("/mon-espace");
                }}
              >
                Quitter cet espace
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MonEspace;