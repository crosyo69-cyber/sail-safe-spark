import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Check, Anchor, Shield, Waves, Heart, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import wakeboardHero from "@/assets/wakeboard-hyeres.jpg";

const breadcrumbItems = [
  { label: "Kitesurf", href: "/cours-kitesurf-hyeres-debutant" },
  { label: "Wakeboard" }
];

const wakeboardPrices = [
  { 
    name: "Session 15 min", 
    description: "Session wakeboard tractée",
    price: "40€",
    features: ["Sensations garanties", "Tous niveaux", "Matériel inclus"]
  },
];

const wakeboardBenefits = [
  {
    icon: Heart,
    title: "Activité ludique",
    description: "Fun et accessible, parfait pour tous les âges dès 8 ans"
  },
  {
    icon: Waves,
    title: "Sensations de glisse",
    description: "Profitez de la baie d'Hyères en toute liberté"
  },
  {
    icon: Shield,
    title: "Encadrement pro",
    description: "Moniteur expérimenté pour votre sécurité et progression"
  },
];

const Wakeboard = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Wakeboard Hyères - Session Glisse Tractée",
    "description": "Sessions de wakeboard sur la baie d'Hyères. Activité ludique et accessible à tous, encadrée par notre moniteur diplômé avec bateau sécurisé.",
    "url": "https://www.kitesurfpassion.com/wakeboard-hyeres",
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
      "@type": "Offer",
      "price": "40",
      "priceCurrency": "EUR"
    }
  };

  return (
    <>
      <Helmet>
        <title>Wakeboard Hyères | Session Glisse Tractée - Baie d'Hyères</title>
        <meta 
          name="description" 
          content="Sessions de wakeboard à Hyères : glisse tractée fun et accessible. 15 min de sensations sur la baie d'Hyères avec bateau et moniteur. 40€ la session !" 
        />
        <meta name="keywords" content="wakeboard Hyères, wakeboard baie d'Hyères, wakeboard bateau Hyères, glisse tractée Var, activité nautique Hyères" />
        <link rel="canonical" href="https://www.kitesurfpassion.com/wakeboard-hyeres" />
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
              src={wakeboardHero}
              alt="Session de wakeboard sur la baie d'Hyères avec bateau de traction"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
          </div>

          <div className="container mx-auto px-4 text-center relative z-10 pt-32 pb-16">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6 drop-shadow-lg">
              Wakeboard{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-primary-foreground">
                Hyères
              </span>
            </h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8 drop-shadow-md">
              Découvrez les sensations de la glisse tractée sur la baie d'Hyères. 
              Une activité fun et accessible à tous, encadrée par notre moniteur diplômé.
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

        {/* Wakeboard Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-sunset/10 text-sunset rounded-full text-sm font-medium mb-4">
                Glisse Tractée
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Fun et Sensations Garanties
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

            {/* Price */}
            <div className="max-w-sm mx-auto">
              {wakeboardPrices.map((item, index) => (
                <div 
                  key={index}
                  className="bg-card p-6 rounded-2xl border border-sunset/30 transition-all duration-300 hover:shadow-xl shadow-lg"
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

        {/* Passerelle vers Kitesurf */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-sunset/5 to-primary/5 rounded-3xl p-8 md:p-12 border border-sunset/10">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Envie de Plus de Sensations ?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Le wakeboard vous a donné le goût de la glisse ? 
                  Découvrez le kitesurf et ses sensations incomparables avec nos stages adaptés à tous les niveaux !
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/stage-kitesurf-100-glisse-hyeres">
                    <Button variant="sunset" size="lg">
                      Stage Kitesurf 100% Glisse
                    </Button>
                  </Link>
                  <Link to="/cours-kitesurf-hyeres-debutant">
                    <Button variant="outline" size="lg">
                      Tous les Cours Kitesurf
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
                to="/stage-kitesurf-100-glisse-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stage Kitesurf</h3>
                <p className="text-muted-foreground text-sm mb-3">5 jours pour l'autonomie</p>
                <span className="text-primary text-sm font-medium">Dès 399€ →</span>
              </Link>
              <Link 
                to="/foil-tracte-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Foil Tracté</h3>
                <p className="text-muted-foreground text-sm mb-3">Apprenez à voler</p>
                <span className="text-primary text-sm font-medium">Dès 50€ →</span>
              </Link>
              <Link 
                to="/stage-wingfoil-hyeres-almanarre"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stage Wing Foil</h3>
                <p className="text-muted-foreground text-sm mb-3">Volez sur l'eau</p>
                <span className="text-primary text-sm font-medium">Dès 90€ →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-sunset via-sunset/90 to-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Prêt pour la Glisse ?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Réservez votre session de wakeboard et vivez des sensations inoubliables 
              sur la magnifique baie d'Hyères !
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

export default Wakeboard;
