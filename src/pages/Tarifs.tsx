import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Check, Gift, Download, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { MeetingPointsSection } from "@/components/sections/MeetingPointsSection";

import bonCadeauKitesurf from "@/assets/bon-cadeau-kitesurf.jpg";
import bonCadeauWingfoil from "@/assets/bon-cadeau-wingfoil.jpg";
import bonCadeauFoilTracte from "@/assets/bon-cadeau-foil-tracte.jpg";

const breadcrumbItems = [
  { label: "Tarifs" }
];

const pricingData = {
  kitesurf: [
    { name: "Stage 100% Glisse", sessions: "5 jours consécutifs", price: "399€", note: "Hors saison", popular: true },
    { name: "Stage 100% Glisse", sessions: "5 jours consécutifs", price: "499€", note: "Juillet/Août" },
    { name: "Stage Semi-Privé (2 pers.)", sessions: "5 jours", price: "599€", note: "Hors saison" },
    { name: "Stage Semi-Privé (2 pers.)", sessions: "5 jours", price: "699€", note: "Juillet/Août" },
    { name: "1 Cours Collectif", sessions: "1 séance", price: "120€", note: "Hors saison" },
    { name: "1 Cours Collectif", sessions: "1 séance", price: "130€", note: "Juillet/Août" },
    { name: "3 Cours Collectifs", sessions: "3 séances", price: "330€", note: "Hors saison" },
    { name: "3 Cours Collectifs", sessions: "3 séances", price: "360€", note: "Juillet/Août" },
    { name: "5 Cours Collectifs", sessions: "5 séances", price: "500€", note: "Hors saison" },
    { name: "5 Cours Collectifs", sessions: "5 séances", price: "570€", note: "Juillet/Août" },
    { name: "Cours Particulier", sessions: "2 heures", price: "230€", note: "Hors saison" },
    { name: "Cours Particulier", sessions: "2 heures", price: "380€", note: "Juillet/Août" },
  ],
  wingfoil: [
    { name: "Stage Initiation", sessions: "5 jours", price: "440€", note: "Hors saison", popular: true },
    { name: "Stage Initiation", sessions: "5 jours", price: "520€", note: "Juillet/Août" },
    { name: "Cours 2h30", sessions: "1 séance", price: "90€", note: "Hors saison" },
    { name: "Cours 2h30", sessions: "1 séance", price: "110€", note: "Juillet/Août" },
  ],
  pumpfoil: [
    { name: "Pump Foil / Dock Start", sessions: "1h30 (3 pers. max)", price: "50€", popular: true },
  ],
  foilTracte: [
    { name: "Foil Tracté 20 min", sessions: "Initiation", price: "50€" },
    { name: "Foil Tracté 40 min", sessions: "Apprentissage complet", price: "80€", popular: true },
  ],
  wakeboard: [
    { name: "Wakeboard 15 min", sessions: "Session tractée", price: "40€", popular: true },
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

const imageGalleryStructuredData = {
  "@context": "https://schema.org",
  "@type": "ImageGallery",
  name: "Bons Cadeaux KiteSurf Passion Hyères",
  description: "Collection de bons cadeaux pour offrir des cours de kitesurf, wingfoil et foil tracté à Hyères",
  image: [
    {
      "@type": "ImageObject",
      name: "Bon cadeau Kitesurf Hyères",
      description: "Bon cadeau pour offrir un stage ou des cours de kitesurf à l'école KiteSurf Passion Hyères",
      contentUrl: "https://www.kitesurfpassion.fr/assets/bon-cadeau-kitesurf.jpg",
      creditText: "KiteSurf Passion",
      copyrightNotice: "© KiteSurf Passion",
      creator: {
        "@type": "Organization",
        name: "KiteSurf Passion",
        url: "https://www.kitesurfpassion.fr",
      },
      license: "https://www.kitesurfpassion.fr/mentions-legales",
      acquireLicensePage: "https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres",
    },
    {
      "@type": "ImageObject",
      name: "Bon cadeau Wingfoil Hyères",
      description: "Bon cadeau pour offrir des cours de wingfoil à l'école KiteSurf Passion Hyères",
      contentUrl: "https://www.kitesurfpassion.fr/assets/bon-cadeau-wingfoil.jpg",
      creditText: "KiteSurf Passion",
      copyrightNotice: "© KiteSurf Passion",
      creator: {
        "@type": "Organization",
        name: "KiteSurf Passion",
        url: "https://www.kitesurfpassion.fr",
      },
      license: "https://www.kitesurfpassion.fr/mentions-legales",
      acquireLicensePage: "https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres",
    },
    {
      "@type": "ImageObject",
      name: "Bon cadeau Foil Tracté Hyères",
      description: "Bon cadeau pour offrir une session de foil tracté à l'école KiteSurf Passion Hyères",
      contentUrl: "https://www.kitesurfpassion.fr/assets/bon-cadeau-foil-tracte.jpg",
      creditText: "KiteSurf Passion",
      copyrightNotice: "© KiteSurf Passion",
      creator: {
        "@type": "Organization",
        name: "KiteSurf Passion",
        url: "https://www.kitesurfpassion.fr",
      },
      license: "https://www.kitesurfpassion.fr/mentions-legales",
      acquireLicensePage: "https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres",
    },
  ],
};

const Tarifs = () => {
  return (
    <>
      <Helmet>
        <title>Tarifs Kitesurf Wingfoil Hyères | Prix Almanarre</title>
        <meta
          name="description"
          content="Découvrez nos tarifs transparents pour cours de kitesurf, wingfoil et pumpfoil à Hyères. Stage dès 350€. Devis gratuit sous 24h."
        />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/tarifs-cours-kitesurf-wingfoil-hyeres" />
        <link rel="alternate" hrefLang="fr" href="https://www.kitesurfpassion.fr/tarifs-cours-kitesurf-wingfoil-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/tarifs-cours-kitesurf-wingfoil-hyeres" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Tarifs Kitesurf & Wingfoil Hyères | KiteSurf Passion" />
        <meta property="og:description" content="Stage kitesurf dès 399€, wingfoil dès 440€. Tout inclus : matériel, bateau, moniteur diplômé. Réservez votre cours à Hyères !" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/tarifs-cours-kitesurf-wingfoil-hyeres" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Tarifs cours de kitesurf et wingfoil à Hyères - École KiteSurf Passion" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tarifs Kitesurf & Wingfoil Hyères" />
        <meta name="twitter:description" content="Stage kitesurf dès 399€, wingfoil dès 440€. Tout inclus à Hyères !" />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Tarifs cours kitesurf wingfoil Hyères" />
        
        <script type="application/ld+json">
          {JSON.stringify(imageGalleryStructuredData)}
        </script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Tarifs", "item": "https://www.kitesurfpassion.fr/tarifs-cours-kitesurf-wingfoil-hyeres" }
          ]
        })}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

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

        {/* Foil Tracté */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-turquoise to-primary">Foil Tracté</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                Apprenez à voler sur l'eau en toute sécurité
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-6">
              {pricingData.foilTracte.map((item, index) => (
                <div 
                  key={`${item.name}-${index}`} 
                  className={`bg-card rounded-2xl p-5 border ${
                    item.popular ? "border-turquoise shadow-lg" : "border-border/50"
                  } relative`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-turquoise text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                      Recommandé
                    </span>
                  )}
                  <h3 className="font-display font-bold text-foreground mb-1 text-sm">{item.name}</h3>
                  <p className="text-muted-foreground text-xs mb-2">{item.sessions}</p>
                  <p className="font-display text-2xl font-bold text-foreground">{item.price}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Link 
                to="/foil-tracte-hyeres" 
                className="text-turquoise hover:text-turquoise/80 text-sm font-medium transition-colors"
              >
                En savoir plus sur le foil tracté →
              </Link>
            </div>
          </div>
        </section>

        {/* Wakeboard */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">Wakeboard</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                Glisse tractée fun et accessible à tous
              </p>
            </div>

            <div className="max-w-xs mx-auto mb-6">
              {pricingData.wakeboard.map((item, index) => (
                <div 
                  key={`${item.name}-${index}`} 
                  className={`bg-card rounded-2xl p-6 border ${
                    item.popular ? "border-sunset shadow-lg" : "border-border/50"
                  } relative`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sunset text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                      Session Fun
                    </span>
                  )}
                  <h3 className="font-display font-bold text-foreground mb-2">{item.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{item.sessions}</p>
                  <p className="font-display text-3xl font-bold text-foreground">{item.price}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Link 
                to="/wakeboard-hyeres" 
                className="text-sunset hover:text-sunset/80 text-sm font-medium transition-colors"
              >
                En savoir plus sur le wakeboard →
              </Link>
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

        {/* Information Licence FFVL */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-primary mt-0.5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground mb-2">
                    Licence FFVL Obligatoire
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pour les stages <strong className="text-foreground">Kitesurf</strong> et <strong className="text-foreground">Wingfoil</strong>, 
                    une licence FFVL (Fédération Française de Vol Libre) est obligatoire. 
                    Elle peut être souscrite directement auprès de notre école ou en ligne sur{" "}
                    <a 
                      href="https://www.ffvl.fr" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium transition-colors"
                    >
                      www.ffvl.fr
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Points de Rendez-vous */}
        <MeetingPointsSection />

        {/* Bons cadeaux */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sunset/10 rounded-2xl mb-6">
                <Gift className="w-8 h-8 text-sunset" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Offrez un Bon Cadeau
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Offrez une expérience inoubliable à vos proches ! Nos bons cadeaux sont valables 1 an et disponibles pour toutes nos activités.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Bon Cadeau Kitesurf */}
              <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-[2/1] overflow-hidden">
                  <img 
                    src={bonCadeauKitesurf} 
                    alt="Bon cadeau Kitesurf Hyères - École KiteSurf Passion Almanarre" 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 text-center">
                  <h3 className="font-display font-bold text-foreground mb-2">Bon Cadeau Kitesurf</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Offrez l'apprentissage du kitesurf. Stage ou cours à la carte.
                  </p>
                  <a 
                    href={bonCadeauKitesurf} 
                    download="bon-cadeau-kitesurf-hyeres.jpg"
                    className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le bon
                  </a>
                </div>
              </div>

              {/* Bon Cadeau Wingfoil */}
              <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-[2/1] overflow-hidden">
                  <img 
                    src={bonCadeauWingfoil} 
                    alt="Bon cadeau Wingfoil Hyères - École KiteSurf Passion Almanarre" 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 text-center">
                  <h3 className="font-display font-bold text-foreground mb-2">Bon Cadeau Wingfoil</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Offrez la découverte du wingfoil. Une discipline tendance et accessible.
                  </p>
                  <a 
                    href={bonCadeauWingfoil} 
                    download="bon-cadeau-wingfoil-hyeres.jpg"
                    className="inline-flex items-center justify-center gap-2 bg-sunset hover:bg-sunset/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le bon
                  </a>
                </div>
              </div>

              {/* Bon Cadeau Foil Tracté */}
              <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-[2/1] overflow-hidden">
                  <img 
                    src={bonCadeauFoilTracte} 
                    alt="Bon cadeau Foil Tracté Hyères - École KiteSurf Passion Almanarre" 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 text-center">
                  <h3 className="font-display font-bold text-foreground mb-2">Bon Cadeau Foil Tracté</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Offrez les sensations du vol sur l'eau. Idéal pour une initiation.
                  </p>
                  <a 
                    href={bonCadeauFoilTracte} 
                    download="bon-cadeau-foil-tracte-hyeres.jpg"
                    className="inline-flex items-center justify-center gap-2 bg-turquoise hover:bg-turquoise/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le bon
                  </a>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground text-sm mb-4">
                Pour personnaliser votre bon cadeau ou commander plusieurs bons, contactez-nous.
              </p>
              <Button variant="sunset" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Commander un Bon Personnalisé</Link>
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
