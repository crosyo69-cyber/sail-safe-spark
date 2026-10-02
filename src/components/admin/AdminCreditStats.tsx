import { useCallback, useEffect, useState } from "react";
import { creditService } from "@/services/credit.service";
import { settle } from "@/services/_shared/result";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2, TrendingDown, RotateCcw, Wallet, CloudRain, ArrowRightLeft, CalendarX, ExternalLink,
} from "lucide-react";
import { format, startOfYear } from "date-fns";

type Stats = {
  credits_used: number;
  credits_recredited: number;
  credits_remaining: number;
  weather_cancellations: number;
  reports: number;
  days_cancelled: number;
};

const AdminCreditStats = () => {
  const [start, setStart] = useState(format(startOfYear(new Date()), "yyyy-MM-dd"));
  const [end, setEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = settle(await creditService.stats({ p_start: start, p_end: end }));
    setLoading(false);
    if (error) return toast.error(error.message);
    setStats(data as unknown as Stats);
  }, [start, end]);

  useEffect(() => { load(); }, [load]);

  const cards = [
    { label: "Crédits utilisés", value: stats?.credits_used ?? 0, icon: TrendingDown },
    { label: "Crédits recrédités", value: stats?.credits_recredited ?? 0, icon: RotateCcw },
    { label: "Crédits restants (packs actifs)", value: stats?.credits_remaining ?? 0, icon: Wallet },
    { label: "Annulations météo", value: stats?.weather_cancellations ?? 0, icon: CloudRain },
    { label: "Reports", value: stats?.reports ?? 0, icon: ArrowRightLeft },
    { label: "Journées annulées", value: stats?.days_cancelled ?? 0, icon: CalendarX },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="cs-start">Du</Label>
            <Input id="cs-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cs-end">Au</Label>
            <Input id="cs-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <Button onClick={load} disabled={loading} className="min-h-[44px]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualiser"}
          </Button>
          <Button variant="outline" asChild className="ml-auto min-h-[44px]">
            <Link to="/admin/credits">
              <ExternalLink className="w-4 h-4 mr-2" />Gestion des crédits
            </Link>
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="py-5 flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{c.value}</div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminCreditStats;