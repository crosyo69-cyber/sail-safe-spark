import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Phone } from "lucide-react";

const ReservationConfirmee = () => {
  const [searchParams] = useSearchParams();
  const activity = searchParams.get("activity") || "votre activité";

  return (
    <>
      <Helmet>
        <title>Réservation Confirmée | KiteSurf Passion</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="min-h-screen flex items-center justify-center py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
              Réservation Confirmée !
            </h1>

            <div className="bg-card border border-border rounded-2xl p-8 mb-8 space-y-4 text-left">
              <p className="text-foreground text-lg font-semibold text-center">
                Votre acompte de 50€ a bien été reçu !
              </p>
              <p className="text-muted-foreground text-center">
                Votre réservation pour <strong className="text-foreground">{activity}</strong> est confirmée.
              </p>
              <p className="text-muted-foreground text-center">
                Le solde sera à régler le jour de votre cours.
              </p>

              <div className="border-t border-border pt-4 mt-4">
                <p className="text-foreground font-medium text-center">
                  Contactez-nous la veille de votre venue pour confirmer votre créneau :
                </p>
                <a
                  href="tel:0672716905"
                  className="flex items-center justify-center gap-2 mt-3 text-primary font-bold text-xl hover:underline"
                >
                  <Phone className="w-5 h-5" />
                  06 72 71 69 05
                </a>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="sunset" size="lg" asChild>
                <Link to="/">Retour à l'accueil</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Autre réservation</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ReservationConfirmee;
