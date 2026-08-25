import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { parisStartOfToday } from "@/lib/booking-dates";
import { useStageBooking } from "@/hooks/client/useReserver";

/**
 * Stage 100% Glisse — conserve son propre RPC historique (5 jours consécutifs).
 * À migrer dans une phase ultérieure vers le modèle daily_groups.
 */
export function StageBookingPanel({
  code,
  onBooked,
}: {
  code: string;
  onBooked: (code: string) => void;
}) {
  const { startDate, setStartDate, preview, anyFull, submitting, hasSession, handleStageBook } =
    useStageBooking(code, onBooked);


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
        disabled={submitting || (hasSession && (!startDate || anyFull))}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : !hasSession ? (
          "Vérifier mon identité pour réserver"
        ) : anyFull ? (
          "Au moins une journée est complète"
        ) : (
          "Réserver les 5 jours"
        )}
      </Button>

    </Card>
  );
}

export default StageBookingPanel;
