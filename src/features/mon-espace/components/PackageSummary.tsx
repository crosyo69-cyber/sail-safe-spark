import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { PackageInfo } from "../types";

interface Props {
  pkg: PackageInfo;
  activityLabel: string;
}

export const PackageSummary = ({ pkg, activityLabel }: Props) => (
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
);