import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Award, Users, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import heroKitesurf from "@/assets/hero-kitesurf.jpg";
import heroWingfoil from "@/assets/wingfoil.jpg";
import heroPumpfoil from "@/assets/pumpfoil.jpg";

const slides = [
  {
    id: "kitesurf",
    image: heroKitesurf,
    alt: "Cours de Kitesurf à Hyères - École KiteSurf Passion Almanarre",
    preTitle: "École avec bateau d'assistance",
    titleStart: "Apprenez le Kitesurf en",
    titleHighlight: "Toute Sécurité",
    titleEnd: "à Hyères",
    subtitle: "École itinérante avec bateau d'assistance • Depuis 1999 • Presqu'île de Giens",
  },
  {
    id: "wingfoil",
    image: heroWingfoil,
    alt: "Stage Wingfoil Hyères - Cours Wing Foil Almanarre Var",
    preTitle: "Sport tendance 2024",
    titleStart: "Découvrez le Wingfoil en",
    titleHighlight: "Toute Sécurité",
    titleEnd: "à Hyères",
    subtitle: "Plus accessible que le kite • Sensations pures • Spot Almanarre idéal",
  },
  {
    id: "pumpfoil",
    image: heroPumpfoil,
    alt: "Initiation Pumpfoil Hyères - Cours Pump Foil Dock Start Var",
    preTitle: "Sans vent, sans vagues",
    titleStart: "Initiez-vous au Pumpfoil en",
    titleHighlight: "Toute Confiance",
    titleEnd: "à Hyères",
    subtitle: "Dock start • Progression rapide • Workout nautique unique",
  },
];

const trustBadges = [
  { icon: Award, text: "1ère école Var 83" },
  { icon: Users, text: "25 ans d'expérience" },
  { icon: Star, text: "Note 4.9/5" },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const slide = slides[currentSlide];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Images */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={s.image}
            alt={s.alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/40 via-navy/30 to-navy/70" />
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 z-20 p-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 transition-all"
        aria-label="Diapositive précédente"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 z-20 p-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 transition-all"
        aria-label="Diapositive suivante"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Pre-title */}
          <div 
            key={`pretitle-${currentSlide}`}
            className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 mb-6 animate-fade-in"
          >
            <Shield className="w-4 h-4 text-sunset" />
            <span className="text-primary-foreground text-sm font-medium">
              {slide.preTitle}
            </span>
          </div>

          {/* Main Title */}
          <h1 
            key={`title-${currentSlide}`}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-primary-foreground leading-tight mb-6 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            {slide.titleStart}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean to-turquoise">
              {slide.titleHighlight}
            </span>{" "}
            {slide.titleEnd}
          </h1>

          {/* Subtitle */}
          <p 
            key={`subtitle-${currentSlide}`}
            className="text-lg sm:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            {slide.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="heroFilled" size="xl" asChild>
              <Link to="/contact-reservation-kitesurf-hyeres">
                Réserver un Cours
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="hero" size="xl" asChild>
              <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">
                Voir les Tarifs
              </Link>
            </Button>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-3 mb-8">
            {slides.map((s, index) => (
              <button
                key={s.id}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? "w-8 bg-sunset" 
                    : "w-2 bg-primary-foreground/30 hover:bg-primary-foreground/50"
                }`}
                aria-label={`Aller à ${s.id}`}
              />
            ))}
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
