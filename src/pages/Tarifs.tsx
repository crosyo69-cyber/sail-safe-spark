import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check, Gift } from "lucide-react";
import { Link } from "react-router-dom";

const pricingData = {
  kitesurf: [
    { name: "Stage Découverte", sessions: "2 séances (6h)", price: "150€" },
    { name: "Stage Autonomie", sessions: "5 séances (15h)", price: "350€", popular: true },
    { name: "Cours Privé", sessions: "1 séance (3h)", price: "180€" },
    { name: "Perfectionnement", sessions: "1 séance (3h)", price: "90€" },
  ],
  wingfoil: [
    { name: "Cours Découverte", sessions: "1 séance (2h)", price: "120€" },
    { name: "Stage 3 Séances", sessions: "3 séances (6h)", price: "320€" },
    { name: "Cours Privé", sessions: "1 séance (2h)", price: "180€" },
  ],
  pumpfoil: [
    { name: "Initiation", sessions: "1 séance (1h30)", price: "90€" },
    { name: "Pack 3 Séances", sessions: "3 séances (4h30)", price: "240€" },
  ],
};

const included = [
  "Tout le matériel fourni (aile, planche, combinaison, casque, gilet)",
  "Bateau d'assistance permanent",
  "Assurance responsabilité civile",
  "Moniteur diplômé d'État BPJEPS",
  "Photos de vos sessions (sur demande)",
];

const Tarifs = () => {
  return (
    <>
      <Helmet>
        <title>Tarifs Cours Kitesurf & Wingfoil Hyères | Prix École Almanarre</title>
        <meta
          name="description"
          content="Découvrez nos tarifs transparents pour cours de kitesurf, wingfoil et pumpfoil à Hyères. Stage dès 350€. Devis gratuit sous 24h."
        />
        <link rel="canonical" href="https://www.kitesurfpassion.com/tarifs-cours-kitesurf-wingfoil-hyeres" />
      </Helmet>

      <Header />

      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
              Nos Tarifs
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Transparence totale sur nos prix. Tout le matériel et le bateau d'assistance sont inclus.
            </p>
          </div>
        </section>

        {/* Kitesurf */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">Kitesurf</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {pricingData.kitesurf.map((item) => (
                <div
                  key={item.name}
                  className={`bg-card rounded-2xl p-6 border ${
                    item.popular ? "border-primary shadow-glow" : "border-border/50"
                  } relative`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                      Populaire
                    </span>
                  )}
                  <h3 className="font-display font-bold text-foreground mb-2">{item.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{item.sessions}</p>
                  <p className="font-display text-3xl font-bold text-foreground">{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wingfoil */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">Wing Foil</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {pricingData.wingfoil.map((item) => (
                <div key={item.name} className="bg-card rounded-2xl p-6 border border-border/50">
                  <h3 className="font-display font-bold text-foreground mb-2">{item.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{item.sessions}</p>
                  <p className="font-display text-3xl font-bold text-foreground">{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pumpfoil */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-turquoise to-primary">Pump Foil</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {pricingData.pumpfoil.map((item) => (
                <div key={item.name} className="bg-card rounded-2xl p-6 border border-border/50">
                  <h3 className="font-display font-bold text-foreground mb-2">{item.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{item.sessions}</p>
                  <p className="font-display text-3xl font-bold text-foreground">{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ce qui est inclus */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
                Toujours Inclus
              </h2>

              <div className="bg-card rounded-3xl p-8 border border-border/50">
                <ul className="space-y-4">
                  {included.map((item) => (
                    <li key={item} className="flex items-center gap-4">
                      <Check className="w-6 h-6 text-primary flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Bons cadeaux */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sunset/10 rounded-2xl mb-6">
                <Gift className="w-8 h-8 text-sunset" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Offrez un Bon Cadeau
              </h2>
              <p className="text-muted-foreground mb-8">
                Valable 1 an, toutes activités. À partir de 90€.
              </p>
              <Button variant="sunset" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Commander un Bon Cadeau</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
              Prêt à Réserver ?
            </h2>
            <p className="mb-8 text-primary-foreground/80">
              Contactez-nous pour réserver votre créneau ou obtenir un devis personnalisé.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Réserver en Ligne</Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <a href="tel:0672716905">Appeler : 06 72 71 69 05</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Tarifs;
