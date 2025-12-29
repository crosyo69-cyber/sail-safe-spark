import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import wingfoilImage from "@/assets/wingfoil.jpg";

const StageWingfoil = () => {
  return (
    <>
      <Helmet>
        <title>Stage Wing Foil Hyères | Cours Wingfoil Almanarre | KiteSurf Passion</title>
        <meta
          name="description"
          content="Découvrez le wingfoil à Hyères. Sport tendance 2024, plus accessible que le kite. Cours avec bateau assistance, spot Almanarre parfait."
        />
        <link rel="canonical" href="https://www.kitesurfpassion.com/stage-wingfoil-hyeres-almanarre" />
      </Helmet>

      <Header />

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={wingfoilImage}
              alt="Stage wingfoil à Hyères - vol sur foil"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/90 to-navy/60" />
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
                      <span className="font-semibold text-foreground">Cours Découverte</span>
                      <p className="text-muted-foreground text-sm">2h - Initiation et premiers vols</p>
                    </div>
                    <span className="font-display text-2xl font-bold text-foreground">120€</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <div>
                      <span className="font-semibold text-foreground">Stage 3 Séances</span>
                      <p className="text-muted-foreground text-sm">6h - Vers l'autonomie</p>
                    </div>
                    <span className="font-display text-2xl font-bold text-foreground">320€</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4">
                    <div>
                      <span className="font-semibold text-foreground">Cours Privé</span>
                      <p className="text-muted-foreground text-sm">2h - Progression maximale</p>
                    </div>
                    <span className="font-display text-2xl font-bold text-foreground">180€</span>
                  </div>
                </div>

                <Button variant="sunset" size="lg" className="w-full mt-8" asChild>
                  <Link to="/contact-reservation-kitesurf-hyeres">Réserver mon Stage</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default StageWingfoil;
