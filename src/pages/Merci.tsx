import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle, Phone } from "lucide-react";
import { trackGoogleAdsConversion } from "@/lib/analytics";

const Merci = () => {
  useEffect(() => {
    trackGoogleAdsConversion();
  }, []);
  return (
    <>
      <Helmet>
        <title>Merci pour votre demande | KiteSurf Passion</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="min-h-screen flex items-center justify-center py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            {/* Logo */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-turquoise rounded-2xl flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-2xl">KP</span>
            </div>

            <div className="w-16 h-16 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
              Merci pour votre demande !
            </h1>

            <div className="bg-card border border-border rounded-2xl p-8 mb-8 space-y-4">
              <p className="text-foreground text-lg">
                Nous vous contactons sous <strong>24h</strong> pour confirmer votre réservation.
              </p>
              <p className="text-xl font-display font-semibold text-primary">
                À très vite sur l'eau ! 🪁
              </p>

              <div className="border-t border-border pt-4 mt-4">
                <p className="text-muted-foreground">
                  Besoin d'une réponse rapide ?
                </p>
                <a
                  href="tel:0672716905"
                  className="inline-flex items-center gap-2 mt-2 text-primary font-bold text-xl hover:underline"
                >
                  <Phone className="w-5 h-5" />
                  06 72 71 69 05
                </a>
              </div>
            </div>

            <Button variant="sunset" size="lg" asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Merci;
