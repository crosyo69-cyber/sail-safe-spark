import { useState, useEffect, useMemo } from "react";
import { statsService } from "@/services/stats.service";
import { settle } from "@/services/_shared/result";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, Minus, Euro, Users, CalendarDays, RefreshCw, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const DEPOSIT_PER_PERSON = 50;

const ACTIVITY_LABELS: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

const ACTIVITY_COLORS: Record<string, string> = {
  kitesurf: "hsl(189, 94%, 37%)",
  wingfoil: "hsl(25, 95%, 53%)",
  pumpfoil: "hsl(174, 77%, 50%)",
  foil_tracte: "hsl(222, 47%, 25%)",
  stage_100_glisse: "hsl(20, 95%, 55%)",
};

const PIE_COLORS = [
  "hsl(189, 94%, 37%)",
  "hsl(25, 95%, 53%)",
  "hsl(174, 77%, 50%)",
  "hsl(222, 47%, 25%)",
];

type Period = "month" | "quarter" | "year" | "all";

interface Reservation {
  id: string;
  participants: number;
  status: string;
  created_at: string;
  stripe_session_id: string | null;
  daily_group_id: string | null;
  /** F-28-07-03 : activité achetée par le client — source du CA par activité. */
  client_activity: string | null;
}

interface SessionInfo {
  id: string;
  activity: string;
  date: string;
}

const AdminRevenueDashboard = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [groups, setGroups] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [activityFilter, setActivityFilter] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    const [resResult, groupResult] = await Promise.all([
      statsService.revenueReservations<Reservation[]>().then(settle),
      statsService.revenueGroups<SessionInfo[]>().then(settle),
    ]);

    if (resResult.data) setReservations(resResult.data);
    if (groupResult.data) setGroups(groupResult.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupMap = useMemo(() => {
    const map: Record<string, SessionInfo> = {};
    groups.forEach((g) => (map[g.id] = g));
    return map;
  }, [groups]);

  const resolve = (r: Reservation): SessionInfo | undefined => {
    if (r.daily_group_id && groupMap[r.daily_group_id]) return groupMap[r.daily_group_id];
    return undefined;
  };

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "quarter":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "all":
        return { start: new Date(2020, 0, 1), end: now };
    }
  }, [period]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const date = parseISO(r.created_at);
      if (!isWithinInterval(date, dateRange)) return false;
      if (activityFilter !== "all") {
        if (r.client_activity !== activityFilter) return false;
      }
      return true;
    });
  }, [reservations, dateRange, activityFilter, groupMap]);

  // Previous period for comparison
  const prevDateRange = useMemo(() => {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return {
      start: new Date(dateRange.start.getTime() - duration),
      end: new Date(dateRange.start.getTime() - 1),
    };
  }, [dateRange]);

  const prevReservations = useMemo(() => {
    return reservations.filter((r) => {
      const date = parseISO(r.created_at);
      if (!isWithinInterval(date, prevDateRange)) return false;
      if (activityFilter !== "all") {
        if (r.client_activity !== activityFilter) return false;
      }
      return true;
    });
  }, [reservations, prevDateRange, activityFilter, groupMap]);

  // Stats
  const totalRevenue = filteredReservations.reduce((a, r) => a + r.participants * DEPOSIT_PER_PERSON, 0);
  const totalParticipants = filteredReservations.reduce((a, r) => a + r.participants, 0);
  const totalTransactions = filteredReservations.length;
  const avgPerTransaction = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  // Previous period stats
  const prevRevenue = prevReservations.reduce((a, r) => a + r.participants * DEPOSIT_PER_PERSON, 0);
  const prevParticipants = prevReservations.reduce((a, r) => a + r.participants, 0);
  const prevTransactions = prevReservations.length;
  const prevAvg = prevTransactions > 0 ? Math.round(prevRevenue / prevTransactions) : 0;

  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Revenue by activity
  const revenueByActivity = useMemo(() => {
    const map: Record<string, number> = {};
    filteredReservations.forEach((r) => {
      const act = r.client_activity || "unknown";
      map[act] = (map[act] || 0) + r.participants * DEPOSIT_PER_PERSON;
    });
    return Object.entries(map)
      .map(([activity, revenue]) => ({
        name: ACTIVITY_LABELS[activity] || activity,
        value: revenue,
        activity,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredReservations, groupMap]);

  // Revenue over time (bar chart)
  const revenueOverTime = useMemo(() => {
    if (period === "month") {
      const weeks = eachWeekOfInterval(dateRange, { weekStartsOn: 1 });
      return weeks.map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekRevenue = filteredReservations
          .filter((r) => {
            const d = parseISO(r.created_at);
            return isWithinInterval(d, { start: weekStart, end: weekEnd });
          })
          .reduce((a, r) => a + r.participants * DEPOSIT_PER_PERSON, 0);
        return {
          label: `Sem. ${format(weekStart, "d MMM", { locale: fr })}`,
          revenue: weekRevenue,
        };
      });
    }
    const months = eachMonthOfInterval(dateRange);
    return months.map((monthStart) => {
      const monthEnd = endOfMonth(monthStart);
      const monthRevenue = filteredReservations
        .filter((r) => {
          const d = parseISO(r.created_at);
          return isWithinInterval(d, { start: monthStart, end: monthEnd });
        })
        .reduce((a, r) => a + r.participants * DEPOSIT_PER_PERSON, 0);
      return {
        label: format(monthStart, "MMM yy", { locale: fr }),
        revenue: monthRevenue,
      };
    });
  }, [filteredReservations, dateRange, period]);

  // Cumulative revenue line
  const cumulativeRevenue = useMemo(() => {
    let cum = 0;
    return revenueOverTime.map((item) => {
      cum += item.revenue;
      return { ...item, cumulative: cum };
    });
  }, [revenueOverTime]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return [...filteredReservations]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((r) => {
        const info = resolve(r);
        return {
          ...r,
          activity: r.client_activity || "unknown",
          date: info?.date || "",
          amount: r.participants * DEPOSIT_PER_PERSON,
        };
      });
  }, [filteredReservations, groupMap]);

  const periodLabels: Record<Period, string> = {
    month: "Ce mois",
    quarter: "3 derniers mois",
    year: "Cette année",
    all: "Tout",
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("KiteSurf Passion — Rapport de revenus", 14, 18);

    // Period
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Période : ${periodLabels[period]}`, 14, 38);
    doc.text(`Généré le ${format(new Date(), "d MMMM yyyy à HH:mm", { locale: fr })}`, 14, 44);

    // Stats summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Résumé", 14, 56);

    autoTable(doc, {
      startY: 60,
      head: [["Revenu total", "Transactions", "Participants", "Panier moyen"]],
      body: [[
        `${totalRevenue.toLocaleString("fr-FR")} €`,
        `${totalTransactions}`,
        `${totalParticipants}`,
        `${avgPerTransaction} €`,
      ]],
      theme: "grid",
      headStyles: { fillColor: [8, 145, 178], fontSize: 9 },
      bodyStyles: { fontSize: 10, fontStyle: "bold", halign: "center" },
      styles: { halign: "center" },
    });

    // Revenue by activity
    const actTableY = (doc as any).lastAutoTable?.finalY + 12 || 90;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Revenus par activité", 14, actTableY);

    if (revenueByActivity.length > 0) {
      autoTable(doc, {
        startY: actTableY + 4,
        head: [["Activité", "Revenu", "Part"]],
        body: revenueByActivity.map((a) => [
          a.name,
          `${a.value.toLocaleString("fr-FR")} €`,
          totalRevenue > 0 ? `${Math.round((a.value / totalRevenue) * 100)}%` : "0%",
        ]),
        theme: "striped",
        headStyles: { fillColor: [8, 145, 178], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
      });
    }

    // Revenue over time
    const timeTableY = (doc as any).lastAutoTable?.finalY + 12 || 140;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Évolution du revenu", 14, timeTableY);

    if (revenueOverTime.length > 0) {
      autoTable(doc, {
        startY: timeTableY + 4,
        head: [["Période", "Revenu"]],
        body: revenueOverTime.map((r) => [
          r.label,
          `${r.revenue.toLocaleString("fr-FR")} €`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [8, 145, 178], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
      });
    }

    // Recent transactions
    const txTableY = (doc as any).lastAutoTable?.finalY + 12 || 200;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Dernières transactions", 14, txTableY);

    // Get all filtered transactions (not just 10)
    const allTransactions = [...filteredReservations]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((r) => {
        const info = resolve(r);
        return {
          date: format(parseISO(r.created_at), "dd/MM/yyyy HH:mm", { locale: fr }),
          activity: ACTIVITY_LABELS[r.client_activity || ""] || r.client_activity || "—",
          participants: `${r.participants}`,
          amount: `${(r.participants * DEPOSIT_PER_PERSON).toLocaleString("fr-FR")} €`,
        };
      });

    if (allTransactions.length > 0) {
      autoTable(doc, {
        startY: txTableY + 4,
        head: [["Date", "Activité", "Participants", "Montant"]],
        body: allTransactions.map((t) => [t.date, t.activity, t.participants, t.amount]),
        theme: "striped",
        headStyles: { fillColor: [8, 145, 178], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `KiteSurf Passion · Spot de l'Almanarre, Hyères — Page ${i}/${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    }

    doc.save(`revenus-${period}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Rapport PDF téléchargé");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Euro className="w-5 h-5 text-primary" />
            Revenus
          </h2>
          <p className="text-sm text-muted-foreground">
            Acomptes de {DEPOSIT_PER_PERSON} € par participant
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportPDF} title="Exporter PDF">
            <FileDown className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { fetchData(); toast.success("Données actualisées"); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Euro, label: "Revenu total", value: `${totalRevenue.toLocaleString("fr-FR")} €`, trend: calcTrend(totalRevenue, prevRevenue) },
          { icon: TrendingUp, label: "Transactions", value: `${totalTransactions}`, trend: calcTrend(totalTransactions, prevTransactions) },
          { icon: Users, label: "Participants", value: `${totalParticipants}`, trend: calcTrend(totalParticipants, prevParticipants) },
          { icon: CalendarDays, label: "Panier moyen", value: `${avgPerTransaction} €`, trend: calcTrend(avgPerTransaction, prevAvg) },
        ].map((stat, i) => {
          const TrendIcon = stat.trend > 0 ? TrendingUp : stat.trend < 0 ? TrendingDown : Minus;
          const trendColor = stat.trend > 0 ? "text-green-600" : stat.trend < 0 ? "text-destructive" : "text-muted-foreground";
          return (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              {period !== "all" && (
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendColor}`}>
                  <TrendIcon className="w-3 h-3" />
                  <span>{stat.trend > 0 ? "+" : ""}{stat.trend}%</span>
                  <span className="text-muted-foreground font-normal">vs précédent</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Revenue bar chart */}
        <Card className="md:col-span-2 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Évolution du revenu</h3>
          {cumulativeRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cumulativeRevenue} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString("fr-FR")} €`,
                    name === "revenue" ? "Revenu" : "Cumulé",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="revenue" name="Revenu" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Line dataKey="cumulative" name="Cumulé" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} type="monotone" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">Aucune donnée pour cette période</p>
          )}
        </Card>

        {/* Pie chart by activity */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Par activité</h3>
          {revenueByActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={revenueByActivity}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {revenueByActivity.map((entry, i) => (
                    <Cell key={i} fill={ACTIVITY_COLORS[entry.activity] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString("fr-FR")} €`, "Revenu"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">Aucune donnée</p>
          )}
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Dernières transactions</h3>
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Date</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Activité</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">Participants</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Montant</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 px-3 text-foreground">
                      {format(parseISO(t.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="secondary" className="text-xs">
                        {ACTIVITY_LABELS[t.activity] || t.activity}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center text-foreground">{t.participants}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-foreground">
                      {t.amount.toLocaleString("fr-FR")} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune transaction pour cette période</p>
        )}
      </Card>
    </div>
  );
};

export default AdminRevenueDashboard;
