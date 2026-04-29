import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Check, Gift, Download, AlertCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { MeetingPointsSection } from "@/components/sections/MeetingPointsSection";
import { SeasonPricingSection } from "@/components/sections/SeasonPricingSection";
import { ActivityFAQ } from "@/components/sections/ActivityFAQ";
import { getProductRatingData } from "@/lib/seo-ratings";

// WebP optimized images for better LCP performance
import bonCadeauKitesurf from "@/assets/bon-cadeau-kitesurf.jpg?webp";
import bonCadeauWingfoil from "@/assets/bon-cadeau-wingfoil.jpg?webp";
import bonCadeauFoilTracte from "@/assets/bon-cadeau-foil-tracte.jpg?webp";

const breadcrumbItems = [
  { label: "Tarifs" }
];

// Données structurées par formule avec haute/basse saison
const kitesurfSeasonPricing = [
  { name: "Stage 100% Glisse", sessions: "5 jours consécutifs", highSeasonPrice: "499€", lowSeasonPrice: "399€", savings: "100€", popular: true },
  { name: "Stage Semi-Privé (2 pers.)", sessions: "5 jours", highSeasonPrice: "699€", lowSeasonPrice: "599€", savings: "100€" },
  { name: "1 Cours Collectif", sessions: "1 séance", highSeasonPrice: "130€", lowSeasonPrice: "120€", savings: "10€" },
  { name: "3 Cours Collectifs", sessions: "3 séances", highSeasonPrice: "360€", lowSeasonPrice: "330€", savings: "30€" },
  { name: "5 Cours Collectifs", sessions: "5 séances", highSeasonPrice: "570€", lowSeasonPrice: "500€", savings: "70€" },
  { name: "Cours Particulier", sessions: "2 heures", highSeasonPrice: "380€", lowSeasonPrice: "230€", savings: "150€" },
];

const wingfoilSeasonPricing = [
  { name: "Stage Initiation", sessions: "5 jours", highSeasonPrice: "520€", lowSeasonPrice: "440€", savings: "80€", popular: true },
  { name: "Cours 2h30", sessions: "1 séance", highSeasonPrice: "110€", lowSeasonPrice: "90€", savings: "20€" },
];

// Activités sans variation saisonnière
const pricingData = {
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

// FAQ items for the pricing page
const tarifsFAQItems = [
  {
    question: "Les tarifs incluent-ils tout le matériel ?",
    answer: "Oui, tous nos tarifs sont tout compris : aile de kitesurf, planche, combinaison néoprène, harnais, casque et gilet de flottaison. Le bateau d'assistance est également inclus pour tous les cours.",
  },
  {
    question: "Quelle est la différence entre haute et basse saison ?",
    answer: "La haute saison correspond aux mois de juillet et août, période de forte demande avec des conditions météo optimales. La basse saison (hors juillet/août) offre des tarifs préférentiels, plus de disponibilité et un suivi pédagogique plus personnalisé.",
  },
  {
    question: "Comment puis-je économiser sur les cours ?",
    answer: "Pour économiser jusqu'à 150€, réservez vos cours en basse saison (hors juillet/août). Vous bénéficierez également d'un encadrement plus personnalisé et d'une progression plus rapide grâce à des groupes plus petits.",
  },
  {
    question: "Une licence FFVL est-elle obligatoire ?",
    answer: "Oui, pour les stages Kitesurf et Wingfoil, une licence FFVL (Fédération Française de Vol Libre) est obligatoire. Elle peut être souscrite directement auprès de notre école ou en ligne sur www.ffvl.fr.",
  },
  {
    question: "Proposez-vous des bons cadeaux ?",
    answer: "Oui ! Nous proposons des bons cadeaux pour toutes nos activités : kitesurf, wingfoil et foil tracté. Ils sont valables 1 an et personnalisables sur demande. Téléchargez-les directement depuis notre page tarifs ou contactez-nous pour un bon personnalisé.",
  },
  {
    question: "Que se passe-t-il en cas de mauvais temps ?",
    answer: "Si les conditions météo ne permettent pas la pratique, nous reportons votre séance à une date ultérieure. Pour le stage 100% Glisse, les jours sans vent sont remplacés par des activités tractées (foil tracté, wakeboard) incluses dans le tarif.",
  },
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
      contentUrl: "https://www.kitesurfpassion.fr/images/bon-cadeau-kitesurf.jpg",
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
      contentUrl: "https://www.kitesurfpassion.fr/images/bon-cadeau-wingfoil.jpg",
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
      contentUrl: "https://www.kitesurfpassion.fr/images/bon-cadeau-foil-tracte.jpg",
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

// Product structured data for rich snippets
const productStructuredData = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Cours de Kitesurf et Wingfoil à Hyères",
  description: "Stages et cours de kitesurf, wingfoil, pumpfoil et foil tracté à l'Almanarre, Hyères. Formules adaptées à tous les niveaux avec moniteur diplômé d'État et bateau d'assistance.",
  image: "https://www.kitesurfpassion.fr/og-image.jpg",
  brand: {
    "@type": "Brand",
    name: "KiteSurf Passion"
  },
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "40",
    highPrice: "699",
    priceCurrency: "EUR",
    offerCount: 15,
    availability: "https://schema.org/InStock",
    seller: {
      "@type": "Organization",
      name: "KiteSurf Passion",
      url: "https://www.kitesurfpassion.fr"
    }
  },
  ...getProductRatingData()
};

// FAQPage structured data
const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: tarifsFAQItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const Tarifs = () => {
  return (
    <>
      <Helmet>
         <title>Tarifs Kitesurf & Wingfoil Hyères | Kitesurf Passion – Dès 40€</title>
         <meta
           name="description"
           content="Tarifs des cours de kitesurf, wingfoil et pumpfoil à Hyères avec Kitesurf Passion. Stage dès 399€, session carte dès 120€. Matériel, bateau et moniteur diplômé inclus."
         />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/tarifs-cours-kitesurf-wingfoil-hyeres" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/tarifs-cours-kitesurf-wingfoil-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/tarifs-cours-kitesurf-wingfoil-hyeres" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Tarifs Kitesurf & Wingfoil Hyères | KiteSurf Passion" />
        <meta property="og:description" content="Stage kitesurf dès 399€, wingfoil dès 440€. Économisez jusqu'à 150€ en basse saison ! Tout inclus : matériel, bateau, moniteur diplômé." />
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
        <meta name="twitter:description" content="Stage kitesurf dès 399€, wingfoil dès 440€. Économisez en basse saison !" />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Tarifs cours kitesurf wingfoil Hyères" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(imageGalleryStructuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(productStructuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqStructuredData)}
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
        {/* Hero - Above fold, no content-visibility */}
        <section 
          className="pt-32 pb-16 bg-gradient-to-b from-primary/10 to-background"
          style={{ contain: 'layout style' }}
        >
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
              Tarifs Kitesurf & Wingfoil à Hyères
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
              Transparence totale sur nos prix. Tout le matériel et le bateau d'assistance sont inclus dans chaque formule.
            </p>
            
            {/* Bandeau économies */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2.5">
              <Info className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium text-sm">
                Économisez jusqu'à <strong>150€</strong> en réservant hors saison !
              </span>
            </div>

            {/* CTA principal — visible dès le haut de page */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" className="touch-target" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres" aria-label="Réserver un cours de kitesurf, wingfoil ou pumpfoil à Hyères">
                  Réserver un cours
                </Link>
              </Button>
              <Button variant="hero" size="lg" className="touch-target" asChild>
                <a href="tel:0672716905" aria-label="Appeler Kitesurf Passion au 06 72 71 69 05">
                  06 72 71 69 05
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Kitesurf avec saisons */}
        <SeasonPricingSection
          title="Kitesurf"
          gradientClass="from-primary to-turquoise"
          items={kitesurfSeasonPricing}
          colorScheme="ocean"
        />

        {/* Wingfoil avec saisons */}
        <section className="bg-secondary/30">
          <SeasonPricingSection
            title="Wing Foil"
            gradientClass="from-sunset to-sunset-light"
            items={wingfoilSeasonPricing}
            colorScheme="sunset"
          />
        </section>

        {/* Pumpfoil - sans variation saisonnière - content-visibility for CLS */}
        <section 
          className="py-16 bg-background"
          style={{ contain: 'layout style', contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}
        >
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

        {/* Foil Tracté - content-visibility for CLS */}
        <section 
          className="py-16 bg-secondary/30"
          style={{ contain: 'layout style', contentVisibility: 'auto', containIntrinsicSize: '0 350px' }}
        >
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

        {/* Wakeboard - content-visibility for CLS */}
        <section 
          className="py-16 bg-background"
          style={{ contain: 'layout style', contentVisibility: 'auto', containIntrinsicSize: '0 350px' }}
        >
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

        {/* Déposes en Mer - content-visibility for CLS */}
        <section 
          className="py-16 bg-secondary/30"
          style={{ contain: 'layout style', contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}
        >
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

        {/* Location Matériel - content-visibility for CLS */}
        <section 
          className="py-16 bg-background"
          style={{ contain: 'layout style', contentVisibility: 'auto', containIntrinsicSize: '0 280px' }}
        >
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

        {/* Ce qui est inclus - content-visibility for CLS */}
        <section 
          className="py-16 bg-secondary/30"
          style={{ contain: 'layout style', contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}
        >
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

        {/* Information Licence FFVL - content-visibility for CLS */}
        <section 
          className="py-12 bg-background"
          style={{ contain: 'layout style', contentVisibility: 'auto', containIntrinsicSize: '0 180px' }}
        >
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

        {/* Bons cadeaux - content-visibility for CLS */}
        <section 
          className="py-16 bg-background"
          style={{ contain: 'layout style', contentVisibility: 'auto', containIntrinsicSize: '0 700px' }}
        >
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
              {/* Bon Cadeau Kitesurf - explicit dimensions for CLS */}
              <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-[2/1] overflow-hidden" style={{ minHeight: '150px' }}>
                  <img 
                    src={bonCadeauKitesurf} 
                    alt="Bon cadeau Kitesurf Hyères - École KiteSurf Passion Almanarre" 
                    width={400}
                    height={200}
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
                    className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm touch-target"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le bon
                  </a>
                </div>
              </div>

              {/* Bon Cadeau Wingfoil - explicit dimensions for CLS */}
              <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-[2/1] overflow-hidden" style={{ minHeight: '150px' }}>
                  <img 
                    src={bonCadeauWingfoil} 
                    alt="Bon cadeau Wingfoil Hyères - École KiteSurf Passion Almanarre" 
                    width={400}
                    height={200}
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
                    className="inline-flex items-center justify-center gap-2 bg-sunset hover:bg-sunset/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm touch-target"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le bon
                  </a>
                </div>
              </div>

              {/* Bon Cadeau Foil Tracté - explicit dimensions for CLS */}
              <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-[2/1] overflow-hidden" style={{ minHeight: '150px' }}>
                  <img 
                    src={bonCadeauFoilTracte} 
                    alt="Bon cadeau Foil Tracté Hyères - École KiteSurf Passion Almanarre" 
                    width={400}
                    height={200}
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
                    className="inline-flex items-center justify-center gap-2 bg-turquoise hover:bg-turquoise/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm touch-target"
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

        {/* Expert Content Section - SEO enrichi */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Guide des Tarifs :{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">Choisir la Bonne Formule</span>
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-16">
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Comprendre nos formules kitesurf</h3>
                  <p>
                    Nos tarifs sont conçus pour offrir la <strong>meilleure valeur possible</strong> à chaque profil d'élève. Le <Link to="/stage-kitesurf-100-glisse-hyeres" className="text-primary hover:underline">stage 100% Glisse</Link> à 399€ (hors saison) reste notre formule phare : 5 jours consécutifs pour devenir autonome, avec <strong>foil tracté et wakeboard inclus</strong> les jours sans vent. C'est le meilleur investissement pour un débutant.
                  </p>
                  <p>
                    Le <Link to="/cours-particulier-kitesurf-hyeres" className="text-primary hover:underline">cours particulier</Link> à 230€ (2h, hors saison) est idéal pour une <strong>progression accélérée</strong> ou pour travailler des points techniques spécifiques. Le ratio 1:1 avec le moniteur garantit que chaque minute est optimisée pour votre apprentissage.
                  </p>
                  <p>
                    Les <Link to="/session-kitesurf-carte-hyeres" className="text-primary hover:underline">sessions à la carte</Link> (dès 120€ la séance) conviennent aux <strong>résidents locaux</strong> et aux vacanciers avec des emplois du temps variables. Les packs de 3 ou 5 séances offrent des réductions progressives allant jusqu'à 70€ d'économie.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Maximiser votre budget</h3>
                  <p>
                    La distinction <strong>haute saison / basse saison</strong> vous permet d'économiser jusqu'à <strong>150€</strong> en réservant hors juillet-août. Au-delà de l'aspect financier, la basse saison offre des avantages concrets : <strong>groupes plus petits</strong>, plus de disponibilité de créneaux, et des conditions de vent souvent excellentes (mars-juin et septembre-novembre).
                  </p>
                  <p>
                    Tous nos tarifs sont <strong>tout compris</strong> : matériel (aile, planche, combinaison, casque, gilet), bateau d'assistance permanent, assurance responsabilité civile, et encadrement par notre moniteur diplômé d'État. Il n'y a aucun frais caché. La seule obligation supplémentaire est la <strong>licence FFVL</strong> pour les stages kitesurf et wingfoil.
                  </p>
                  <p>
                    Nos <strong>bons cadeaux</strong> sont valables 1 an et disponibles pour toutes nos activités. C'est une idée de cadeau originale pour un anniversaire, Noël, ou toute occasion spéciale. <Link to="/contact-reservation-kitesurf-hyeres" className="text-primary hover:underline">Contactez-nous</Link> pour personnaliser votre bon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <ActivityFAQ
          title="Questions Fréquentes Tarifs"
          subtitle="Tout ce que vous devez savoir sur nos formules et nos prix"
          faqs={tarifsFAQItems}
        />

        {/* CTA - content-visibility for CLS */}
        <section 
          className="py-16 bg-primary text-primary-foreground"
          style={{ contain: 'layout style', contentVisibility: 'auto', containIntrinsicSize: '0 250px' }}
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
              Prêt à Réserver ?
            </h2>
            <p className="mb-8 text-primary-foreground/80">
              Contactez-nous pour réserver votre créneau ou obtenir un devis personnalisé.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" className="touch-target" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Réserver en Ligne</Link>
              </Button>
              <Button variant="hero" size="lg" className="touch-target" asChild>
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
