import { memo, useState, useEffect, useCallback, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Star, Award, Users, Shield, ChevronLeft, ChevronRight, GraduationCap, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTAClick, trackPhoneClick } from "@/lib/analytics";

// Import hero images with WebP conversion - Desktop (full size)
import heroKitesurf from "@/assets/kitesurf-hyeres.jpg?webp";
import heroWingfoil from "@/assets/wingfoil-hyeres.jpg?webp";
import heroPumpfoil from "@/assets/pumpfoil-hyeres.jpg?webp";

// Import hero images - Mobile optimized (smaller size)
import heroKitesurfMobile from "@/assets/kitesurf-hyeres.jpg?webp&w=768";
import heroWingfoilMobile from "@/assets/wingfoil-hyeres.jpg?webp&w=768";
import heroPumpfoilMobile from "@/assets/pumpfoil-hyeres.jpg?webp&w=768";

// Import hero images - Tablet optimized (medium size)
import heroKitesurfTablet from "@/assets/kitesurf-hyeres.jpg?webp&w=1280";
import heroWingfoilTablet from "@/assets/wingfoil-hyeres.jpg?webp&w=1280";
import heroPumpfoilTablet from "@/assets/pumpfoil-hyeres.jpg?webp&w=1280";

const slides = [
  {
    id: "kitesurf",
    image: heroKitesurf,
    imageMobile: heroKitesurfMobile,
    imageTablet: heroKitesurfTablet,
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
    imageMobile: heroWingfoilMobile,
    imageTablet: heroWingfoilTablet,
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
    imageMobile: heroPumpfoilMobile,
    imageTablet: heroPumpfoilTablet,
    alt: "Cours Pumpfoil Hyères Giens - Dock start pump foil école KiteSurf Passion Var",
    preTitle: "Sensations uniques",
    titleStart: "Découvrez le Pump Foil en",
    titleHighlight: "Toute Confiance",
    titleEnd: "à Hyères",
    subtitle: "Dock start • Progression rapide • Workout nautique unique",
  },
];

const trustBadges = [
  { icon: Award, text: "1ère école Var 83" },
  { icon: GraduationCap, text: "2 500 élèves formés" },
  { icon: Users, text: "25 ans d'expérience" },
  { icon: Star, text: "Note 4.9/5" },
];

export const HeroSection = memo(function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Dynamically inject preload for hero LCP image (matches Vite-hashed path)
  useLayoutEffect(() => {
    const existing = document.querySelector('link[data-hero-preload]');
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.type = 'image/webp';
    link.href = heroKitesurf;
    link.setAttribute('fetchpriority', 'high');
    link.setAttribute('data-hero-preload', 'true');
    document.head.appendChild(link);
  }, []);

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
    <>
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ 
        contain: 'layout style',
        minHeight: '100vh',
        minWidth: '100vw',
      }}
    >
      {/* Background Images - Optimized for LCP with explicit dimensions */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
          style={{ 
            contain: 'strict',
            willChange: index === currentSlide ? 'opacity' : 'auto',
          }}
          aria-hidden={index !== currentSlide}
        >
          <img
            src={s.image}
            srcSet={`${s.imageMobile} 768w, ${s.imageTablet} 1280w, ${s.image} 1920w`}
            sizes="100vw"
            alt={s.alt}
            width={1920}
            height={1080}
            loading={index === 0 ? "eager" : "lazy"}
            decoding={index === 0 ? "sync" : "async"}
            fetchPriority={index === 0 ? "high" : "low"}
            className="w-full h-full object-cover"
            style={{ 
              aspectRatio: '16 / 9',
              objectFit: 'cover',
              minHeight: '100vh',
              width: '100%',
              height: '100%',
            }}
          />
          <div 
            className="absolute inset-0 home-photo-overlay" 
            style={{ contain: 'strict' }}
          />
        </div>
      ))}

      {/* Navigation Arrows - Touch optimized */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 z-20 p-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 transition-all touch-target"
        aria-label="Diapositive précédente"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 z-20 p-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 transition-all touch-target"
        aria-label="Diapositive suivante"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 text-center">
        <div className="home-hero-copy max-w-4xl mx-auto">
          {/* Pre-title — Fixed offer clarity (no slide dependency) */}
          <div 
            className="inline-flex items-center gap-2 bg-navy/70 backdrop-blur-sm border border-sunset/60 rounded-full px-4 py-2 mb-6 animate-fade-in shadow-lg"
          >
            <Shield className="w-4 h-4 text-sunset-light" />
            <span className="text-primary-foreground text-xs sm:text-sm font-semibold">
              École Kitesurf · Wingfoil · Pumpfoil à Hyères — depuis 1999
            </span>
          </div>

          {/* Main Title — Fixed value proposition */}
          <h1 
            className="font-display text-[2.5rem] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl font-black text-primary-foreground mb-5 animate-fade-in drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            style={{ animationDelay: "0.1s" }}
          >
            Glissez en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">
              toute sécurité
            </span>{" "}
            à Hyères
          </h1>

          {/* Dynamic activity sub-headline (changes with slide) */}
          <p
            key={`subtitle-${currentSlide}`}
            className="text-base sm:text-lg md:text-xl text-primary-foreground mb-6 max-w-2xl mx-auto animate-fade-in font-medium"
            style={{ animationDelay: "0.15s" }}
          >
            {slide.subtitle}
          </p>

          {/* CTA Buttons — Stronger primary hierarchy */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-3 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <Button 
              variant="heroFilled" 
              size="xl" 
              className="w-full sm:w-auto shadow-sunset ring-2 ring-sunset/50 ring-offset-2 ring-offset-transparent hover:ring-sunset/80 hover:scale-[1.03] transition-transform font-bold text-base sm:text-lg"
              asChild
              onClick={() => trackCTAClick("reserver_cours", "hero", "/contact-reservation-kitesurf-hyeres")}
            >
              <Link to="/contact-reservation-kitesurf-hyeres">
                Réserver mon stage
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full sm:w-auto backdrop-blur-md"
              asChild
              onClick={() => trackCTAClick("voir_tarifs", "hero", "/tarifs-cours-kitesurf-wingfoil-hyeres")}
            >
              <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">
                Voir les tarifs
              </Link>
            </Button>
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full sm:w-auto backdrop-blur-md"
              asChild
              onClick={() => trackPhoneClick("hero")}
            >
              <a href="tel:+33672716905">
                <Phone className="w-5 h-5" />
                06 72 71 69 05
              </a>
            </Button>
          </div>

          {/* Reassurance — single dense line, max info / min visual cost */}
          <div
            className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 mb-10 animate-fade-in text-primary-foreground/95 text-xs sm:text-sm"
            style={{ animationDelay: "0.3s" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sunset" /> Acompte 50 € seulement
            </span>
            <span className="hidden sm:inline text-primary-foreground/40">•</span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sunset" /> Bateau d'assistance inclus
            </span>
            <span className="hidden sm:inline text-primary-foreground/40">•</span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sunset" /> Réponse sous 24 h
            </span>
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
    </>
  );
});
