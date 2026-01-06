import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import wingfoilImage from "@/assets/wingfoil-hyeres.jpg";

const breadcrumbItems = [
  { label: "Stage Wing Foil" }
];

const StageWingfoil = () => {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Le wingfoil est-il plus facile que le kitesurf ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, le wingfoil est généralement plus accessible que le kitesurf. Il n'y a pas de lignes à gérer, l'aile se tient à la main et la progression est souvent plus rapide pour les débutants.",
        },
      },
      {
        "@type": "Question",
        name: "Quel vent faut-il pour faire du wingfoil ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le wingfoil se pratique dès 12 nœuds de vent, soit moins que le kitesurf. C'est un avantage majeur qui permet de naviguer plus souvent à l'Almanarre.",
        },
      },
      {
        "@type": "Question",
        name: "Combien coûte un stage de wingfoil à Hyères ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Notre stage initiation wingfoil 5 jours est à 440€ hors saison (520€ en juillet/août). Il comprend 4 leçons de 2h30 plus une session de foil tracté de 40 minutes.",
        },
      },
      {
        "@type": "Question",
        name: "Faut-il savoir faire du kitesurf avant le wingfoil ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Non, le wingfoil est une discipline indépendante. Vous pouvez débuter directement en wingfoil sans expérience préalable en kitesurf ou autres sports de glisse.",
        },
      },
    ],
  };

  const courseStructuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Stage Wing Foil Initiation",
    description: "Stage de wingfoil pour débutants à Hyères, sport tendance accessible à tous",
    provider: {
      "@type": "Organization",
      name: "KiteSurf Passion",
      sameAs: "https://www.kitesurfpassion.com",
    },
    offers: {
      "@type": "Offer",
      price: "440",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  };

  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Stage Wingfoil Initiation - Hyères",
    description: "Stage de wingfoil 5 jours pour débutants à l'Almanarre, Hyères. Sport tendance accessible à tous avec foil tracté inclus.",
    image: "https://www.kitesurfpassion.com/assets/wingfoil-hyeres.jpg",
    brand: {
      "@type": "Brand",
      name: "KiteSurf Passion"
    },
    offers: {
      "@type": "Offer",
      price: "440",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "KiteSurf Passion"
      }
    }
  };

  const imageStructuredData = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: "Stage wingfoil Hyères Almanarre",
    description: "Cours de wingfoil sur le spot de l'Almanarre à Hyères - école KiteSurf Passion Var",
    contentUrl: "https://www.kitesurfpassion.com/assets/wingfoil-hyeres.jpg",
    thumbnailUrl: "https://www.kitesurfpassion.com/assets/wingfoil-hyeres.jpg",
    creditText: "KiteSurf Passion",
    copyrightNotice: "© KiteSurf Passion",
    acquireLicensePage: "https://www.kitesurfpassion.com/contact-reservation-kitesurf-hyeres",
    contentLocation: {
      "@type": "Place",
      name: "Plage de l'Almanarre, Hyères",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Hyères",
        addressRegion: "Var",
        addressCountry: "FR",
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>Stage Wing Foil Hyères | Cours Wingfoil Almanarre | KiteSurf Passion</title>
        <meta
          name="description"
          content="Découvrez le wingfoil à Hyères. Sport tendance 2024, plus accessible que le kite. Cours avec bateau assistance, spot Almanarre parfait."
        />
        <link rel="canonical" href="https://www.kitesurfpassion.com/stage-wingfoil-hyeres-almanarre" />
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(courseStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(productStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(imageStructuredData)}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={wingfoilImage}
              alt="Stage wingfoil Hyères Almanarre - Cours wing foil école KiteSurf Passion Var"
              loading="eager"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-navy/20" />
          </div>

          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-2xl">
              <span className="inline-block text-sunset font-semibold mb-4">Wing Foil</span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
                Stage Wing Foil à l'Almanarre
              </h1>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Le sport de glisse tendance ! Plus accessible que le kitesurf, le wingfoil vous offre des sensations uniques de vol sur l'eau.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="sunset" size="lg" asChild>
                  <Link to="/contact-reservation-kitesurf-hyeres">
                    Réserver un Cours
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">
                Pourquoi choisir le Wing Foil ?
              </h2>
              
              <div className="prose prose-lg text-muted-foreground mb-12">
                <p>
                  Le wingfoil est LA discipline qui révolutionne les sports de glisse. Avec une aile tenue à la main et un foil sous la planche, vous volez littéralement au-dessus de l'eau. Silencieux, écologique et accessible dès les premières séances.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {[
                  "Plus accessible que le kitesurf",
                  "Pas de lignes à gérer",
                  "Sensations de vol uniques",
                  "Praticable avec peu de vent",
                  "Silencieux et écologique",
                  "Progression rapide",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              {/* Tarifs */}
              <div className="bg-card rounded-3xl p-8 border border-border/50">
                <h3 className="font-display text-2xl font-bold text-foreground mb-6">Nos Formules Wing Foil</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <div>
                      <span className="font-semibold text-foreground">Stage Initiation 5 jours</span>
                      <p className="text-muted-foreground text-sm">4 leçons de 2h30 + simulateur foil tracté 40min</p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-2xl font-bold text-foreground">440€</span>
                      <p className="text-primary text-xs">Hors saison (520€ juil./août)</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <div>
                      <span className="font-semibold text-foreground">Cours 2h30</span>
                      <p className="text-muted-foreground text-sm">Séance à la carte</p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-2xl font-bold text-foreground">90€</span>
                      <p className="text-primary text-xs">Hors saison (110€ juil./août)</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <div>
                      <span className="font-semibold text-foreground">Foil Tracté 40 min</span>
                      <p className="text-muted-foreground text-sm">Simulateur de foil</p>
                    </div>
                    <span className="font-display text-2xl font-bold text-foreground">80€</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4">
                    <div>
                      <span className="font-semibold text-foreground">Foil Tracté 20 min</span>
                      <p className="text-muted-foreground text-sm">Découverte simulateur</p>
                    </div>
                    <span className="font-display text-2xl font-bold text-foreground">50€</span>
                  </div>
                </div>

                <Button variant="sunset" size="lg" className="w-full mt-8" asChild>
                  <Link to="/contact-reservation-kitesurf-hyeres">Réserver mon Stage</Link>
                </Button>
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
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stage Kitesurf</h3>
                <p className="text-muted-foreground text-sm mb-3">5 jours pour l'autonomie</p>
                <span className="text-primary text-sm font-medium">Dès 399€ →</span>
              </Link>
              <Link 
                to="/cours-pumpfoil-dock-start-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Initiation Pump Foil</h3>
                <p className="text-muted-foreground text-sm mb-3">Sans vent, sans vagues</p>
                <span className="text-primary text-sm font-medium">50€ →</span>
              </Link>
              <Link 
                to="/foil-tracte-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Foil Tracté</h3>
                <p className="text-muted-foreground text-sm mb-3">Apprenez à voler</p>
                <span className="text-primary text-sm font-medium">Dès 50€ →</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default StageWingfoil;
