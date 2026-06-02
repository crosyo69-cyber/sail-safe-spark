import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flame, Wind, Calendar as CalIcon, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { LastMinuteSession } from "@/hooks/useLastMinuteSessions";

const SLOT_LABELS: Record<string, string> = {
  morning: "Matin",
  early_afternoon: "Début d'après-midi",
  late_afternoon: "Fin d'après-midi",
};

const ACTIVITY_LABELS: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
};

export default function LastMinuteSessionCard({ session }: { session: LastMinuteSession }) {
  const { toast } = useToast();
  const [packCode, setPackCode] = useState("");
  const [loading, setLoading] = useState(false);
  const full = session.remaining <= 0 || session.status !== "open";

  const labelBadge =
    session.last_minute_label === "wind" ? (
      <Badge className="bg-primary text-primary-foreground gap-1">
        <Wind className="w-3 h-3" /> Conditions exceptionnelles
      </Badge>
    ) : (
      <Badge className="bg-accent text-accent-foreground gap-1">
        <Flame className="w-3 h-3" /> Session Dernière Minute
      </Badge>
    );

  const handleBookWithPack = async () => {
    if (!packCode.trim()) {
      toast({ title: "Code requis", description: "Entrez votre code de pack.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("book_session_with_code", {
      p_code: packCode.trim().toUpperCase(),
      p_session_id: session.id,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    const result = data as any;
    if (!result?.ok) {
      toast({ title: "Impossible", description: result?.error || "Réservation refusée", variant: "destructive" });
      return;
    }
    toast({ title: "Réservé !", description: "Votre session est confirmée. Bon vent !" });
    setPackCode("");
  };

  const handleBookWithDeposit = () => {
    const tab = window.open("", "_blank");
    setLoading(true);
    supabase.functions
      .invoke("create-checkout", {
        body: {
          activityName: `Dernière Minute - ${ACTIVITY_LABELS[session.activity] || session.activity}`,
          participants: 1,
          totalSessions: 1,
          preferredDate: session.date,
          phone: "0000000000",
          customerName: "Client dernière minute",
        },
      })
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data?.url) {
          tab?.close();
          toast({ title: "Erreur", description: error?.message || "Impossible de créer le paiement", variant: "destructive" });
          return;
        }
        if (tab) tab.location.href = data.url;
        else window.location.href = data.url;
      });
  };

  return (
    <Card className="p-5 border-2 border-accent/30 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        {labelBadge}
        <Badge variant="outline">{ACTIVITY_LABELS[session.activity] || session.activity}</Badge>
      </div>

      <div className="flex items-center gap-2 text-foreground font-display text-lg mb-1">
        <CalIcon className="w-4 h-4 text-primary" />
        {format(new Date(session.date), "EEEE d MMMM", { locale: fr })}
        <span className="text-muted-foreground text-sm">· {SLOT_LABELS[session.time_slot]}</span>
      </div>

      {session.weather_note && (
        <p className="text-sm text-muted-foreground italic mb-2">🌬️ {session.weather_note}</p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-muted-foreground" />
        {full ? (
          <Badge variant="destructive">Complet</Badge>
        ) : (
          <span className={`text-sm font-semibold ${session.remaining <= 2 ? "text-destructive animate-pulse" : "text-foreground"}`}>
            {session.remaining} place{session.remaining > 1 ? "s" : ""} restante{session.remaining > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!full && (
        <div className="space-y-3">
          <Button
            onClick={handleBookWithDeposit}
            disabled={loading}
            className="w-full min-h-[44px] bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Réserver (acompte 50€)"}
          </Button>
          <div className="flex gap-2">
            <Input
              placeholder="Code de pack (KP-...)"
              value={packCode}
              onChange={(e) => setPackCode(e.target.value)}
              className="min-h-[44px]"
            />
            <Button onClick={handleBookWithPack} disabled={loading} variant="outline" className="min-h-[44px]">
              Utiliser
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}