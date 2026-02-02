import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Check, Shield, RefreshCw, Users, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { getProductRatingData } from "@/lib/seo-ratings";
import kiteEquipment from "@/assets/kitesurf-hyeres.jpg";
import kiteWing from "@/assets/aile-kitesurf-hyeres.jpg";
import kiteBoard from "@/assets/kitesurf-action-hyeres.jpg";
import kiteGear from "@/assets/kitesurf-cours-hyeres.jpg";

const breadcrumbItems = [
  { label: "Location Matériel" }
];

const equipmentGallery = [
  { src: kiteWing, alt: "Location aile kitesurf Hyères Almanarre - Matériel école KiteSurf Passion", title: "Ailes" },
  { src: kiteBoard, alt: "Location planche kitesurf Hyères - Équipement twintip école KiteSurf Passion", title: "Planches" },
  { src: kiteGear, alt: "Location équipement kitesurf Hyères - Combinaison harnais école KiteSurf Passion", title: "Équipements" },
];
const rentalPrices = [
  { name: "Aile de Kitesurf", duration: "À la journée", price: "30€", description: "Différentes tailles disponibles" },
  { name: "Foil", duration: "À la journée", price: "20€", description: "Foil complet avec ailes" },
  { name: "Planche Twin Tip", duration: "À la journée", price: "10€", description: "Différentes tailles disponibles" },
  { name: "Combinaison 5/3", duration: "À la journée", price: "10€", description: "Intégrale néoprène" },
  { name: "Harnais", duration: "À la journée", price: "5€", description: "Ceinture ou culotte" },
  { name: "Casque", duration: "À la journée", price: "3€", description: "Protection obligatoire" },
  { name: "Gilet", duration: "À la journée", price: "2€", description: "Gilet de flottaison" },
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
        <title>Location Kitesurf Hyères | Matériel Almanarre</title>
        <meta
          name="description"
          content="Location de matériel kitesurf à Hyères : ailes (30€), planches (10€), foil (20€), combinaisons. Équipement récent à l'Almanarre et Giens."
        />
        <meta
          name="keywords"
          content="location matériel kitesurf Hyères, location kitesurf Almanarre, louer matériel kitesurf Giens, location équipement kitesurf Var"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/location-materiel-kitesurf-hyeres" />
        <link rel="alternate" hrefLang="fr" href="https://www.kitesurfpassion.fr/location-materiel-kitesurf-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/location-materiel-kitesurf-hyeres" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Location Matériel Kitesurf",
            "description": "Location de matériel de kitesurf à Hyères - Ailes, planches, harnais et équipements complets",
            "image": "https://www.kitesurfpassion.fr/assets/kitesurf-hyeres.jpg",
            "brand": {
              "@type": "Brand",
              "name": "KiteSurf Passion"
            },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "2",
              "highPrice": "30",
              "priceCurrency": "EUR",
              "offerCount": 8,
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "KiteSurf Passion"
              }
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
            },
            ...getProductRatingData()
          })}
        </script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Location Matériel", "item": "https://www.kitesurfpassion.fr/location-materiel-kitesurf-hyeres" }
          ]
        })}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero with Image */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={kiteEquipment}
              alt="Location matériel kitesurf Hyères Almanarre - Aile planche harnais école KiteSurf Passion Var"
              loading="eager"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
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

        {/* Equipment Gallery */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              Notre{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">
                Matériel
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {equipmentGallery.map((item) => (
                <div key={item.title} className="group relative rounded-2xl overflow-hidden">
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-display text-xl font-bold text-foreground">{item.title}</h3>
                  </div>
                </div>
              ))}
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {rentalPrices.map((item) => (
                <div
                  key={item.name}
                  className="bg-card rounded-2xl p-5 border border-border/50 text-center"
                >
                  <h3 className="font-display font-bold text-foreground mb-1 text-sm">{item.name}</h3>
                  <p className="text-muted-foreground text-xs mb-3">{item.duration}</p>
                  <p className="font-display text-2xl font-bold text-sunset">{item.price}</p>
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

        {/* Related Services */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Services Complémentaires
              </h2>
              <p className="text-muted-foreground">Pour les pratiquants autonomes</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                to="/deposes-mer-kitesurf-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Déposes en Mer</h3>
                <p className="text-muted-foreground text-sm mb-3">Départ bateau vers le large</p>
                <span className="text-primary text-sm font-medium">Dès 45€ →</span>
              </Link>
              <Link 
                to="/stage-kitesurf-100-glisse-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stage Kitesurf</h3>
                <p className="text-muted-foreground text-sm mb-3">Pas encore autonome ?</p>
                <span className="text-primary text-sm font-medium">Dès 399€ →</span>
              </Link>
              <Link 
                to="/spot-kitesurf-almanarre-hyeres-var"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Le Spot</h3>
                <p className="text-muted-foreground text-sm mb-3">Découvrez l'Almanarre</p>
                <span className="text-primary text-sm font-medium">En savoir plus →</span>
              </Link>
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
