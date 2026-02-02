import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sun, Snowflake, TrendingUp, Users, Clock, Award, Calendar, Zap } from "lucide-react";

interface PricingItem {
  name: string;
  sessions: string;
  highSeasonPrice: string;
  lowSeasonPrice: string;
  savings?: string;
  popular?: boolean;
}

interface SeasonPricingSectionProps {
  title: string;
  gradientClass: string;
  items: PricingItem[];
  colorScheme: "ocean" | "sunset" | "turquoise";
}

const highSeasonAdvantages = [
  { icon: Sun, text: "Conditions météo optimales" },
  { icon: TrendingUp, text: "Forte demande" },
  { icon: Calendar, text: "Périodes vacances" },
];

const lowSeasonAdvantages = [
  { icon: Clock, text: "Plus de disponibilité" },
  { icon: Users, text: "Suivi plus personnalisé" },
  { icon: Zap, text: "Progression plus rapide" },
  { icon: Award, text: "Tarifs plus avantageux" },
];

export const SeasonPricingSection = ({
  title,
  gradientClass,
  items,
  colorScheme,
}: SeasonPricingSectionProps) => {
  const borderColorMap = {
    ocean: "border-primary",
    sunset: "border-sunset",
    turquoise: "border-turquoise",
  };

  const bgGradientMap = {
    ocean: "from-primary to-primary/80",
    sunset: "from-sunset to-sunset-light",
    turquoise: "from-turquoise to-primary",
  };

  const accentColor = borderColorMap[colorScheme];
  const gradient = bgGradientMap[colorScheme];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4 text-center">
          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${gradientClass}`}>
            {title}
          </span>
        </h2>

        {/* Phrase explicative */}
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10 text-sm">
          Les tarifs varient selon la période de l'année afin de s'adapter aux conditions, 
          à la demande et au niveau d'encadrement proposé.
        </p>

        {/* Grille Haute Saison / Basse Saison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Bloc Haute Saison */}
          <div className="bg-card rounded-3xl border-2 border-sunset/30 overflow-hidden shadow-lg">
            {/* Header Haute Saison */}
            <div className="bg-gradient-to-r from-sunset to-sunset-light p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sun className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-lg">Haute Saison</h3>
                    <p className="text-white/80 text-sm">Juillet & Août</p>
                  </div>
                </div>
                <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm">
                  Forte demande
                </span>
              </div>
            </div>

            {/* Avantages Haute Saison */}
            <div className="p-4 bg-sunset/5 border-b border-sunset/10">
              <ul className="flex flex-wrap gap-3">
                {highSeasonAdvantages.map((advantage, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <advantage.icon className="w-4 h-4 text-sunset" />
                    <span>{advantage.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tarifs Haute Saison */}
            <div className="p-5 space-y-3">
              {items.map((item, index) => (
                <div
                  key={`high-${item.name}-${index}`}
                  className={`bg-background/50 rounded-xl p-4 border ${
                    item.popular ? "border-sunset shadow-md" : "border-border/30"
                  } relative flex items-center justify-between gap-4`}
                >
                  {item.popular && (
                    <span className="absolute -top-2 right-4 bg-sunset text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      Populaire
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-foreground text-sm truncate">{item.name}</h4>
                    <p className="text-muted-foreground text-xs">{item.sessions}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-xl font-bold text-foreground">{item.highSeasonPrice}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Haute Saison */}
            <div className="p-5 pt-0">
              <Button variant="sunset" size="lg" className="w-full" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  Réserver en haute saison
                </Link>
              </Button>
            </div>
          </div>

          {/* Bloc Basse Saison */}
          <div className="bg-card rounded-3xl border-2 border-primary/30 overflow-hidden shadow-lg relative">
            {/* Badge économies */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-primary text-white text-sm px-4 py-1.5 rounded-full font-bold shadow-glow">
                💰 Meilleur rapport qualité/prix
              </span>
            </div>

            {/* Header Basse Saison */}
            <div className={`bg-gradient-to-r ${gradient} p-5 mt-1`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Snowflake className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-lg">Basse Saison</h3>
                    <p className="text-white/80 text-sm">Hors Juillet/Août</p>
                  </div>
                </div>
                <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm">
                  Tarifs préférentiels
                </span>
              </div>
            </div>

            {/* Avantages Basse Saison */}
            <div className="p-4 bg-primary/5 border-b border-primary/10">
              <ul className="flex flex-wrap gap-3">
                {lowSeasonAdvantages.map((advantage, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <advantage.icon className="w-4 h-4 text-primary" />
                    <span>{advantage.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tarifs Basse Saison */}
            <div className="p-5 space-y-3">
              {items.map((item, index) => (
                <div
                  key={`low-${item.name}-${index}`}
                  className={`bg-background/50 rounded-xl p-4 border ${
                    item.popular ? `${accentColor} shadow-md` : "border-border/30"
                  } relative flex items-center justify-between gap-4`}
                >
                  {item.popular && (
                    <span className={`absolute -top-2 right-4 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-semibold`}>
                      Populaire
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-foreground text-sm truncate">{item.name}</h4>
                    <p className="text-muted-foreground text-xs">{item.sessions}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-xl font-bold text-primary">{item.lowSeasonPrice}</p>
                    {item.savings && (
                      <p className="text-xs text-primary/80 font-medium">
                        Économisez {item.savings}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Basse Saison */}
            <div className="p-5 pt-0">
              <Button variant="default" size="lg" className="w-full" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  Profiter des tarifs basse saison
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeasonPricingSection;
