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
import { Loader2, Users, CalendarDays, TrendingUp, Sun, Snowflake, RefreshCw, BarChart3 } from "lucide-react";
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
} from "recharts";
import { toast } from "sonner";

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

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

const LEVEL_COLORS = {
  debutant: "hsl(25, 95%, 53%)",
  intermediaire: "hsl(189, 94%, 37%)",
  confirme: "hsl(174, 77%, 50%)",
};

// Haute saison: Avril - Septembre, Basse saison: Octobre - Mars
function getSeason(dateStr: string): "haute" | "basse" {
  const month = new Date(dateStr + "T12:00:00").getMonth(); // 0-indexed
  return month >= 3 && month <= 8 ? "haute" : "basse";
}

function getSeasonLabel(year: string): { haute: string; basse: string } {
  return {
    haute: `Haute Saison ${year} (Avr–Sep)`,
    basse: `Basse Saison ${year} (Oct–Mar)`,
  };
}

interface SessionData {
  id: string;
  date: string;
  activity: string;
  max_participants: number;
  status: string;
}

interface ReservationData {
  id: string;
  daily_group_id: string | null;
  participants: number;
  status: string;
  skill_level: string;
  first_name: string;
  last_name: string;
}

const AdminSeasonStats = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const fetchData = async () => {
    setLoading(true);
    const [groupRes, resRes] = await Promise.all([
      statsService.seasonGroups<SessionData[]>().then(settle),
      statsService.seasonReservations<ReservationData[]>().then(settle),
    ]);
    const combined: SessionData[] = (groupRes.data || []).map((g: any) => ({
      id: g.id,
      date: g.date,
      activity: g.activity,
      max_participants: g.max_participants,
      status: g.status,
    }));
    setSessions(combined);
    if (resRes.data) setReservations(resRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const availableYears = useMemo(() => {
    const years = new Set(sessions.map((s) => s.date.substring(0, 4)));
    if (years.size === 0) years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [sessions]);

  const sessionMap = useMemo(() => {
    const map: Record<string, SessionData> = {};
    sessions.forEach((s) => (map[s.id] = s));
    return map;
  }, [sessions]);

  // Filter by year
  const yearSessions = useMemo(() => sessions.filter((s) => s.date.startsWith(selectedYear)), [sessions, selectedYear]);
  const yearReservations = useMemo(() => {
    const ids = new Set(yearSessions.map((s) => s.id));
    return reservations.filter((r) => r.daily_group_id && ids.has(r.daily_group_id));
  }, [reservations, yearSessions]);

  // Season breakdown
  const seasonData = useMemo(() => {
    const result: Record<"haute" | "basse", {
      sessions: number;
      participants: number;
      capacity: number;
      byActivity: Record<string, number>;
      byLevel: Record<string, number>;
    }> = {
      haute: { sessions: 0, participants: 0, capacity: 0, byActivity: {}, byLevel: {} },
      basse: { sessions: 0, participants: 0, capacity: 0, byActivity: {}, byLevel: {} },
    };

    yearSessions.forEach((s) => {
      const season = getSeason(s.date);
      result[season].sessions++;
      result[season].capacity += s.max_participants;
      result[season].byActivity[s.activity] = (result[season].byActivity[s.activity] || 0) + 1;
    });

    yearReservations.forEach((r) => {
      const session = sessionMap[r.daily_group_id || ""];
      if (!session) return;
      const season = getSeason(session.date);
      result[season].participants += r.participants;
      result[season].byLevel[r.skill_level] = (result[season].byLevel[r.skill_level] || 0) + r.participants;
    });

    return result;
  }, [yearSessions, yearReservations, sessionMap]);

  // Monthly breakdown for chart
  const monthlyData = useMemo(() => {
    const months: Record<string, { participants: number; sessions: number }> = {};
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

    monthNames.forEach((name, i) => {
      months[`${i}`] = { participants: 0, sessions: 0 };
    });

    yearSessions.forEach((s) => {
      const month = new Date(s.date + "T12:00:00").getMonth();
      months[`${month}`].sessions++;
    });

    yearReservations.forEach((r) => {
      const session = sessionMap[r.daily_group_id || ""];
      if (!session) return;
      const month = new Date(session.date + "T12:00:00").getMonth();
      months[`${month}`].participants += r.participants;
    });

    return monthNames.map((name, i) => ({
      name,
      participants: months[`${i}`].participants,
      sessions: months[`${i}`].sessions,
      season: i >= 3 && i <= 8 ? "haute" : "basse",
    }));
  }, [yearSessions, yearReservations, sessionMap]);

  // Activity breakdown for bar chart
  const activityData = useMemo(() => {
    const map: Record<string, { haute: number; basse: number }> = {};
    yearReservations.forEach((r) => {
      const session = sessionMap[r.daily_group_id || ""];
      if (!session) return;
      const act = session.activity;
      const season = getSeason(session.date);
      if (!map[act]) map[act] = { haute: 0, basse: 0 };
      map[act][season] += r.participants;
    });
    return Object.entries(map).map(([activity, data]) => ({
      name: ACTIVITY_LABELS[activity] || activity,
      activity,
      "Haute Saison": data.haute,
      "Basse Saison": data.basse,
    }));
  }, [yearReservations, sessionMap]);

  // Level pie data
  const levelData = useMemo(() => {
    const map: Record<string, number> = {};
    yearReservations.forEach((r) => {
      map[r.skill_level] = (map[r.skill_level] || 0) + r.participants;
    });
    return Object.entries(map).map(([level, count]) => ({
      name: LEVEL_LABELS[level] || level,
      value: count,
      level,
    }));
  }, [yearReservations]);

  const totalParticipants = seasonData.haute.participants + seasonData.basse.participants;
  const totalSessions = seasonData.haute.sessions + seasonData.basse.sessions;
  const totalCapacity = seasonData.haute.capacity + seasonData.basse.capacity;
  const fillRate = totalCapacity > 0 ? Math.round((totalParticipants / totalCapacity) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const SeasonCard = ({ season, icon: Icon, color, bgColor }: { season: "haute" | "basse"; icon: any; color: string; bgColor: string }) => {
    const data = seasonData[season];
    const rate = data.capacity > 0 ? Math.round((data.participants / data.capacity) * 100) : 0;
    const labels = getSeasonLabel(selectedYear);
    return (
      <Card className={`p-5 border-2 ${bgColor}`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-5 h-5 ${color}`} />
          <h3 className={`text-sm font-bold ${color}`}>
            {season === "haute" ? labels.haute : labels.basse}
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-2xl font-bold text-foreground">{data.participants}</p>
            <p className="text-xs text-muted-foreground">Stagiaires</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{data.sessions}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${rate < 50 ? "text-yellow-600" : rate < 80 ? "text-primary" : "text-green-600"}`}>{rate}%</p>
            <p className="text-xs text-muted-foreground">Remplissage</p>
          </div>
        </div>
        {Object.keys(data.byActivity).length > 0 && (
          <div className="space-y-1.5">
            {Object.entries(data.byActivity)
              .sort(([, a], [, b]) => b - a)
              .map(([act, count]) => {
                const actParticipants = yearReservations
                  .filter((r) => {
                    const s = sessionMap[r.daily_group_id || ""];
                    return s && s.activity === act && getSeason(s.date) === season;
                  })
                  .reduce((a, r) => a + r.participants, 0);
                return (
                  <div key={act} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACTIVITY_COLORS[act] }} />
                      <span className="text-foreground font-medium">{ACTIVITY_LABELS[act] || act}</span>
                    </div>
                    <span className="text-muted-foreground">{actParticipants} stagiaires · {count} sessions</span>
                  </div>
                );
              })}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Statistiques globales
          </h2>
          <p className="text-sm text-muted-foreground">Vue par saison et par activité</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => { fetchData(); toast.success("Données actualisées"); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Total stagiaires</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalParticipants}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CalendarDays className="w-4 h-4" />
            <span className="text-xs font-medium">Total sessions</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Taux de remplissage</span>
          </div>
          <p className={`text-2xl font-bold ${fillRate < 50 ? "text-yellow-600" : fillRate < 80 ? "text-primary" : "text-green-600"}`}>{fillRate}%</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Moy. / session</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {totalSessions > 0 ? (totalParticipants / totalSessions).toFixed(1) : "0"}
          </p>
        </Card>
      </div>

      {/* Season cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <SeasonCard season="haute" icon={Sun} color="text-accent" bgColor="border-accent/30 bg-accent/5" />
        <SeasonCard season="basse" icon={Snowflake} color="text-primary" bgColor="border-primary/30 bg-primary/5" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Monthly participants */}
        <Card className="md:col-span-2 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Stagiaires par mois</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="participants" name="Stagiaires" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, i) => (
                  <Cell key={i} fill={entry.season === "haute" ? "hsl(25, 95%, 53%)" : "hsl(189, 94%, 37%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Level pie */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Par niveau</h3>
          {levelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={levelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {levelData.map((entry, i) => (
                    <Cell key={i} fill={LEVEL_COLORS[entry.level as keyof typeof LEVEL_COLORS] || "hsl(var(--muted))"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} stagiaires`, ""]}
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

      {/* Activity comparison by season */}
      {activityData.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Stagiaires par activité et saison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend />
              <Bar dataKey="Haute Saison" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Basse Saison" fill="hsl(189, 94%, 37%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};

export default AdminSeasonStats;
