import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { Booking } from "../types";

interface Props {
  bookings: Booking[];
  busy: boolean;
  onCancel: (id: string) => void;
}

export const BookedDays = ({ bookings, busy, onCancel }: Props) => (
  <section>
    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
      <CheckCircle2 className="w-5 h-5 text-primary" /> Mes journées réservées
    </h3>
    {bookings.length === 0 ? (
      <p className="text-muted-foreground text-sm">Aucune journée réservée pour le moment.</p>
    ) : (
      <div className="grid gap-3 sm:grid-cols-2">
        {bookings.map((b) => (
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
                onClick={() => onCancel(b.id)}
                disabled={busy}
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
);