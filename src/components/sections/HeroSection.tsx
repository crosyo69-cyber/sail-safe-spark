import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Star, Award, Users, Shield } from "lucide-react";
import heroImage from "@/assets/hero-kitesurf.jpg";

const trustBadges = [
  { icon: Award, text: "1ère école Var 83" },
  { icon: Users, text: "25 ans d'expérience" },
  { icon: Star, text: "Note 4.9/5" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Kitesurf à l'Almanarre Hyères - Vue aérienne du spot de kitesurf"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/40 via-navy/30 to-navy/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Pre-title */}
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 mb-6 animate-fade-in">
            <Shield className="w-4 h-4 text-sunset" />
            <span className="text-primary-foreground text-sm font-medium">
              École avec bateau d'assistance
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-primary-foreground leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Apprenez le Kitesurf en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">
              Toute Sécurité
            </span>{" "}
            à Hyères
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            École itinérante avec bateau d'assistance • Depuis 1999 • Presqu'île de Giens
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="heroFilled" size="xl" asChild>
              <a href="#contact">
                Réserver un Cours
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
            <Button variant="hero" size="xl" asChild>
              <a href="#tarifs">
                Voir les Tarifs
              </a>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {trustBadges.map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2"
              >
                <badge.icon className="w-5 h-5 text-sunset" />
                <span className="text-primary-foreground text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
