import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Ship, Award, Settings, Repeat, MapPin, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const activities = [
  {
    id: "cours-particulier",
    name: "Cours Particulier Kitesurf",
    icon: Award,
    description: "Moniteur 100% dédié à votre progression",
  },
  {
    id: "stage-100-glisse",
    name: "Stage 100% Glisse",
    icon: Ship,
    description: "5 jours consécutifs vers l'autonomie",
  },
  {
    id: "cours-carte",
    name: "Cours à la Carte",
    icon: Settings,
    description: "Flexibilité totale selon vos disponibilités",
  },
  {
    id: "stage-wingfoil",
    name: "Cours Wingfoil",
    icon: Repeat,
    description: "Découvrez le vol sur l'eau en wingfoil",
  },
  {
    id: "location-materiel",
    name: "Location Matériel",
    icon: MapPin,
    description: "Kite, planche, harnais — tout l'équipement",
  },
];

const DepositPaymentSection = () => {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Record<string, number>>({});

  const getCount = (id: string) => participants[id] || 1;

  const updateCount = (id: string, delta: number) => {
    setParticipants((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, Math.min(6, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const handleCheckout = async (activityName: string, activityId: string) => {
    setLoadingId(activityId);
    const count = getCount(activityId);
    const stripeWindow = window.open("about:blank", "_blank");
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { activityName, participants: count },
      });

      if (error) throw error;
      if (data?.url) {
        if (stripeWindow && !stripeWindow.closed) {
          stripeWindow.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      } else {
        stripeWindow?.close();
        throw new Error("Aucune URL de paiement reçue");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({
        title: "Erreur",
        description: "Impossible de lancer le paiement. Veuillez réessayer ou nous appeler.",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-4">
              <CreditCard className="w-4 h-4" />
              Paiement sécurisé
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Réservez en Ligne
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Versez un acompte de 50€ par personne pour confirmer votre réservation. Le solde sera à régler le jour de votre cours.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => {
              const count = getCount(activity.id);
              const total = count * 50;
              return (
                <div
                  key={activity.id}
                  className="bg-card border border-border rounded-2xl p-6 flex flex-col hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 mb-4 bg-gradient-to-br from-primary/20 to-turquoise/20 rounded-xl flex items-center justify-center">
                    <activity.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{activity.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4 flex-1">
                    {activity.description}
                  </p>

                  {/* Participant selector */}
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 mb-3">
                    <span className="text-sm text-muted-foreground">Participants</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCount(activity.id, -1)}
                        disabled={count <= 1}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-semibold text-foreground text-sm">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCount(activity.id, 1)}
                        disabled={count >= 6}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 mb-4 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      Acompte : {total}€ {count > 1 && <span className="font-normal text-muted-foreground">({count} × 50€)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      (solde à régler le jour J)
                    </p>
                  </div>
                  <Button
                    variant="sunset"
                    className="w-full"
                    disabled={loadingId === activity.id}
                    onClick={() => handleCheckout(activity.name, activity.id)}
                  >
                    {loadingId === activity.id ? "Redirection…" : "Payer l'acompte"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DepositPaymentSection;
