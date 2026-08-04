import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, CloudRain, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { CreditHistoryEntry } from "@/features/mon-espace/types";

export const CreditHistoryList = ({ history }: { history: CreditHistoryEntry[] }) => {
  if (history.length === 0) return null;
  return (
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
                      {h.is_weather
                        ? "Crédit météo"
                        : h.reason || (positive ? "Crédit ajouté" : "Crédit utilisé")}
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
  );
};