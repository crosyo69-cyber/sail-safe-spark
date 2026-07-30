import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, CalendarDays, ChevronDown, ChevronUp, Mail, Phone, CreditCard, RefreshCw, Download, Send, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Activity = "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte" | "stage_100_glisse";

const ACTIVITY_LABELS: Record<Activity, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
};

interface Reservation {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  skill_level: string;
  participants: number;
  status: string;
  stripe_session_id: string | null;
}

interface GroupRow {
  id: string;
  date: string;
  activity: Activity;
  max_participants: number;
  reservations: Reservation[];
  status: string;
}

const AdminOverview = () => {
  const [sessions, setSessions] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [showPast, setShowPast] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [resubmittingSitemap, setResubmittingSitemap] = useState(false);

  const sendWeeklySummary = async () => {
    setSendingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke("weekly-summary", { body: {} });
      if (error) throw error;
      toast({ title: "Résumé envoyé !", description: `${data.sessions} sessions incluses (${data.week})` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Impossible d'envoyer le résumé", variant: "destructive" });
    } finally {
      setSendingSummary(false);
    }
  };

  const resubmitSitemap = async () => {
    setResubmittingSitemap(true);
    try {
      const { data, error } = await supabase.functions.invoke("resubmit-sitemap-gsc", { body: { trigger: "manual-admin" } });
      if (error) throw error;
      const submitted = data?.status?.contents?.[0]?.submitted;
      toast({
        title: "Sitemap relancé ✓",
        description: submitted
          ? `Google a reçu la demande (${submitted} URLs). Recrawl prioritaire en cours.`
          : "Google a reçu la demande de recrawl.",
      });
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message || "Impossible de relancer la soumission GSC",
        variant: "destructive",
      });
    } finally {
      setResubmittingSitemap(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);

    const today = format(new Date(), "yyyy-MM-dd");
    const resFields = "id, first_name, last_name, email, phone, skill_level, participants, status, stripe_session_id";

    const groupsQ = supabase
      .from("daily_groups")
      .select(`id, date, activity, max_participants, status, notes, reservations(${resFields})`)
      .order("date", { ascending: true });
    if (!showPast) {
      groupsQ.gte("date", today);
    }

    const groupsRes = await groupsQ.limit(200);
    if (groupsRes.error) console.error("Error fetching daily_groups:", groupsRes.error);

    const rows: GroupRow[] = ((groupsRes.data as any[]) || []).map((g) => ({
      id: g.id,
      date: g.date,
      activity: g.activity as Activity,
      max_participants: g.max_participants,
      status: g.status,
      notes: g.notes,
      reservations: g.reservations || [],
    }));

    rows.sort((a, b) => a.date.localeCompare(b.date));
    setSessions(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [showPast]);

  const toggleExpand = (id: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group sessions by date
  const grouped = sessions.reduce<Record<string, GroupRow[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const totalReservations = sessions.reduce((sum, s) => sum + (s.reservations?.length || 0), 0);
  const confirmedReservations = sessions.reduce(
    (sum, s) => sum + (s.reservations?.filter((r) => r.status === "confirmed").length || 0),
    0
  );

  const exportCSV = () => {
    const rows: string[][] = [
      ["Date", "Créneau", "Activité", "Prénom", "Nom", "Email", "Téléphone", "Niveau", "Participants", "Statut", "Stripe ID"],
    ];
    sessions.forEach((s) => {
      if (!s.reservations?.length) return;
      s.reservations.forEach((r) => {
        rows.push([
          format(new Date(s.date), "dd/MM/yyyy"),
          "—",
          ACTIVITY_LABELS[s.activity],
          r.first_name,
          r.last_name,
          r.email,
          r.phone || "",
          LEVEL_LABELS[r.skill_level] || r.skill_level,
          String(r.participants),
          STATUS_LABELS[r.status] || r.status,
          r.stripe_session_id || "",
        ]);
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
          <p className="text-xs text-muted-foreground">Sessions</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalReservations}</p>
          <p className="text-xs text-muted-foreground">Réservations</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{confirmedReservations}</p>
          <p className="text-xs text-muted-foreground">Confirmées</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{Object.keys(grouped).length}</p>
          <p className="text-xs text-muted-foreground">Jours planifiés</p>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button size="sm" variant="outline" onClick={fetchAll} className="gap-1">
          <RefreshCw className="w-3 h-3" /> Actualiser
        </Button>
        <Button
          size="sm"
          variant={showPast ? "default" : "outline"}
          onClick={() => setShowPast(!showPast)}
        >
          {showPast ? "Masquer l'historique" : "Voir l'historique"}
        </Button>
        {totalReservations > 0 && (
          <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1">
            <Download className="w-3 h-3" /> Exporter CSV
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={sendWeeklySummary}
          disabled={sendingSummary}
          className="gap-1"
        >
          <Send className="w-3 h-3" />
          {sendingSummary ? "Envoi…" : "Résumé hebdo"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resubmitSitemap}
          disabled={resubmittingSitemap}
          className="gap-1"
          title="Resoumettre sitemap.xml à Google Search Console"
        >
          <Globe className="w-3 h-3" />
          {resubmittingSitemap ? "Envoi…" : "Relancer GSC maintenant"}
        </Button>
      </div>

      {/* Sessions grouped by date */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Chargement…</p>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {showPast ? "Aucune session trouvée." : "Aucune session à venir. Créez-en dans l'onglet Sessions."}
          </p>
        </Card>
      ) : (
        Object.entries(grouped).map(([date, daySessions]) => {
          const dayReservationCount = daySessions.reduce((s, sess) => s + (sess.reservations?.length || 0), 0);
          const isToday = date === format(new Date(), "yyyy-MM-dd");

          return (
            <div key={date} className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <h3 className={cn(
                  "text-sm font-semibold uppercase tracking-wide",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {isToday && "🟢 "}
                  {format(new Date(date), "EEEE d MMMM yyyy", { locale: fr })}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {dayReservationCount} résa{dayReservationCount !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="space-y-2 ml-6">
                {daySessions.map((session) => {
                  const resCount = session.reservations?.length || 0;
                  const isExpanded = expandedSessions.has(session.id);
                  const activeReservations = session.reservations?.filter((r) => r.status !== "cancelled") || [];

                  return (
                    <Card key={session.id} className={cn(
                      "overflow-hidden transition-opacity",
                      session.status === "closed" && "opacity-60"
                    )}>
                      <button
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                        onClick={() => resCount > 0 && toggleExpand(session.id)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              session.activity === "kitesurf" && "bg-primary/10 text-primary border-primary/30",
                              session.activity === "wingfoil" && "bg-accent/10 text-accent border-accent/30",
                              session.activity === "pumpfoil" && "bg-turquoise/10 text-turquoise border-turquoise/30",
                              session.activity === "foil_tracte" && "bg-ocean-dark/10 text-ocean-dark border-ocean-dark/30"
                            )}
                          >
                            {ACTIVITY_LABELS[session.activity]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">horaire communiqué la veille</span>
                          {session.status === "closed" && (
                            <Badge variant="outline" className="text-xs bg-muted">Fermée</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-medium flex items-center gap-1",
                            activeReservations.length >= session.max_participants
                              ? "text-destructive"
                              : "text-muted-foreground"
                          )}>
                            <Users className="w-3 h-3" />
                            {activeReservations.length}/{session.max_participants}
                          </span>
                          {resCount > 0 && (
                            isExpanded
                              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {isExpanded && session.reservations && (
                        <div className="border-t border-border divide-y divide-border">
                          {session.reservations.map((r) => (
                            <div key={r.id} className="px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-medium text-foreground truncate">
                                  {r.first_name} {r.last_name}
                                </span>
                                <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[r.status])}>
                                  {STATUS_LABELS[r.status] || r.status}
                                </Badge>
                                {r.participants > 1 && (
                                  <span className="text-xs text-muted-foreground">{r.participants} pers.</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {LEVEL_LABELS[r.skill_level] || r.skill_level}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {r.email}
                                </span>
                                {r.phone && r.phone !== "Non renseigné" && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {r.phone}
                                  </span>
                                )}
                                {r.stripe_session_id && (
                                  <a
                                    href={`https://dashboard.stripe.com/checkout/sessions/${r.stripe_session_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-primary transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <CreditCard className="w-3 h-3" /> Stripe
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AdminOverview;
