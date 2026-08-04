import { Card, CardContent } from "@/components/ui/card";
import { Ticket } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ACTIVITY_LABEL,
  availableCreditsFor,
  expiringSoon,
  type CreditEntry,
  type WalletEntry,
} from "@/features/mon-espace/types";

interface Props {
  wallet: WalletEntry[];
  credits: CreditEntry[];
}

const Validity = ({ credits, activity }: { credits: CreditEntry[]; activity: string }) => {
  const avail = availableCreditsFor(credits, activity);
  if (avail.length === 0) return null;
  const soon = expiringSoon(avail);
  return (
    <div className="mt-3 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground mb-1">Validité de vos séances</p>
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
          {soon.length > 1 ? "nt" : ""} dans moins de 30 jours — pensez à réserver une date.
        </p>
      )}
    </div>
  );
};

export const WalletGrid = ({ wallet, credits }: Props) => {
  if (wallet.length === 0) return null;
  return (
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
                  <div className="font-semibold">{ACTIVITY_LABEL[w.activity] || w.activity}</div>
                  <p className="text-xs text-muted-foreground">{w.package_type}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary leading-none">{w.remaining}</div>
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
              <Validity credits={credits} activity={w.activity} />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};