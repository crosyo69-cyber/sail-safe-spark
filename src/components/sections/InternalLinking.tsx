import { Link } from "react-router-dom";
import { ArrowRight, Compass, BookOpen, CreditCard, MessageCircle, MapPin } from "lucide-react";

interface LinkItem {
  href: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface InternalLinkingProps {
  title?: string;
  subtitle?: string;
  links: LinkItem[];
  variant?: "grid" | "inline" | "compact";
  accentColor?: "primary" | "ocean" | "sunset";
}

// Predefined link sets for reuse across pages
export const pillarLinks = {
  tarifs: { href: "/tarifs-cours-kitesurf-wingfoil-hyeres", label: "Voir tous les tarifs", icon: CreditCard },
  contact: { href: "/contact-reservation-kitesurf-hyeres", label: "Réserver un cours", icon: MessageCircle },
  spot: { href: "/spot-kitesurf-almanarre-hyeres-var", label: "Découvrir le spot Almanarre", icon: MapPin },
  blog: { href: "/blog-kitesurf-hyeres", label: "Conseils et guides", icon: BookOpen },
};

export const disciplineLinks = {
  kitesurf: { href: "/cours-kitesurf-hyeres-debutant", label: "Cours kitesurf débutant", description: "Apprenez les bases du kitesurf" },
  stage100: { href: "/stage-kitesurf-100-glisse-hyeres", label: "Stage 100% Glisse", description: "5 jours pour l'autonomie" },
  particulier: { href: "/cours-particulier-kitesurf-hyeres", label: "Cours particulier", description: "Progression personnalisée" },
  sessionCarte: { href: "/session-kitesurf-carte-hyeres", label: "Sessions à la carte", description: "Flexibilité maximale" },
  wingfoil: { href: "/stage-wingfoil-hyeres-almanarre", label: "Stage wingfoil", description: "Le sport tendance" },
  pumpfoil: { href: "/cours-pumpfoil-dock-start-hyeres", label: "Cours pumpfoil", description: "Volez sans vent" },
  foilTracte: { href: "/foil-tracte-hyeres", label: "Foil tracté", description: "Initiation au vol" },
  wakeboard: { href: "/wakeboard-hyeres", label: "Wakeboard", description: "Glisse fun tractée" },
  location: { href: "/location-materiel-kitesurf-hyeres", label: "Location matériel", description: "Équipement récent" },
  deposes: { href: "/deposes-mer-kitesurf-hyeres", label: "Déposes en mer", description: "Accès spots par bateau" },
};

export const InternalLinking = ({
  title,
  subtitle,
  links,
  variant = "grid",
  accentColor = "primary"
}: InternalLinkingProps) => {
  const colorMap = {
    primary: {
      gradient: "from-primary to-turquoise",
      hover: "hover:border-primary/50",
      text: "text-primary",
      bg: "bg-primary/10",
    },
    ocean: {
      gradient: "from-ocean to-turquoise",
      hover: "hover:border-ocean/50",
      text: "text-ocean",
      bg: "bg-ocean/10",
    },
    sunset: {
      gradient: "from-sunset to-sunset-light",
      hover: "hover:border-sunset/50",
      text: "text-sunset",
      bg: "bg-sunset/10",
    },
  };

  const colors = colorMap[accentColor];

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap gap-3 items-center">
        {links.map((link, index) => (
          <Link
            key={link.href}
            to={link.href}
            className={`inline-flex items-center gap-1.5 text-sm font-medium ${colors.text} hover:underline underline-offset-2`}
          >
            {link.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
        {title && (
          <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Compass className={`w-5 h-5 ${colors.text}`} />
            {title}
          </h3>
        )}
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-border/50 ${colors.hover} transition-colors bg-card`}
            >
              {link.icon && <link.icon className={`w-4 h-4 ${colors.text}`} />}
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${colors.gradient}`}>
                  {title}
                </span>
              </h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`group bg-card border border-border/50 ${colors.hover} rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
            >
              <div className="flex items-start gap-3">
                {link.icon && (
                  <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <link.icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className={`font-medium text-foreground group-hover:${colors.text} transition-colors block`}>
                    {link.label}
                  </span>
                  {link.description && (
                    <span className="text-muted-foreground text-sm block mt-0.5">
                      {link.description}
                    </span>
                  )}
                </div>
                <ArrowRight className={`w-4 h-4 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity mt-1`} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// Quick access component for pillar pages CTAs
export const PillarCTA = ({ excludePaths = [] }: { excludePaths?: string[] }) => {
  const ctaLinks = [
    pillarLinks.tarifs,
    pillarLinks.contact,
    pillarLinks.spot,
    pillarLinks.blog,
  ].filter(link => !excludePaths.includes(link.href));

  return (
    <div className="flex flex-wrap gap-3 justify-center mt-6">
      {ctaLinks.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-full text-sm font-medium text-foreground transition-colors border border-border/50 hover:border-primary/30"
        >
          {link.icon && <link.icon className="w-4 h-4 text-primary" />}
          {link.label}
        </Link>
      ))}
    </div>
  );
};

// Contextual internal link for within text
export const InlineLink = ({ 
  href, 
  children 
}: { 
  href: string; 
  children: React.ReactNode;
}) => (
  <Link 
    to={href} 
    className="text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
  >
    {children}
  </Link>
);

export default InternalLinking;
