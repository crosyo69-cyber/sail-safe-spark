import { Card, CardContent } from "@/components/ui/card";
import { Users, Phone, Mail, TrendingUp } from "lucide-react";
import { pct, type Stats } from "@/features/admin-conversion-funnel/types";

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
          {icon}
          <span>{label}</span>
        </div>
        <div className="mt-2 text-2xl font-display font-bold text-foreground tabular-nums">
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export const FunnelStatCards = ({ stats }: { stats: Stats }) => (
  <div className="grid gap-4 md:grid-cols-4">
    <StatCard
      icon={<Users className="w-4 h-4" />}
      label="Visiteurs uniques"
      value={stats.visitors}
      hint={`${stats.pageViews} pages vues`}
    />
    <StatCard
      icon={<Phone className="w-4 h-4" />}
      label="Clics téléphone"
      value={stats.phoneClicks}
      hint={`${stats.phoneSessions} visiteurs · ${pct(stats.phoneSessions, stats.visitors)}`}
    />
    <StatCard
      icon={<Mail className="w-4 h-4" />}
      label="Formulaires envoyés"
      value={stats.formSubmits}
      hint={`${stats.formSessions} visiteurs · ${pct(stats.formSessions, stats.visitors)}`}
    />
    <StatCard
      icon={<TrendingUp className="w-4 h-4" />}
      label="Taux de conversion"
      value={pct(stats.leadSessions, stats.visitors)}
      hint={`${stats.leadSessions} leads / ${stats.visitors} visiteurs`}
    />
  </div>
);