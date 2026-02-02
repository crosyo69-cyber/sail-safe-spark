import { memo } from "react";
import { Ship, MapPin, GraduationCap, Waves, Shield } from "lucide-react";
import logoFfvl from "@/assets/logo-ffvl.png";
import logoEfk from "@/assets/logo-efk.png";

const features = [
  {
    icon: Ship,
    title: "Bateau d'Assistance",
    description: "Sécurité maximale, récupération systématique, progression rapide. Vous êtes toujours accompagnés sur l'eau.",
    gradient: "from-sunset to-sunset-light",
  },
  {
    icon: MapPin,
    title: "École Itinérante",
    description: "Nous nous déplaçons des 2 côtés de la presqu'île selon les conditions météo pour un apprentissage optimal.",
    gradient: "from-primary to-turquoise",
  },
  {
    icon: GraduationCap,
    title: "Moniteur Expert",
    description: "Yoanne Cros, diplômé d'État BPJEPS depuis 1999, formateur de moniteurs et passionné de glisse.",
    gradient: "from-turquoise to-ocean-light",
  },
  {
    icon: Waves,
    title: "Spot Mythique",
    description: "L'Almanarre : eau plate idéale, vent régulier, conditions parfaites pour débutants et confirmés.",
    gradient: "from-ocean-light to-primary",
  },
];

export const WhyUsSection = memo(function WhyUsSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary font-semibold mb-4">Pourquoi nous choisir</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Pourquoi Choisir{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">
              KiteSurf Passion
            </span>{" "}
            à Hyères ?
          </h2>
          <p className="text-muted-foreground text-lg">
            Depuis 1999, nous avons formé plus de 2 500 élèves avec une pédagogie unique et une sécurité maximale.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-border/50 overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* Certifications FFVL/EFK */}
        <div className="mt-16 pt-10 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2 text-center md:text-left">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">École FFVL labellisée EFK</span>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://ffvl.fr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                title="Fédération Française de Vol Libre"
              >
                <img 
                  src={logoFfvl} 
                  alt="Logo FFVL labellisée EFK - École de kitesurf certifiée" 
                  width={80}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  className="h-12 w-auto object-contain"
                />
              </a>
              <a 
                href="https://ffvl.fr/ecole-francaise-kite" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                title="École Française de Kite"
              >
                <img 
                  src={logoEfk} 
                  alt="Logo FFVL labellisée EFK - École de kitesurf certifiée" 
                  width={80}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  className="h-12 w-auto object-contain"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
