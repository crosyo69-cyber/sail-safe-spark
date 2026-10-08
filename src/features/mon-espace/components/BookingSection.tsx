import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Phone } from "lucide-react";
import { parisToday, toParisDateOnly } from "@/lib/booking-dates";

interface Props {
  packageInactive: boolean;
  packageExpired: boolean;
  noCredits: boolean;
  canBook: boolean;
  selectedDate: Date | undefined;
  onSelectDate: (d: Date | undefined) => void;
  bookedDates: Set<string>;
  today: Date;
  activityLabel: string;
  capacity: string;
  busy: boolean;
  onBook: () => void;
}

export const BookingSection = (p: Props) => (
  <section>
    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
      <CalendarIcon className="w-5 h-5 text-accent" /> Réserver une nouvelle journée
    </h3>

    {p.packageInactive && (
      <p className="text-sm text-destructive mb-3">
        Votre pack est inactif. Contactez-nous au{" "}
        <a href="tel:0672716905" className="underline">06 72 71 69 05</a>.
      </p>
    )}
    {p.packageExpired && (
      <p className="text-sm text-destructive mb-3">
        Votre pack a expiré.{" "}
        <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="underline text-primary">
          Renouveler
        </Link>
      </p>
    )}
    {p.noCredits && (
      <p className="text-sm text-muted-foreground mb-3">
        Vous avez utilisé toutes vos journées.{" "}
        <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="underline text-primary">
          Acheter un nouveau pack
        </Link>
      </p>
    )}

    {p.canBook && (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Choisissez une date disponible</p>
              <Calendar
                mode="single"
                selected={p.selectedDate}
                onSelect={p.onSelectDate}
                disabled={(d) => d < p.today || p.bookedDates.has(toParisDateOnly(d))}
                modifiers={{ booked: (d) => p.bookedDates.has(toParisDateOnly(d)) }}
                modifiersClassNames={{ booked: "bg-primary/20 text-primary font-bold" }}
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
                  {p.activityLabel}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Capacité par groupe : {p.capacity} personnes
                </p>
              </div>
              {p.selectedDate && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                    Date sélectionnée
                  </p>
                  <p className="font-semibold">
                    {format(p.selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              )}
              {p.selectedDate && toParisDateOnly(p.selectedDate) === parisToday() && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 flex gap-2">
                  <Phone className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">
                    <strong>Inscription le jour même :</strong> contactez directement Yoanne au{" "}
                    <a href="tel:0672716905" className="underline font-semibold">06 72 71 69 05</a>{" "}
                    pour connaître immédiatement le spot retenu et l'horaire de départ si vous
                    n'avez pas reçu le message de la veille.
                  </p>
                </div>
              )}
              <Button
                size="lg"
                onClick={p.onBook}
                disabled={!p.selectedDate || p.busy}
                className="w-full md:w-auto min-h-[44px]"
              >
                {p.busy ? (
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
);