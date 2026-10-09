import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreditCard, Ship, Award, Settings, Repeat, MapPin, Minus, Plus, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDepositCheckout } from "@/hooks/client/useDepositCheckout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { parisStartOfTomorrow, toParisDateOnly } from "@/lib/booking-dates";

/**
 * F-27-01 — cohérence UX avec la capacité serveur d'un daily_group
 * (public.default_max_participants). La validation d'intégrité reste
 * exclusivement serveur (`create-checkout`) : ceci n'est qu'un garde-fou UX
 * pour ne pas proposer une quantité que le paiement refusera.
 */
const MAX_PARTICIPANTS_BY_ACTIVITY: Record<string, number> = {
  "cours-particulier": 4,
  "stage-100-glisse": 4,
  "cours-carte": 4,
  "stage-wingfoil": 3,
  "location-materiel": 4,
  "foil-tracte": 4,
  "deposes-mer": 4,
};

/** Acompte Stage 100% Glisse par personne (affichage ; vérité = serveur). */
const STAGE_DEPOSIT_PER_PERSON = 250;

const maxParticipantsFor = (activityId: string) =>
  MAX_PARTICIPANTS_BY_ACTIVITY[activityId] ?? 4;

const activities = [
  {
    id: "cours-particulier",
    name: "Cours Particulier Kitesurf",
    icon: Award,
    description: "Moniteur 100% dédié à votre progression",
  },
  {
    id: "stage-100-glisse",
    name: "Stage 100% Glisse",
    icon: Ship,
    description: "5 jours consécutifs vers l'autonomie",
    defaultSessions: 5,
  },
  {
    id: "cours-carte",
    name: "Cours à la Carte",
    icon: Settings,
    description: "Flexibilité totale selon vos disponibilités",
    packOptions: [1, 3, 5, 10],
  },
  {
    id: "stage-wingfoil",
    name: "Cours Wingfoil",
    icon: Repeat,
    description: "Découvrez le vol sur l'eau en wingfoil",
    packOptions: [1, 3, 5],
  },
  {
    id: "location-materiel",
    name: "Location Matériel",
    icon: MapPin,
    description: "Kite, planche, harnais — tout l'équipement",
  },
  {
    id: "foil-tracte",
    name: "Foil Tracté",
    icon: Ship,
    description: "Initiation au foil tracté par bateau",
  },
  {
    id: "deposes-mer",
    name: "Déposes en Mer",
    icon: MapPin,
    description: "Navette bateau vers les spots de glisse",
  },
];

const DepositPaymentSection = () => {
  const { toast } = useToast();
  const { loadingId, start } = useDepositCheckout();
  const [participants, setParticipants] = useState<Record<string, number>>({});
  const [selectedDates, setSelectedDates] = useState<Record<string, Date | undefined>>({});
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [packSessions, setPackSessions] = useState<Record<string, number>>({});

  // Resume link from admin/customer email after a stuck Stripe payment:
  // /contact?activity=kitesurf&date=YYYY-MM-DD&participants=2&name=…&email=…&ref=…#reservation
  useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const activityParam = qp.get("activity");
    if (!activityParam) return;
    // Accept both the card id (new links, unambiguous) and the legacy DB enum
    // (older resume emails still in inboxes). The card-id form is preferred
    // because the DB enum is many-to-one and would otherwise land rental /
    // sea-drop customers on the Cours Particulier card.
    const VALID_IDS = new Set([
      "cours-particulier",
      "stage-100-glisse",
      "cours-carte",
      "stage-wingfoil",
      "location-materiel",
      "foil-tracte",
      "deposes-mer",
    ]);
    const ENUM_TO_ID: Record<string, string> = {
      kitesurf: "cours-particulier",
      wingfoil: "stage-wingfoil",
      stage_100_glisse: "stage-100-glisse",
      foil_tracte: "foil-tracte",
      pumpfoil: "foil-tracte",
    };
    const id = VALID_IDS.has(activityParam) ? activityParam : ENUM_TO_ID[activityParam];
    if (!id) return;
    const name = qp.get("name") || "";
    const dateStr = qp.get("date");
    const p = parseInt(qp.get("participants") || "", 10);
    setNames((prev) => (prev[id] ? prev : { ...prev, [id]: name }));
    if (Number.isFinite(p) && p >= 1) {
      setParticipants((prev) => ({ ...prev, [id]: Math.min(6, Math.max(1, p)) }));
    }
    if (dateStr) {
      const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
      if (y && m && d) {
        const dt = new Date(y, m - 1, d);
        if (!isNaN(dt.getTime())) {
          setSelectedDates((prev) => ({ ...prev, [id]: dt }));
        }
      }
    }
    // Scroll to the matching activity card once mounted
    requestAnimationFrame(() => {
      const el = document.getElementById(`deposit-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const getCount = (id: string) => participants[id] || 1;

  const updateCount = (id: string, delta: number) => {
    setParticipants((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, Math.min(maxParticipantsFor(id), current + delta));
      return { ...prev, [id]: next };
    });
  };

  const handleCheckout = async (
    activityName: string,
    activityId: string,
    totalSessions?: number,
  ) => {
    const date = selectedDates[activityId];
    const phone = phones[activityId]?.trim();
    const name = names[activityId]?.trim();

    if (!date) {
      toast({ title: "Date requise", description: "Veuillez choisir une date souhaitée.", variant: "destructive" });
      return;
    }
    if (!phone) {
      toast({ title: "Téléphone requis", description: "Veuillez indiquer votre numéro de téléphone.", variant: "destructive" });
      return;
    }
    if (!name) {
      toast({ title: "Nom requis", description: "Veuillez indiquer votre nom et prénom.", variant: "destructive" });
      return;
    }

    const count = getCount(activityId);
    // RÈGLE ABSOLUE Safari/iOS : ouverture SYNCHRONE, avant tout await /
    // mutation React Query / appel réseau.
    const stripeWindow = window.open("about:blank", "_blank");
    await start(
      activityId,
      {
        activityName,
        participants: count,
        preferredDate: toParisDateOnly(date),
        phone,
        customerName: name,
        totalSessions: totalSessions ?? count,
      },
      stripeWindow,
      () =>
        toast({
          title: "Erreur",
          description: "Impossible de lancer le paiement. Veuillez réessayer ou nous appeler.",
          variant: "destructive",
        }),
    );
  };

  // "Demain" calculé en Europe/Paris (timezone serveur), normalisé à minuit
  // local pour aligner avec les dates émises par <Calendar />.
  const tomorrow = parisStartOfTomorrow();

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-4">
              <CreditCard className="w-4 h-4" />
              Paiement sécurisé
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Réservez en Ligne
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Versez un acompte de 50€ par séance réservée (250€ par personne pour le Stage 100% Glisse) pour confirmer votre réservation. Le solde sera à régler le jour de votre cours.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => {
              const count = getCount(activity.id);
              const date = selectedDates[activity.id];
              const packOptions = (activity as { packOptions?: number[] }).packOptions;
              const defaultSessions = (activity as { defaultSessions?: number }).defaultSessions;
              const selectedPack =
                packSessions[activity.id] ?? packOptions?.[0] ?? defaultSessions ?? count;
              // Acompte = 50 € × nombre de séances (packs, stages ou activités
              // par participant où sessions == participants).
              const sessionsForDeposit =
                packOptions ? selectedPack : defaultSessions ?? count;
              const total = sessionsForDeposit * 50;
              return (
                <div
                  key={activity.id}
                  id={`deposit-${activity.id}`}
                  className="bg-card border border-border rounded-2xl p-6 flex flex-col hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 mb-4 bg-gradient-to-br from-primary/20 to-turquoise/20 rounded-xl flex items-center justify-center">
                    <activity.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{activity.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4 flex-1">
                    {activity.description}
                  </p>
                  {packOptions && (
                    <div className="mb-3">
                      <Label className="text-xs text-muted-foreground">
                        Pack — nombre de sessions
                      </Label>
                      <div className="grid grid-cols-4 gap-1.5 mt-1">
                        {packOptions.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() =>
                              setPackSessions((prev) => ({ ...prev, [activity.id]: n }))
                            }
                            className={cn(
                              "h-9 rounded-lg border text-sm font-semibold transition-colors min-w-[44px]",
                              selectedPack === n
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border text-foreground hover:border-primary/50",
                            )}
                            aria-pressed={selectedPack === n}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        Réservez ensuite vos journées librement avec votre code KP, selon la météo.
                      </p>
                    </div>
                  )}

                  {/* Name field */}
                  <div className="mb-3">
                    <Label htmlFor={`deposit-name-${activity.id}`} className="text-xs text-muted-foreground">Nom et prénom *</Label>
                    <Input
                      id={`deposit-name-${activity.id}`}
                      value={names[activity.id] || ""}
                      onChange={(e) => setNames((prev) => ({ ...prev, [activity.id]: e.target.value }))}
                      placeholder="Jean Dupont"
                      className="h-8 text-sm mt-1"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="mb-3">
                    <Label htmlFor={`deposit-phone-${activity.id}`} className="text-xs text-muted-foreground">Téléphone *</Label>
                    <Input
                      id={`deposit-phone-${activity.id}`}
                      value={phones[activity.id] || ""}
                      onChange={(e) => setPhones((prev) => ({ ...prev, [activity.id]: e.target.value }))}
                      placeholder="06 12 34 56 78"
                      className="h-8 text-sm mt-1"
                    />
                  </div>

                  {/* Date picker */}
                  <div className="mb-3">
                    <Label className="text-xs text-muted-foreground">Date souhaitée *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-8 justify-start text-left font-normal text-sm mt-1",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {date ? format(date, "d MMMM yyyy", { locale: fr }) : "Choisir une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => setSelectedDates((prev) => ({ ...prev, [activity.id]: d }))}
                          disabled={(d) => d < tomorrow}
                          initialFocus
                          locale={fr}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Participant selector */}
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 mb-3">
                    <span className="text-sm text-muted-foreground">Participants</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCount(activity.id, -1)}
                        aria-label="Diminuer le nombre de participants"
                        disabled={count <= 1}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-semibold text-foreground text-sm">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCount(activity.id, 1)}
                        aria-label="Augmenter le nombre de participants"
                        disabled={count >= maxParticipantsFor(activity.id)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {activity.id === "stage-100-glisse" ? (
                    // S3-UX : affichage seulement. Le montant réel est calculé
                    // côté serveur (create-checkout) : 250 € × participants.
                    <div className="bg-muted/50 rounded-lg p-3 mb-4 text-center" aria-live="polite">
                      <p className="text-sm font-semibold text-foreground">
                        Acompte : {(count * STAGE_DEPOSIT_PER_PERSON).toLocaleString("fr-FR")}€{" "}
                        <span className="font-normal text-muted-foreground">
                          ({count} × {STAGE_DEPOSIT_PER_PERSON}€ / personne)
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        5 jours consécutifs — solde à régler sur place
                      </p>
                    </div>
                  ) : (
                  <div className="bg-muted/50 rounded-lg p-3 mb-4 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      Acompte : {total}€{" "}
                      {sessionsForDeposit > 1 && (
                        <span className="font-normal text-muted-foreground">
                          ({sessionsForDeposit} × 50€)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {packOptions
                        ? `Pack ${selectedPack} session${selectedPack > 1 ? "s" : ""} — solde à régler sur place`
                        : "(solde à régler le jour J)"}
                    </p>
                  </div>
                  )}
                  <Button
                    variant="sunset"
                    className="w-full"
                    disabled={loadingId === activity.id}
                    onClick={() =>
                      handleCheckout(
                        activity.name,
                        activity.id,
                        packOptions ? selectedPack : defaultSessions,
                      )
                    }
                  >
                    {loadingId === activity.id ? "Redirection…" : "Payer l'acompte"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DepositPaymentSection;
