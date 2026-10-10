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
      className="relative bg-navy pt-[88px] lg:min-h-screen lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
      aria-roledescription="carrousel"
    >
      {/* Photos — affichées sans aucun voile ni filtre */}
      <div className="relative w-full aspect-[16/10] lg:aspect-auto lg:h-full overflow-hidden">
        {slides.map((s, index) => (
          <img
            key={s.id}
            src={s.image}
            srcSet={`${s.imageMobile} 768w, ${s.imageTablet} 1280w, ${s.image} 1920w`}
            sizes="(min-width: 1024px) 60vw, 100vw"
            alt={s.alt}
            width={1920}
            height={1080}
            loading={index === 0 ? "eager" : "lazy"}
            decoding={index === 0 ? "sync" : "async"}
            fetchPriority={index === 0 ? "high" : "low"}
            aria-hidden={index !== currentSlide}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {/* Panneau texte bleu nuit uni */}
      <div className="bg-navy px-5 sm:px-8 lg:px-12 py-10 lg:py-14 flex flex-col justify-center text-center lg:text-left">
        <div className="max-w-xl mx-auto lg:mx-0">
          <div className="inline-flex items-center gap-2 border border-sunset/60 rounded-full px-4 py-2 mb-6">
            <Shield className="w-4 h-4 text-sunset-light" />
            <span className="text-primary-foreground text-xs sm:text-sm font-semibold">
              École Kitesurf · Wingfoil · Pumpfoil à Hyères — depuis 1999
            </span>
          </div>

          <h1 className="font-display text-[2.25rem] leading-[1.05] sm:text-5xl xl:text-6xl font-black text-primary-foreground mb-5">
            Glissez en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">
              toute sécurité
            </span>{" "}
            à Hyères
          </h1>

          <p
            key={`subtitle-${currentSlide}`}
            className="text-base sm:text-lg text-primary-foreground mb-6 font-medium animate-fade-in"
          >
            {slide.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row flex-wrap gap-3 justify-center lg:justify-start items-stretch sm:items-center lg:items-stretch xl:items-center mb-4">
            <Button
              variant="heroFilled"
              size="xl"
              className="w-full sm:w-auto shadow-sunset font-bold text-base sm:text-lg"
              asChild
              onClick={() => trackCTAClick("reserver_cours", "hero", "/contact-reservation-kitesurf-hyeres")}
            >
              <Link to="/contact-reservation-kitesurf-hyeres">
                Réserver mon stage
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              variant="hero"
              size="lg"
              className="w-full sm:w-auto"
              asChild
              onClick={() => trackCTAClick("voir_tarifs", "hero", "/tarifs-cours-kitesurf-wingfoil-hyeres")}
            >
              <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">Voir les tarifs</Link>
            </Button>
            <Button
              variant="hero"
              size="lg"
              className="w-full sm:w-auto"
              asChild
              onClick={() => trackPhoneClick("hero")}
            >
              <a href="tel:+33672716905">
                <Phone className="w-5 h-5" />
                06 72 71 69 05
              </a>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-4 gap-y-1.5 mb-8 text-primary-foreground text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sunset" /> Acompte 50 € seulement
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sunset" /> Bateau d'assistance inclus
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sunset" /> Réponse sous 24 h
            </span>
          </div>

          {/* Navigation du carrousel */}
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 transition-colors touch-target"
              aria-label="Diapositive précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {slides.map((s, index) => (
              <button
                key={s.id}
                onClick={() => goToSlide(index)}
                className="touch-target flex items-center justify-center"
                aria-label={`Aller à ${s.id}`}
                aria-current={index === currentSlide}
              >
                <span className={`block h-2 rounded-full transition-all duration-300 ${index === currentSlide ? "w-8 bg-sunset" : "w-2 bg-primary-foreground/60"}`} />
              </button>
            ))}
            <button
              onClick={nextSlide}
              className="p-2 rounded-full border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 transition-colors touch-target"
              aria-label="Diapositive suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-start gap-3">
            {trustBadges.map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 border border-primary-foreground/20 rounded-full px-4 py-2">
                <badge.icon className="w-5 h-5 text-sunset" />
                <span className="text-primary-foreground text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
    </>
  );
});
