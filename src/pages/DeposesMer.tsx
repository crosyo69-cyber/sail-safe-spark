import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Check, Anchor, Shield, MapPin, Users, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import bateauSecurite from "@/assets/bateau-assistance-kitesurf.jpg";

const breadcrumbItems = [
  { label: "Déposes en Mer" }
];

const dropPrices = [
  { 
    name: "Dépose Mer", 
    description: "Accès bateau pour une session", 
    price: "45€",
    details: "Bateau sécurité inclus"
  },
  { 
    name: "Location + Dépose", 
    description: "Matériel complet + dépose en mer", 
    price: "80€", 
    popular: true,
    details: "Formule complète"
  },
  { 
    name: "Carnet 10 Déposes", 
    description: "10 déposes en mer", 
    price: "300€",
    details: "Économisez 150€"
  },
];

const advantages = [
  {
    icon: Anchor,
    title: "Accès aux Meilleurs Spots",
    description: "Dépose directe sur les zones de navigation optimales de la baie d'Hyères et du spot de l'Almanarre."
  },
  {
    icon: Shield,
    title: "Sécurité Maximale",
    description: "Bateau d'assistance permanent sur zone. Encadrement professionnel pour naviguer en toute sérénité."
  },
  {
    icon: MapPin,
    title: "Flexibilité Totale",
    description: "Nous nous adaptons aux conditions météo pour vous déposer sur le meilleur spot du jour (Almanarre, Giens, baie d'Hyères)."
  },
  {
    icon: Users,
    title: "Pratiquants Autonomes",
    description: "Service réservé aux kitesurfeurs confirmés et autonomes. Niveau minimum requis."
  },
];

const conditions = [
  "Être autonome au waterstart et navigation",
  "Savoir gérer son matériel en toute situation",
  "Maîtriser les règles de priorité et sécurité",
  "Avoir une assurance responsabilité civile",
];

const DeposesMer = () => {
  return (
    <>
      <Helmet>
        <title>Déposes en Mer Kitesurf Hyères | Bateau Sécurité Almanarre & Giens</title>
        <meta
          name="description"
          content="Service de déposes en mer pour kitesurf à Hyères. Bateau sécurité sur l'Almanarre et Giens. Accès aux meilleurs spots dès 45€. Réservez votre dépose."
        />
        <meta
          name="keywords"
          content="déposes en mer kitesurf Hyères, bateau sécurité kitesurf Almanarre, dépose en mer kitesurf Giens, downwind kitesurf var"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.com/deposes-mer-kitesurf-hyeres" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Déposes en Mer Kitesurf",
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
            "areaServed": ["Hyères", "Almanarre", "Giens", "Var"],
            "description": "Service de déposes en mer pour kitesurfeurs autonomes avec bateau de sécurité",
            "offers": [
              {
                "@type": "Offer",
                "name": "Dépose Mer",
                "price": "45",
                "priceCurrency": "EUR"
              },
              {
                "@type": "Offer",
                "name": "Location + Dépose",
                "price": "80",
                "priceCurrency": "EUR"
              },
              {
                "@type": "Offer",
                "name": "Carnet 10 Déposes",
                "price": "300",
                "priceCurrency": "EUR"
              }
            ]
          })}
        </script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={bateauSecurite}
              alt="Bateau d'assistance de l'école de kitesurf Hyères"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/25 to-background" />
          </div>

          {/* Content */}
          <div className="container mx-auto px-4 text-center relative z-10 pt-32 pb-16">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6 drop-shadow-lg">
              Déposes en{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-turquoise to-primary-foreground">
                Mer
              </span>
            </h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8 drop-shadow-md">
              Accédez aux meilleurs spots de kitesurf de la baie d'Hyères en toute sécurité. 
              Notre bateau vous dépose directement sur zone pour des sessions inoubliables.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  <Anchor className="w-5 h-5 mr-2" />
                  Réserver une Dépose en Mer
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

        {/* Avantages */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-12 text-center">
              Pourquoi Choisir Nos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">
                Déposes en Mer
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {advantages.map((item) => (
                <div
                  key={item.title}
                  className="bg-card rounded-2xl p-6 border border-border/50 flex gap-4"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tarifs */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              Nos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">
                Tarifs
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {dropPrices.map((item) => (
                <div
                  key={item.name}
                  className={`bg-card rounded-2xl p-6 border ${
                    item.popular ? "border-primary shadow-glow" : "border-border/50"
                  } relative text-center`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                      Populaire
                    </span>
                  )}
                  <h3 className="font-display font-bold text-foreground mb-2">{item.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                  <p className="font-display text-4xl font-bold text-foreground mb-2">{item.price}</p>
                  <p className="text-primary text-sm font-medium">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Conditions */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
                Conditions d'Accès
              </h2>

              <div className="bg-card rounded-3xl p-8 border border-border/50">
                <p className="text-muted-foreground mb-6 text-center">
                  Le service de déposes en mer est réservé aux pratiquants autonomes. 
                  Vous devez :
                </p>
                <ul className="space-y-4">
                  {conditions.map((item) => (
                    <li key={item} className="flex items-center gap-4">
                      <Check className="w-6 h-6 text-primary flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground mt-6 text-sm text-center">
                  En cas de doute sur votre niveau, contactez-nous. Nous évaluerons ensemble 
                  si ce service est adapté à votre pratique.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Spots */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              Nos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-turquoise to-primary">
                Zones de Dépose
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-card rounded-2xl p-6 border border-border/50 text-center">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-display font-bold text-foreground mb-2">L'Almanarre</h3>
                <p className="text-muted-foreground text-sm">
                  Spot mythique de la presqu'île de Giens. Conditions idéales pour le kitesurf.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border/50 text-center">
                <MapPin className="w-8 h-8 text-turquoise mx-auto mb-4" />
                <h3 className="font-display font-bold text-foreground mb-2">Presqu'île de Giens</h3>
                <p className="text-muted-foreground text-sm">
                  Différentes zones selon les conditions météo. Navigation variée.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border/50 text-center">
                <MapPin className="w-8 h-8 text-sunset mx-auto mb-4" />
                <h3 className="font-display font-bold text-foreground mb-2">Baie d'Hyères</h3>
                <p className="text-muted-foreground text-sm">
                  Large plan d'eau protégé. Parfait pour les downwinds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Related Services */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Services Complémentaires
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                to="/location-materiel-kitesurf-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Location Matériel</h3>
                <p className="text-muted-foreground text-sm mb-3">Équipement complet à la journée</p>
                <span className="text-primary text-sm font-medium">Dès 30€ →</span>
              </Link>
              <Link 
                to="/stage-kitesurf-100-glisse-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stage Kitesurf</h3>
                <p className="text-muted-foreground text-sm mb-3">Devenez autonome en 5 jours</p>
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
              Prêt pour Votre Dépose en Mer ?
            </h2>
            <p className="mb-8 text-primary-foreground/80">
              Réservez dès maintenant votre créneau. Nous nous adaptons à la météo pour vous offrir 
              les meilleures conditions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Réserver une Dépose en Mer</Link>
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

export default DeposesMer;
