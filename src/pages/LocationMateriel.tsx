import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check, Shield, RefreshCw, Users, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const rentalPrices = [
  { name: "Location Demi-Journée", duration: "3 heures", price: "60€", description: "Idéal pour une session rapide" },
  { name: "Location Journée", duration: "Journée complète", price: "90€", popular: true, description: "Profitez du spot toute la journée" },
  { name: "Location Week-end", duration: "2 jours", price: "150€", description: "Un week-end de glisse intensif" },
  { name: "Location Semaine", duration: "7 jours", price: "350€", description: "Pour les séjours prolongés" },
];

const equipmentIncluded = [
  "Aile de kitesurf (différentes tailles selon conditions)",
  "Planche twintip ou directionnelle",
  "Barre de contrôle et lignes",
  "Harnais ceinture ou culotte",
  "Combinaison néoprène adaptée à la saison",
  "Gilet de flottaison et casque",
];

const advantages = [
  {
    icon: RefreshCw,
    title: "Matériel Récent",
    description: "Notre flotte est renouvelée régulièrement pour vous garantir des équipements performants et en parfait état.",
  },
  {
    icon: Shield,
    title: "Sécurité Maximale",
    description: "Tout le matériel est vérifié avant chaque location. Briefing sécurité obligatoire pour les primo-locataires.",
  },
  {
    icon: Users,
    title: "Accompagnement",
    description: "Notre équipe vous conseille sur le choix du matériel adapté à votre niveau et aux conditions du jour.",
  },
];

const LocationMateriel = () => {
  return (
    <>
      <Helmet>
        <title>Location Matériel Kitesurf Hyères | Louer Équipement Almanarre & Giens</title>
        <meta
          name="description"
          content="Location de matériel kitesurf à Hyères : ailes, planches, harnais. Équipement récent à l'Almanarre et Giens. Réservez votre matériel dès 60€/demi-journée."
        />
        <meta
          name="keywords"
          content="location matériel kitesurf Hyères, location kitesurf Almanarre, louer matériel kitesurf Giens, location équipement kitesurf Var"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.com/location-materiel-kitesurf-hyeres" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Location Matériel Kitesurf",
            "description": "Location de matériel de kitesurf à Hyères - Ailes, planches, harnais et équipements complets",
            "brand": {
              "@type": "Brand",
              "name": "KiteSurf Passion"
            },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "60",
              "highPrice": "350",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock"
            },
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
            }
          })}
        </script>
      </Helmet>

      <Header />

      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
              Location de Matériel{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">
                Kitesurf
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Louez du matériel récent et performant pour vos sessions à l'Almanarre. 
              Équipement vérifié, conseils personnalisés et accompagnement inclus.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="sunset" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Réserver du Matériel</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="tel:0672716905">
                  <Phone className="w-4 h-4 mr-2" />
                  06 72 71 69 05
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Conditions */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
                Pour les Pratiquants{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">
                  Autonomes
                </span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Notre service de location s'adresse aux kitesurfeurs autonomes ayant une expérience confirmée. 
                Un justificatif de niveau (carte IKO, attestation d'école) pourra vous être demandé.
              </p>
              <div className="bg-card rounded-3xl p-6 border border-border/50 text-left">
                <p className="text-foreground font-medium mb-2">📍 Points de location :</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Plage de l'Almanarre - Hyères</li>
                  <li>• Presqu'île de Giens</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Tarifs Location */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">
                Tarifs Location
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {rentalPrices.map((item) => (
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
                  <p className="text-muted-foreground text-sm mb-2">{item.duration}</p>
                  <p className="text-muted-foreground text-xs mb-4">{item.description}</p>
                  <p className="font-display text-3xl font-bold text-foreground">{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Matériel Inclus */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
                Équipement Complet Inclus
              </h2>

              <div className="bg-card rounded-3xl p-8 border border-border/50">
                <ul className="space-y-4">
                  {equipmentIncluded.map((item) => (
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

        {/* Avantages */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-12 text-center">
              Pourquoi Louer Chez Nous ?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {advantages.map((advantage) => (
                <div key={advantage.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                    <advantage.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">{advantage.title}</h3>
                  <p className="text-muted-foreground">{advantage.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Important */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-3xl p-8 border border-sunset/30">
                <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-sunset" />
                  Informations Importantes
                </h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li>• <strong className="text-foreground">Caution :</strong> Un chèque de caution de 500€ vous sera demandé (non encaissé).</li>
                  <li>• <strong className="text-foreground">Pièce d'identité :</strong> À présenter lors de la prise en charge du matériel.</li>
                  <li>• <strong className="text-foreground">Réservation :</strong> Conseillée 48h à l'avance, surtout en haute saison.</li>
                  <li>• <strong className="text-foreground">Annulation :</strong> Gratuite jusqu'à 24h avant en cas de conditions météo défavorables.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
              Prêt à Naviguer ?
            </h2>
            <p className="mb-8 text-primary-foreground/80">
              Réservez votre matériel dès maintenant pour profiter des meilleures conditions à l'Almanarre.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Réserver du Matériel</Link>
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

export default LocationMateriel;
