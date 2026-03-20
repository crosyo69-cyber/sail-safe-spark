import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, X, Clock, User, Phone, Mail, CreditCard } from "lucide-react";

type ReservationStatus = "pending" | "confirmed" | "cancelled";

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  confirmed: { label: "Confirmée", color: "bg-green-100 text-green-800 border-green-300" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-800 border-red-300" },
};

const ACTIVITY_LABELS: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
};

const SLOT_LABELS: Record<string, string> = {
  morning: "Matin",
  early_afternoon: "Début d'après-midi",
  late_afternoon: "Fin d'après-midi",
};

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

interface Reservation {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  skill_level: string;
  participants: number;
  status: ReservationStatus;
  created_at: string;
  notes: string | null;
  stripe_session_id: string | null;
  sessions: {
    date: string;
    time_slot: string;
    activity: string;
  };
}

const AdminReservationList = () => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchReservations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select("*, sessions(date, time_slot, activity)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching reservations:", error);
    } else {
      setReservations((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const updateStatus = async (id: string, status: ReservationStatus) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Réservation ${STATUS_CONFIG[status].label.toLowerCase()} ✓` });
      fetchReservations();
    }
  };

  const filtered = filterStatus === "all"
    ? reservations
    : reservations.filter((r) => r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="confirmed">Confirmées</SelectItem>
            <SelectItem value="cancelled">Annulées</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} réservation{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Chargement…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Aucune réservation trouvée.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">
                      {r.first_name} {r.last_name}
                    </span>
                    <Badge variant="outline" className={STATUS_CONFIG[r.status].color}>
                      {STATUS_CONFIG[r.status].label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {LEVEL_LABELS[r.skill_level] || r.skill_level}
                    </Badge>
                    {r.participants > 1 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <User className="w-3 h-3" /> {r.participants} pers.
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {r.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {r.phone}
                    </span>
                  </div>

                  {r.sessions && (
                    <p className="text-sm text-foreground">
                      <strong>{ACTIVITY_LABELS[r.sessions.activity] || r.sessions.activity}</strong>
                      {" — "}
                      {format(new Date(r.sessions.date), "d MMMM yyyy", { locale: fr })}
                      {" • "}
                      {SLOT_LABELS[r.sessions.time_slot] || r.sessions.time_slot}
                    </p>
                  )}

                  {r.stripe_session_id && (
                    <p className="text-xs text-muted-foreground font-mono">
                      <CreditCard className="w-3 h-3 inline mr-1" />
                      {r.stripe_session_id}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Réservé le {format(new Date(r.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>

                <div className="flex gap-1">
                  {r.status !== "confirmed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() => updateStatus(r.id, "confirmed")}
                    >
                      <Check className="w-3 h-3" /> Confirmer
                    </Button>
                  )}
                  {r.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => updateStatus(r.id, "cancelled")}
                    >
                      <X className="w-3 h-3" /> Annuler
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReservationList;
