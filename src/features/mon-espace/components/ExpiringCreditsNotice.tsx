import { AlertTriangle } from "lucide-react";
import { bucketExpiringCredits } from "../helpers";
import type { CreditEntry } from "../types";

export const ExpiringCreditsNotice = ({ credits }: { credits: CreditEntry[] }) => {
  const { today, week, month, total, urgent } = bucketExpiringCredits(credits);
  if (total === 0) return null;

  return (
    <div
      role="status"
      className={`rounded-lg border p-4 flex gap-3 ${
        urgent ? "border-destructive/40 bg-destructive/10" : "border-primary/30 bg-primary/5"
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
};