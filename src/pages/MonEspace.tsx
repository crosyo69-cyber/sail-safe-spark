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
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, CheckCircle2, XCircle, Ticket, AlertCircle, Info } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CloudRain, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Booking {
  id: string;
  session_id: string;
  status: string;
  date: string;
  time_slot: string;
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

interface AvailableSession {
  id: string;
  date: string;
  time_slot: string;
  activity: string;
  max_participants: number;
  taken: number;
}

const SLOT_LABELS: Record<string, string> = {
  morning: "Matin",
  afternoon: "Après-midi",
  full_day: "Journée",
};

const MonEspace = () => {
  const { code: codeParam } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const [codeInput, setCodeInput] = useState(codeParam || "");
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const [sessions, setSessions] = useState<AvailableSession[]>([]);
  const [history, setHistory] = useState<CreditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

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
    await loadSessions(data as unknown as PackageInfo);
    await loadHistory(code);
  };

  const loadHistory = async (code: string) => {
    const { data } = await supabase.rpc("get_package_credits_history", { p_code: code });
    setHistory((data as unknown as CreditHistoryEntry[]) || []);
  };

  const loadSessions = async (p: PackageInfo) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: rawSessions } = await supabase
      .from("sessions")
      .select("id, date, time_slot, activity, max_participants")
      .eq("status", "open")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(60);
    if (!rawSessions) {
      setSessions([]);
      return;
    }
    // Compute taken seats per session
    const ids = rawSessions.map((s) => s.id);
    const [{ data: resv }, { data: pb }] = await Promise.all([
      supabase
        .from("reservations")
        .select("session_id, participants, status")
        .in("session_id", ids)
        .neq("status", "cancelled"),
      supabase
        .from("package_bookings")
        .select("session_id, status")
        .in("session_id", ids)
        .eq("status", "confirmed"),
    ]);
    const taken: Record<string, number> = {};
    (resv || []).forEach((r: any) => {
      taken[r.session_id] = (taken[r.session_id] || 0) + (r.participants || 1);
    });
    (pb || []).forEach((b: any) => {
      taken[b.session_id] = (taken[b.session_id] || 0) + 1;
    });
    setSessions(
      rawSessions.map((s: any) => ({
        ...s,
        taken: taken[s.id] || 0,
      })),
    );
  };

  useEffect(() => {
    if (codeParam) loadPackage(codeParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  const bookedSessionIds = useMemo(
    () => new Set((pkg?.bookings || []).filter((b) => b.status === "confirmed").map((b) => b.session_id)),
    [pkg],
  );

  const packageExpired = useMemo(() => {
    if (!pkg?.expires_at) return false;
    return new Date(pkg.expires_at) < new Date();
  }, [pkg]);

  const packageInactive = useMemo(() => {
    return !!pkg && pkg.status !== "active";
  }, [pkg]);

  const getUnbookableTooltip = (reason: string): React.ReactNode => {
    const phone = "06 72 71 69 05";
    const phoneLink = <a href="tel:0672716905" className="underline text-primary hover:text-primary/80">{phone}</a>;

    switch (reason) {
      case "Pack inactif":
        return (
          <>
            Contactez l'école au {phoneLink} pour réactiver votre pack.
          </>
        );
      case "Pack expiré":
        return (
          <>
            Votre pack a dépassé sa date de validité. {" "}
            <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="underline text-primary hover:text-primary/80">
              Renouveler mon pack
            </Link>{" "}
            ou appelez-nous au {phoneLink}.
          </>
        );
      case "Crédits épuisés":
        return (
          <>
            Vous avez utilisé toutes vos sessions. {" "}
            <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="underline text-primary hover:text-primary/80">
              Acheter un nouveau pack
            </Link>{" "}
            pour continuer.
          </>
        );
      case "Capacité atteinte":
        return (
          <>
            Le groupe est complet. {" "}
            <Link to="/reserver" className="underline text-primary hover:text-primary/80">
              Voir d'autres dates
            </Link>{" "}
            ou contactez-nous au {phoneLink}.
          </>
        );
      default:
        if (reason.startsWith("Activité incompatible")) {
          return (
            <>
              Ce créneau est pour une autre activité. {" "}
              <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="underline text-primary hover:text-primary/80">
                Acheter un pack pour cette activité
              </Link>{" "}
              ou choisissez une session correspondant à votre pack actuel.
            </>
          );
        }
        return "Cette session n'est pas réservable pour le moment.";
    }
  };

  const getUnbookableReason = (s: AvailableSession): string | null => {
    if (!pkg) return null;
    if (packageInactive) return "Pack inactif";
    if (packageExpired) return "Pack expiré";
    if (pkg.remaining_sessions <= 0) return "Crédits épuisés";
    if (pkg.activity !== s.activity) return `Activité incompatible (pack ${pkg.activity})`;
    if (s.taken >= s.max_participants) return "Capacité atteinte";
    return null;
  };

  const handleBook = async (sessionId: string) => {
    if (!pkg) return;
    setBusyAction(true);
    const { data, error } = await supabase.rpc("book_session_with_code", {
      p_code: pkg.package_code,
      p_session_id: sessionId,
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
        session_not_found: "Session introuvable",
        activity_mismatch: "Activité incompatible",
        session_closed: "Session fermée",
        session_in_past: "Session passée",
        session_full: "Session complète",
      };
      return toast.error(messages[res?.error] || "Réservation impossible");
    }
    toast.success("Journée réservée ✅");
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
        too_late_to_cancel: "Annulation possible jusqu'à 2 jours avant la session",
      };
      return toast.error(m[res?.error] || "Annulation impossible");
    }
    toast.success("Journée annulée");
    await loadPackage(pkg.package_code);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mon espace réservation – Kitesurf Passion Hyères</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content="Espace de gestion de vos réservations Kitesurf Passion à Hyères. Réservez vos journées de cours ou stage selon les conditions météo." />
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
                onSubmit={(e) => {
                  e.preventDefault();
                  loadPackage(codeInput);
                }}
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
            {/* Summary */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-80">Pack {pkg.activity}</p>
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
                      sessions restantes
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="pt-4 text-sm text-muted-foreground">
                Pack valable jusqu'au{" "}
                <strong className="text-foreground">
                  {format(parseISO(pkg.expires_at), "d MMMM yyyy", { locale: fr })}
                </strong>
                . Annulation possible jusqu'à 2 jours avant la session.
              </CardContent>
            </Card>

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
                    .map((b) => (
                      <Card key={b.id}>
                        <CardContent className="flex items-center justify-between gap-3 py-4">
                          <div>
                            <div className="font-semibold">
                              {format(parseISO(b.date), "EEEE d MMMM", { locale: fr })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {SLOT_LABELS[b.time_slot] || b.time_slot}
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

            {/* Available */}
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-accent" /> Journées disponibles
              </h3>
              {pkg.remaining_sessions <= 0 ? (
                <p className="text-muted-foreground text-sm">
                  Vous avez utilisé toutes vos sessions. Contactez-nous pour ajouter du crédit.
                </p>
              ) : sessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucune session ouverte pour le moment. Contactez-nous au 06 72 71 69 05 pour ouvrir une date.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sessions.map((s) => {
                    const already = bookedSessionIds.has(s.id);
                    const reason = already ? null : getUnbookableReason(s);
                    const disabled = busyAction || already || !!reason;
                    return (
                      <Card
                        key={s.id}
                        data-session-id={s.id}
                        data-testid="available-session-card"
                        className={already ? "border-primary" : ""}
                      >
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="font-semibold">
                                {format(parseISO(s.date), "EEE d MMM", { locale: fr })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {SLOT_LABELS[s.time_slot] || s.time_slot}
                              </div>
                            </div>
                            <Badge variant={s.taken >= s.max_participants ? "destructive" : "secondary"}>
                              {s.taken}/{s.max_participants}
                            </Badge>
                          </div>
                          {reason && (
                            <HoverCard openDelay={100} closeDelay={200}>
                              <HoverCardTrigger asChild>
                                <div
                                  className="flex items-start gap-1.5 text-xs text-destructive mb-2 cursor-help"
                                  role="status"
                                  aria-live="polite"
                                >
                                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                  <span>{reason}</span>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent side="top" className="max-w-[260px] text-xs">
                                {getUnbookableTooltip(reason)}
                              </HoverCardContent>
                            </HoverCard>
                          )}
                          <Button
                            size="sm"
                            className="w-full min-h-[44px]"
                            disabled={disabled}
                            onClick={() => handleBook(s.id)}
                            title={reason || undefined}
                          >
                            {already ? "Déjà réservée" : reason ? "Indisponible" : "Réserver"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
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