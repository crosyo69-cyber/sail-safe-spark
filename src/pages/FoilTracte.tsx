import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Check, Anchor, Shield, Zap, Users, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import foilWakeboardHero from "@/assets/foil-wakeboard-hyeres.jpg";

const breadcrumbItems = [
  { label: "Wing Foil", href: "/stage-wingfoil-hyeres-almanarre" },
  { label: "Foil Tracté" }
];

const foilPrices = [
  { 
    name: "Session 20 min", 
    description: "Découverte du foil tracté",
    price: "50€",
    features: ["Initiation au foil", "Encadrement moniteur", "Matériel fourni"]
  },
  { 
    name: "Session 40 min", 
    description: "Apprentissage complet",
    price: "80€",
    popular: true,
    features: ["Temps de pratique optimal", "Progression assurée", "Conseils personnalisés"]
  },
];

const foilBenefits = [
  {
    icon: Shield,
    title: "Sécurité maximale",
    description: "Apprentissage sécurisé avec notre bateau et moniteur diplômé"
  },
  {
    icon: Zap,
    title: "Sensations uniques",
    description: "Découvrez la sensation de voler au-dessus de l'eau"
  },
  {
    icon: Users,
    title: "Accessible à tous",
    description: "Aucun prérequis, idéal pour débuter le foil"
  },
];

const FoilTracte = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Foil Tracté Hyères - Initiation au vol sur l'eau",
    "description": "Sessions de foil tracté sur la baie d'Hyères. Découvrez les sensations du foil en toute sécurité, tracté par notre bateau avec moniteur diplômé.",
    "url": "https://www.kitesurfpassion.com/foil-tracte-hyeres",
    "provider": {
      "@type": "LocalBusiness",
      "name": "KiteSurf Passion",
      "telephone": "+33672716905",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Hyères",
        "addressRegion": "Var",
        "postalCode": "83400",
        "addressCountry": "FR"
      }
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "50",
      "highPrice": "80",
      "priceCurrency": "EUR"
    }
  };

  return (
    <>
      <Helmet>
        <title>Foil Tracté Hyères | Initiation Vol sur l'Eau - Baie d'Hyères</title>
        <meta 
          name="description" 
          content="Découvrez le foil tracté à Hyères : apprenez à voler sur l'eau en toute sécurité. Sessions de 20 à 40 min avec bateau et moniteur diplômé. Dès 50€ !" 
        />
        <meta name="keywords" content="foil tracté Hyères, foil tracté bateau, initiation foil Hyères, apprendre foil bateau, foil débutant Var" />
        <link rel="canonical" href="https://www.kitesurfpassion.com/foil-tracte-hyeres" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={foilWakeboardHero}
              alt="Session de foil tracté sur la baie d'Hyères avec bateau de traction"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
          </div>

          <div className="container mx-auto px-4 text-center relative z-10 pt-32 pb-16">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6 drop-shadow-lg">
              Foil Tracté{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-turquoise to-primary-foreground">
                Hyères
              </span>
            </h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8 drop-shadow-md">
              Découvrez les sensations uniques du foil tracté sur la baie d'Hyères. 
              La méthode idéale pour apprendre à voler sur l'eau en toute sécurité.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  <Anchor className="w-5 h-5 mr-2" />
                  Réserver une Session
                </Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <a href="tel:0672716905">
                  <Phone className="w-5 h-5 mr-2" />
                  06 72 71 69 05
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Foil Tracté Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Simulateur de Foil
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Apprenez à Voler sur l'Eau
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Le foil tracté est la méthode idéale pour découvrir les sensations du foil en toute sécurité. 
                Tracté par notre bateau, apprenez l'équilibre et la position sans les contraintes du vent.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {foilBenefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Prices */}
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {foilPrices.map((item, index) => (
                <div 
                  key={index}
                  className={`relative bg-card p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                    item.popular 
                      ? "border-primary shadow-lg shadow-primary/10" 
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  {item.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-primary to-turquoise text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                        Recommandé
                      </span>
                    </div>
                  )}
                  <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                  <div className="text-3xl font-bold text-primary mb-4">{item.price}</div>
                  <ul className="space-y-2">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Passerelle vers Wingfoil */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-primary/5 to-turquoise/5 rounded-3xl p-8 md:p-12 border border-primary/10">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Prêt pour le Wing Foil ?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Le foil tracté est une excellente préparation au wing foil. 
                  Une fois à l'aise avec l'équilibre sur le foil, passez à l'étape supérieure avec nos stages wing foil !
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/stage-wingfoil-hyeres-almanarre">
                    <Button variant="default" size="lg">
                      Stages Wing Foil
                    </Button>
                  </Link>
                  <Link to="/cours-pumpfoil-dock-start-hyeres">
                    <Button variant="outline" size="lg">
                      Initiation Pump Foil
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Activities */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Découvrez Aussi
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                to="/stage-wingfoil-hyeres-almanarre"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stage Wing Foil</h3>
                <p className="text-muted-foreground text-sm mb-3">Volez sur l'eau en autonomie</p>
                <span className="text-primary text-sm font-medium">Dès 90€ →</span>
              </Link>
              <Link 
                to="/wakeboard-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Wakeboard</h3>
                <p className="text-muted-foreground text-sm mb-3">Glisse tractée fun</p>
                <span className="text-primary text-sm font-medium">40€ →</span>
              </Link>
              <Link 
                to="/cours-pumpfoil-dock-start-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Initiation Pump Foil</h3>
                <p className="text-muted-foreground text-sm mb-3">Sans vent, sans vagues</p>
                <span className="text-primary text-sm font-medium">50€ →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-navy via-primary/90 to-turquoise text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Prêt à Voler sur l'Eau ?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Réservez votre session de foil tracté et découvrez les sensations uniques 
              du vol sur la magnifique baie d'Hyères !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  <Anchor className="w-5 h-5 mr-2" />
                  Réserver une Session
                </Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <a href="tel:0672716905">
                  <Phone className="w-5 h-5 mr-2" />
                  06 72 71 69 05
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default FoilTracte;
