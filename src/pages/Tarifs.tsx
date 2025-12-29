import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check, Gift } from "lucide-react";
import { Link } from "react-router-dom";

const pricingData = {
  kitesurf: [
    { name: "Stage 100% Glisse", sessions: "5 jours consécutifs", price: "399€", note: "Hors saison", popular: true },
    { name: "Stage 100% Glisse", sessions: "5 jours consécutifs", price: "499€", note: "Juillet/Août" },
    { name: "Stage Semi-Privé (2 pers.)", sessions: "5 jours", price: "599€", note: "Hors saison" },
    { name: "Stage Semi-Privé (2 pers.)", sessions: "5 jours", price: "699€", note: "Juillet/Août" },
    { name: "1 Session Groupe", sessions: "1 séance", price: "120€", note: "Hors saison" },
    { name: "1 Session Groupe", sessions: "1 séance", price: "130€", note: "Juillet/Août" },
    { name: "3 Sessions Groupe", sessions: "3 séances", price: "330€", note: "Hors saison" },
    { name: "3 Sessions Groupe", sessions: "3 séances", price: "360€", note: "Juillet/Août" },
    { name: "5 Sessions Groupe", sessions: "5 séances", price: "500€", note: "Hors saison" },
    { name: "5 Sessions Groupe", sessions: "5 séances", price: "570€", note: "Juillet/Août" },
    { name: "Cours Particulier", sessions: "2 heures", price: "230€", note: "Hors saison" },
    { name: "Cours Particulier", sessions: "2 heures", price: "380€", note: "Juillet/Août" },
  ],
  wingfoil: [
    { name: "Stage Initiation", sessions: "5 jours", price: "440€", note: "Hors saison", popular: true },
    { name: "Stage Initiation", sessions: "5 jours", price: "520€", note: "Juillet/Août" },
    { name: "Cours 2h30", sessions: "1 séance", price: "90€", note: "Hors saison" },
    { name: "Cours 2h30", sessions: "1 séance", price: "110€", note: "Juillet/Août" },
    { name: "Foil Tracté 20 min", sessions: "Simulateur", price: "50€" },
    { name: "Foil Tracté 40 min", sessions: "Simulateur", price: "80€" },
  ],
  pumpfoil: [
    { name: "Pump Foil / Dock Start", sessions: "1h30 (3 pers. max)", price: "50€", popular: true },
  ],
  foilWakeboard: [
    { name: "Foil Tracté 20 min", sessions: "Simulateur", price: "50€" },
    { name: "Foil Tracté 40 min", sessions: "Simulateur", price: "80€", popular: true },
    { name: "Wakeboard 15 min", sessions: "Session tractée", price: "40€" },
  ],
  deposesMer: [
    { name: "Dépose en Mer", sessions: "1 dépose", price: "45€" },
    { name: "Location + Dépose", sessions: "Matériel complet", price: "80€", popular: true },
    { name: "Carnet 10 Déposes", sessions: "10 déposes", price: "300€" },
  ],
  location: [
    { name: "Aile de Kitesurf", sessions: "À la journée", price: "30€" },
    { name: "Foil", sessions: "À la journée", price: "20€" },
    { name: "Planche Twin Tip", sessions: "À la journée", price: "10€" },
    { name: "Combinaison 5/3", sessions: "À la journée", price: "10€" },
    { name: "Harnais", sessions: "À la journée", price: "5€" },
    { name: "Casque", sessions: "À la journée", price: "3€" },
    { name: "Gilet", sessions: "À la journée", price: "2€" },
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {pricingData.kitesurf.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className={`bg-card rounded-2xl p-5 border ${
                    item.popular ? "border-primary shadow-glow" : "border-border/50"
                  } relative`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                      Populaire
                    </span>
                  )}
                  <h3 className="font-display font-bold text-foreground mb-1 text-sm">{item.name}</h3>
                  <p className="text-muted-foreground text-xs mb-2">{item.sessions}</p>
                  {item.note && <p className="text-primary text-xs mb-2">{item.note}</p>}
                  <p className="font-display text-2xl font-bold text-foreground">{item.price}</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {pricingData.wingfoil.map((item, index) => (
                <div 
                  key={`${item.name}-${index}`} 
                  className={`bg-card rounded-2xl p-5 border ${
                    item.popular ? "border-sunset shadow-lg" : "border-border/50"
                  } relative`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sunset text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                      Populaire
                    </span>
                  )}
                  <h3 className="font-display font-bold text-foreground mb-1 text-sm">{item.name}</h3>
                  <p className="text-muted-foreground text-xs mb-2">{item.sessions}</p>
                  {item.note && <p className="text-sunset text-xs mb-2">{item.note}</p>}
                  <p className="font-display text-2xl font-bold text-foreground">{item.price}</p>
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

            <div className="max-w-md mx-auto">
              {pricingData.pumpfoil.map((item, index) => (
                <div 
                  key={`${item.name}-${index}`} 
                  className={`bg-card rounded-2xl p-6 border ${
                    item.popular ? "border-primary shadow-glow" : "border-border/50"
                  } relative`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                      Recommandé
                    </span>
                  )}
                  <h3 className="font-display font-bold text-foreground mb-2">{item.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{item.sessions}</p>
                  <p className="font-display text-3xl font-bold text-foreground">{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Foil Tracté & Wakeboard */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean to-turquoise">Foil Tracté & Wakeboard</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {pricingData.foilWakeboard.map((item, index) => (
                <div 
                  key={`${item.name}-${index}`} 
                  className={`bg-card rounded-2xl p-5 border ${
                    item.popular ? "border-ocean shadow-lg" : "border-border/50"
                  } relative`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ocean text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                      Recommandé
                    </span>
                  )}
                  <h3 className="font-display font-bold text-foreground mb-1 text-sm">{item.name}</h3>
                  <p className="text-muted-foreground text-xs mb-2">{item.sessions}</p>
                  <p className="font-display text-2xl font-bold text-foreground">{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Déposes en Mer */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-ocean">Déposes en Mer</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {pricingData.deposesMer.map((item, index) => (
                <div 
                  key={`${item.name}-${index}`} 
                  className={`bg-card rounded-2xl p-5 border ${
                    item.popular ? "border-primary shadow-glow" : "border-border/50"
                  } relative`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                      Populaire
                    </span>
                  )}
                  <h3 className="font-display font-bold text-foreground mb-1 text-sm">{item.name}</h3>
                  <p className="text-muted-foreground text-xs mb-2">{item.sessions}</p>
                  <p className="font-display text-2xl font-bold text-foreground">{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Location Matériel */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">Location Matériel</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 max-w-5xl mx-auto">
              {pricingData.location.map((item, index) => (
                <div key={`${item.name}-${index}`} className="bg-card rounded-xl p-4 border border-border/50 text-center">
                  <h3 className="font-display font-bold text-foreground text-xs mb-1">{item.name}</h3>
                  <p className="font-display text-xl font-bold text-sunset">{item.price}</p>
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
