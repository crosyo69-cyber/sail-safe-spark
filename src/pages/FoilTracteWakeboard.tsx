import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check, Anchor, Shield, Waves, Users, Phone, Zap, Heart } from "lucide-react";
import { Link } from "react-router-dom";

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

const wakeboardPrices = [
  { 
    name: "Session 15 min", 
    description: "Session wakeboard tractée",
    price: "40€",
    features: ["Sensations garanties", "Tous niveaux", "Matériel inclus"]
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

const wakeboardBenefits = [
  {
    icon: Heart,
    title: "Activité ludique",
    description: "Fun et accessible, parfait pour tous les âges"
  },
  {
    icon: Waves,
    title: "Sensations de glisse",
    description: "Profitez de la baie d'Hyères en toute liberté"
  },
  {
    icon: Shield,
    title: "Encadrement pro",
    description: "Moniteur expérimenté pour votre sécurité"
  },
];

const FoilTracteWakeboard = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "name": "Foil Tracté & Wakeboard - KiteSurf Passion Hyères",
    "description": "Sessions de foil tracté et wakeboard sur la baie d'Hyères. Découvrez les sensations du foil et du wakeboard avec notre bateau et moniteur diplômé.",
    "url": "https://www.kitesurfpassion.com/foil-tracte-wakeboard-hyeres",
    "telephone": "+33672716905",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Hyères",
      "addressRegion": "Var",
      "postalCode": "83400",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 43.0817,
      "longitude": 6.1366
    },
    "priceRange": "40€ - 80€",
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": 43.0817,
        "longitude": 6.1366
      },
      "geoRadius": "10000"
    }
  };

  return (
    <>
      <Helmet>
        <title>Foil Tracté & Wakeboard Hyères | Session Bateau Baie d'Hyères</title>
        <meta 
          name="description" 
          content="Découvrez le foil tracté et le wakeboard sur la baie d'Hyères. Sessions encadrées par moniteur diplômé, bateau sécurisé. Sensations garanties dès 40€ !" 
        />
        <meta name="keywords" content="foil tracté Hyères, foil tracté bateau Hyères, wakeboard Hyères, wakeboard baie d'Hyères, activités nautiques Hyères" />
        <link rel="canonical" href="https://www.kitesurfpassion.com/foil-tracte-wakeboard-hyeres" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Header />

      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
              Foil Tracté &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">
                Wakeboard
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Découvrez les sensations uniques du foil tracté et du wakeboard sur la baie d'Hyères. 
              Sessions encadrées par notre moniteur diplômé avec bateau sécurisé.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="sunset" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  <Anchor className="w-5 h-5 mr-2" />
                  Réserver une Session
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
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
                Foil Tracté
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

            {/* Foil Prices */}
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

        {/* Wakeboard Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-sunset/10 text-sunset rounded-full text-sm font-medium mb-4">
                Glisse Tractée
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Wakeboard
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Le wakeboard est une activité ludique et accessible à tous. 
                Profitez de la magnifique baie d'Hyères pour des sessions de glisse inoubliables.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {wakeboardBenefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="bg-card p-6 rounded-2xl border border-border hover:border-sunset/30 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-sunset/10 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-sunset" />
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

            {/* Wakeboard Price */}
            <div className="max-w-sm mx-auto">
              {wakeboardPrices.map((item, index) => (
                <div 
                  key={index}
                  className="bg-card p-6 rounded-2xl border border-border hover:border-sunset/30 transition-all duration-300 hover:shadow-xl"
                >
                  <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                  <div className="text-3xl font-bold text-sunset mb-4">{item.price}</div>
                  <ul className="space-y-2">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-sunset flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Activité Complémentaire */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-primary/5 to-turquoise/5 rounded-3xl p-8 md:p-12 border border-primary/10">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Activités Complémentaires au Kitesurf
                </h2>
                <p className="text-muted-foreground mb-6">
                  Le foil tracté et le wakeboard sont des activités parfaites pour compléter votre pratique du kitesurf. 
                  Découvrez de nouvelles sensations ou initiez vos proches à la glisse nautique !
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/cours-kitesurf-hyeres-debutant">
                    <Button variant="outline" size="lg">
                      Découvrir le Kitesurf
                    </Button>
                  </Link>
                  <Link to="/stage-wingfoil-hyeres-almanarre">
                    <Button variant="outline" size="lg">
                      Stages Wing Foil
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-navy via-primary/90 to-turquoise text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Prêt à Vivre l'Expérience ?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Réservez votre session de foil tracté ou de wakeboard dès maintenant. 
              Sensations garanties sur la magnifique baie d'Hyères !
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

export default FoilTracteWakeboard;
