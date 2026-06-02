import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLastMinuteSessions } from "@/hooks/useLastMinuteSessions";
import LastMinuteSessionCard from "@/components/LastMinuteSessionCard";
import LastMinuteAlertForm from "@/components/LastMinuteAlertForm";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Wind } from "lucide-react";

export default function DernieresMinutes() {
  const [weekOnly, setWeekOnly] = useState(false);
  const { sessions, loading } = useLastMinuteSessions({ weekOnly });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Sessions Dernière Minute Kitesurf Passion Hyères</title>
        <meta
          name="description"
          content="Réservez en temps réel les créneaux dernière minute de Kitesurf Passion à Hyères : kitesurf, wingfoil et kitefoil dans les meilleures fenêtres météo."
        />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/dernieres-minutes" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent mb-3">
              <Wind className="w-4 h-4" />
              <span className="text-sm font-semibold">Temps réel</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Sessions Dernière Minute
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Profitez des meilleures fenêtres météo : nous ouvrons des créneaux supplémentaires dès que le vent et la mer s'alignent. Réservation instantanée.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 mb-6">
            <Switch id="weekOnly" checked={weekOnly} onCheckedChange={setWeekOnly} />
            <Label htmlFor="weekOnly" className="cursor-pointer">Cette semaine uniquement</Label>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">Aucune session dernière minute pour le moment.</p>
              <p className="text-sm">Inscrivez-vous aux alertes ci-dessous pour être prévenu(e) en priorité.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 mb-12">
              {sessions.map((s) => (
                <LastMinuteSessionCard key={s.id} session={s} />
              ))}
            </div>
          )}

          <LastMinuteAlertForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}