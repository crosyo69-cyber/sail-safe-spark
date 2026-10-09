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
    <section 
      className="py-16 bg-background"
      style={{ contain: 'layout style', contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}
    >
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10 max-w-5xl mx-auto">
          {/* Bloc Haute Saison */}
          <div className="bg-card rounded-2xl md:rounded-3xl border-2 border-sunset/30 overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-sunset/50 hover:-translate-y-1">
            {/* Header Haute Saison */}
            <div className="bg-gradient-to-r from-sunset to-sunset-light p-4 md:p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center">
                    <Sun className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base md:text-lg">Haute Saison</h3>
                    <p className="text-white/80 text-xs md:text-sm">Juillet & Août</p>
                  </div>
                </div>
                <span className="bg-white/20 text-white text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-full font-semibold backdrop-blur-sm">
                  Forte demande
                </span>
              </div>
            </div>

            {/* Avantages Haute Saison */}
            <div className="p-3 md:p-4 bg-sunset/5 border-b border-sunset/10">
              <ul className="flex flex-wrap gap-2 md:gap-3">
                {highSeasonAdvantages.map((advantage, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-foreground/80">
                    <advantage.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-sunset flex-shrink-0" />
                    <span>{advantage.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tarifs Haute Saison */}
            <div className="p-3 md:p-5 space-y-2 md:space-y-3">
              {items.map((item, index) => (
                <div
                  key={`high-${item.name}-${index}`}
                  className={`bg-background/50 rounded-lg md:rounded-xl p-3 md:p-4 border ${
                    item.popular ? "border-sunset shadow-md" : "border-border/30"
                  } relative flex items-center justify-between gap-3 md:gap-4 transition-all duration-200 hover:bg-background hover:shadow-md hover:scale-[1.02] cursor-pointer`}
                >
                  {item.popular && (
                    <span className="absolute -top-2 right-3 md:right-4 bg-sunset-strong text-white text-[10px] md:text-xs px-2 py-0.5 rounded-full font-semibold">
                      Populaire
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-foreground text-xs md:text-sm truncate">{item.name}</h4>
                    <p className="text-muted-foreground text-[10px] md:text-xs">{item.sessions}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-lg md:text-xl font-bold text-foreground">{item.highSeasonPrice}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Haute Saison */}
            <div className="p-3 md:p-5 pt-0">
              <Button variant="sunset" size="lg" className="w-full text-sm md:text-base" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  Réserver en haute saison
                </Link>
              </Button>
            </div>
          </div>

          {/* Bloc Basse Saison */}
          <div className="bg-card rounded-2xl md:rounded-3xl border-2 border-primary/30 overflow-hidden shadow-lg relative transition-all duration-300 hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1">
            {/* Header Basse Saison */}
            <div className={`bg-gradient-to-r ${gradient} p-4 md:p-5`}>
              {/* Badge économies - intégré en haut du header */}
              <div className="flex justify-center mb-2 md:mb-3">
                <span className="bg-white text-primary text-xs md:text-sm px-3 md:px-4 py-1 md:py-1.5 rounded-full font-bold shadow-md whitespace-nowrap border-2 border-primary/20">
                  💰 Meilleur rapport qualité/prix
                </span>
              </div>
              
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center">
                    <Snowflake className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base md:text-lg">Basse Saison</h3>
                    <p className="text-white/80 text-xs md:text-sm">Hors Juillet/Août</p>
                  </div>
                </div>
                <span className="bg-white/20 text-white text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-full font-semibold backdrop-blur-sm">
                  Tarifs préférentiels
                </span>
              </div>
            </div>

            {/* Avantages Basse Saison */}
            <div className="p-3 md:p-4 bg-primary/5 border-b border-primary/10">
              <ul className="flex flex-wrap gap-2 md:gap-3">
                {lowSeasonAdvantages.map((advantage, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-foreground/80">
                    <advantage.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary flex-shrink-0" />
                    <span>{advantage.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tarifs Basse Saison */}
            <div className="p-3 md:p-5 space-y-2 md:space-y-3">
              {items.map((item, index) => (
                <div
                  key={`low-${item.name}-${index}`}
                  className={`bg-background/50 rounded-lg md:rounded-xl p-3 md:p-4 border ${
                    item.popular ? `${accentColor} shadow-md` : "border-border/30"
                  } relative flex items-center justify-between gap-3 md:gap-4 transition-all duration-200 hover:bg-background hover:shadow-md hover:scale-[1.02] cursor-pointer`}
                >
                  {item.popular && (
                    <span className={`absolute -top-2 right-3 md:right-4 bg-primary text-white text-[10px] md:text-xs px-2 py-0.5 rounded-full font-semibold`}>
                      Populaire
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-foreground text-xs md:text-sm truncate">{item.name}</h4>
                    <p className="text-muted-foreground text-[10px] md:text-xs">{item.sessions}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-lg md:text-xl font-bold text-primary">{item.lowSeasonPrice}</p>
                    {item.savings && (
                      <p className="text-[10px] md:text-xs text-primary font-medium">
                        Économisez {item.savings}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Basse Saison */}
            <div className="p-3 md:p-5 pt-0">
              <Button variant="default" size="lg" className="w-full text-sm md:text-base" asChild>
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
