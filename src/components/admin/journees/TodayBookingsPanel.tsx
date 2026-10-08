import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Zap, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ACTIVITY_LABEL, type DailyGroup } from "@/features/admin-journees/types";
import { parisToday, toParisDateOnly } from "@/lib/booking-dates";

type TodayEntry = {
  key: string;
  name: string;
  kind: "visitor" | "package";
  packageCode?: string;
  clientActivity: string;
  groupActivity: string;
  groupIndex: number;
  bookedAt: string | null;
  lastMinute: boolean;
};

/**
 * Panneau « Réservations du jour » : liste tous les stagiaires inscrits
 * aujourd'hui avec leur activité réelle (client), en mettant en avant
 * ceux qui se sont inscrits en dernière minute (réservation créée le jour même).
 */
export const TodayBookingsPanel = ({ groups }: { groups: DailyGroup[] }) => {
  const today = parisToday();

  const entries = useMemo<TodayEntry[]>(() => {
    const list: TodayEntry[] = [];
    for (const g of groups) {
      for (const m of g.members) {
        const bookedAt = m.booked_at ?? null;
        list.push({
          key: `${m.kind}-${m.id}`,
          name: m.name,
          kind: m.kind,
          packageCode: m.package_code,
          clientActivity: m.client_activity ?? g.activity,
          groupActivity: g.activity,
          groupIndex: g.group_index,
          bookedAt,
          lastMinute: bookedAt ? toParisDateOnly(new Date(bookedAt)) === today : false,
        });
      }
    }
    // Dernières inscriptions en premier
    return list.sort((a, b) => (b.bookedAt ?? "").localeCompare(a.bookedAt ?? ""));
  }, [groups, today]);

  if (entries.length === 0) return null;

  const lastMinuteCount = entries.filter((e) => e.lastMinute).length;

  return (
    <Card className="p-4 mb-6 border-primary/30 bg-primary/5">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold">Réservations du jour</h2>
        <Badge variant="secondary">{entries.length} stagiaire(s)</Badge>
        {lastMinuteCount > 0 && (
          <Badge className="bg-accent text-accent-foreground">
            {lastMinuteCount} dernière minute
          </Badge>
        )}
      </div>
      <ul className="divide-y divide-border">
        {entries.map((e) => (
          <li key={e.key} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-medium">{e.name}</span>
            <Badge variant="outline">
              {ACTIVITY_LABEL[e.clientActivity] ?? e.clientActivity}
            </Badge>
            {e.clientActivity !== e.groupActivity && (
              <span className="text-xs text-muted-foreground">
                (groupe {ACTIVITY_LABEL[e.groupActivity] ?? e.groupActivity} #{e.groupIndex})
              </span>
            )}
            {e.kind === "package" && e.packageCode && (
              <span className="text-xs font-mono text-muted-foreground">{e.packageCode}</span>
            )}
            <span className="ml-auto flex items-center gap-2">
              {e.bookedAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(e.bookedAt), "dd/MM HH:mm", { locale: fr })}
                </span>
              )}
              {e.lastMinute && (
                <Badge className="bg-accent text-accent-foreground text-xs">
                  Dernière minute
                </Badge>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
