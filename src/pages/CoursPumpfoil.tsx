import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { CTASection } from "@/components/sections/CTASection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Waves, Zap, Target, Clock } from "lucide-react";
import pumpfoilImage from "@/assets/pumpfoil-hyeres-cours.jpg";
import pumpfoilInitiation from "@/assets/pumpfoil-initiation.jpg";

const breadcrumbItems = [
  { label: "Initiation Pump Foil" }
];

const features = [
  {
    icon: Waves,
    title: "Sans Vent, Sans Vagues",
    description: "Le pumpfoil fonctionne par simple mouvement de pompage, idéal quand il n'y a pas de vent."
  },
  {
    icon: Zap,
    title: "Cardio & Renforcement",
    description: "Un excellent workout qui combine cardio et renforcement musculaire tout en s'amusant."
  },
  {
    icon: Target,
    title: "Dock Start Inclus",
    description: "Apprenez la technique du dock start pour décoller facilement depuis un ponton."
  },
  {
    icon: Clock,
    title: "Progression Rapide",
    description: "Technique accessible, vous volerez sur l'eau dès les premières séances."
  }
];

const includes = [
  "Foil et planche adaptés à votre niveau",
  "Gilet de sauvetage et casque",
  "Encadrement par moniteur diplômé",
  "Bateau d'assistance à proximité",
  "Briefing sécurité complet",
  "Débriefing et conseils personnalisés"
];

const pricing = [
  {
    name: "Séance Pump Foil / Dock Start",
    duration: "1h30",
    price: "50€",
    description: "3 personnes maximum, tout matériel inclus",
    popular: true
  }
];

export default function CoursPumpfoil() {
  return (
    <>
      <Helmet>
        <title>Initiation Pump Foil Hyères | Dock Start | École Almanarre Var</title>
        <meta name="description" content="Apprenez le pumpfoil à Hyères. Volez sur l'eau sans vent ! Cours dock start, progression rapide, bateau assistance. 50€ la séance." />
        <meta name="keywords" content="pumpfoil hyères, cours pumpfoil var, dock start hyères, foil sans vent, école pumpfoil almanarre" />
        <link rel="canonical" href="https://kitesurfpassion.com/cours-pumpfoil-dock-start-hyeres" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Initiation Pump Foil",
            "description": "Cours de pumpfoil à Hyères - Apprenez à voler sur l'eau sans vent",
            "provider": {
              "@type": "Organization",
              "name": "KiteSurf Passion",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "52 Avenue Général de Gaulle",
                "addressLocality": "Carqueiranne",
                "postalCode": "83320",
                "addressCountry": "FR"
              }
            },
            "offers": {
              "@type": "Offer",
              "price": "50",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock"
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Initiation Pumpfoil Dock Start - Hyères",
            "description": "Cours de pumpfoil à Hyères - Apprenez à voler sur l'eau sans vent avec la technique dock start. Séance de 1h30, 3 personnes maximum.",
            "image": "https://www.kitesurfpassion.com/assets/pumpfoil-hyeres-cours.jpg",
            "brand": {
              "@type": "Brand",
              "name": "KiteSurf Passion"
            },
            "offers": {
              "@type": "Offer",
              "price": "50",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "KiteSurf Passion"
              }
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageObject",
            "name": "Cours pumpfoil dock start Hyères",
            "description": "Initiation au pumpfoil avec technique dock start sur la presqu'île de Giens à Hyères - école KiteSurf Passion",
            "contentUrl": "https://www.kitesurfpassion.com/assets/pumpfoil-hyeres-cours.jpg",
            "thumbnailUrl": "https://www.kitesurfpassion.com/assets/pumpfoil-hyeres-cours.jpg",
            "creditText": "KiteSurf Passion",
            "copyrightNotice": "© KiteSurf Passion",
            "acquireLicensePage": "https://www.kitesurfpassion.com/contact-reservation-kitesurf-hyeres",
            "contentLocation": {
              "@type": "Place",
              "name": "Presqu'île de Giens, Hyères",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Hyères",
                "addressRegion": "Var",
                "addressCountry": "FR"
              }
            }
          })}
        </script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center pt-20">
          <div className="absolute inset-0">
            <img
              src={pumpfoilImage}
              alt="Cours Pumpfoil Hyères - Dock Start Pump Foil école KiteSurf Passion Var"
              loading="eager"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-transparent" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              <span className="inline-block text-sunset font-semibold mb-4">Nouveau Sport</span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
                Initiation{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean to-turquoise">
                  Pump Foil
                </span>{" "}
                à Hyères
              </h1>
              <p className="text-primary-foreground/90 text-lg sm:text-xl mb-8 max-w-xl">
                Volez sur l'eau sans vent ni vagues ! Découvrez le pumpfoil, le sport nautique fitness par excellence, avec notre méthode dock start.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" variant="sunset">
                  <Link to="/contact-reservation-kitesurf-hyeres">
                    Réserver une Séance
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="hero">
                  <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">
                    Voir les Tarifs
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Pourquoi Choisir le{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">
                  Pump Foil
                </span>{" "}
                ?
              </h2>
              <p className="text-muted-foreground text-lg">
                Le pumpfoil combine sensations de glisse et workout complet, accessible à tous les niveaux.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-card p-6 rounded-2xl border border-border hover:border-ocean/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-ocean/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-ocean" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Nos Formules Pump Foil
              </h2>
              <p className="text-muted-foreground text-lg">
                Des formules adaptées à votre niveau et vos objectifs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricing.map((plan, index) => (
                <div
                  key={index}
                  className={`bg-card p-8 rounded-3xl border-2 transition-all duration-300 hover:-translate-y-2 ${
                    plan.popular
                      ? "border-sunset shadow-xl shadow-sunset/10"
                      : "border-border hover:border-ocean/30"
                  }`}
                >
                  {plan.popular && (
                    <span className="inline-block bg-sunset text-accent-foreground text-sm font-bold px-3 py-1 rounded-full mb-4">
                      Populaire
                    </span>
                  )}
                  <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground mb-4">{plan.duration}</p>
                  <p className="font-display text-4xl font-bold text-sunset mb-4">
                    {plan.price}
                  </p>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  <Button asChild className="w-full" variant={plan.popular ? "sunset" : "outline"}>
                    <Link to="/contact-reservation-kitesurf-hyeres">
                      Réserver
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Ce Qui Est Inclus
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Tout le matériel et l'encadrement nécessaires pour une séance réussie et en toute sécurité.
                </p>
                <ul className="space-y-4">
                  {includes.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-ocean/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-ocean" />
                      </div>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <img
                  src={pumpfoilInitiation}
                  alt="Séance initiation pumpfoil dock start Hyères Almanarre Var - Moniteur école KiteSurf Passion"
                  className="rounded-3xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Related Activities */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Découvrez Aussi
              </h2>
              <p className="text-muted-foreground">Nos autres activités de glisse à Hyères</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                to="/stage-kitesurf-100-glisse-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-ocean/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-ocean transition-colors">Stage Kitesurf</h3>
                <p className="text-muted-foreground text-sm mb-3">5 jours pour l'autonomie</p>
                <span className="text-ocean text-sm font-medium">Dès 399€ →</span>
              </Link>
              <Link 
                to="/stage-wingfoil-hyeres-almanarre"
                className="bg-card border border-border rounded-2xl p-6 hover:border-ocean/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-ocean transition-colors">Stage Wing Foil</h3>
                <p className="text-muted-foreground text-sm mb-3">Volez sur l'eau</p>
                <span className="text-ocean text-sm font-medium">Dès 90€ →</span>
              </Link>
              <Link 
                to="/foil-tracte-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-ocean/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-ocean transition-colors">Foil Tracté</h3>
                <p className="text-muted-foreground text-sm mb-3">Apprenez à voler</p>
                <span className="text-ocean text-sm font-medium">Dès 50€ →</span>
              </Link>
            </div>
          </div>
        </section>

        <CTASection />
      </main>

      <Footer />
    </>
  );
}
