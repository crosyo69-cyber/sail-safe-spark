import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { ActivityFAQ } from "@/components/sections/ActivityFAQ";
import { RelatedBlogArticles } from "@/components/sections/RelatedBlogArticles";
import { InternalLinking, disciplineLinks, pillarLinks } from "@/components/sections/InternalLinking";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getProductRatingData } from "@/lib/seo-ratings";
import wingfoilImage from "@/assets/wingfoil-hyeres.jpg?webp";

const wingfoilBlogArticles = [
  {
    slug: "wingfoil-vs-kitesurf-quel-sport-choisir",
    title: "Wingfoil vs Kitesurf : Quel Sport de Glisse Choisir ?",
    excerpt: "Comparatif complet entre wingfoil et kitesurf pour vous aider à choisir le sport qui correspond à vos attentes.",
  },
  {
    slug: "apprendre-wingfoil-debutant-guide-complet",
    title: "Apprendre le Wingfoil Débutant : Guide Complet",
    excerpt: "Toutes les étapes pour bien débuter en wingfoil, du choix du matériel aux premières sensations de vol.",
  },
  {
    slug: "meilleur-spot-wingfoil-hyeres-almanarre",
    title: "Almanarre : Le Meilleur Spot Wingfoil de la Côte d'Azur",
    excerpt: "Découvrez pourquoi l'Almanarre est considéré comme le spot idéal pour apprendre et progresser en wingfoil.",
  },
];
const wingfoilFaqs = [
  {
    question: "Le wingfoil est-il plus facile que le kitesurf à apprendre ?",
    answer: "Oui, le wingfoil est généralement plus accessible. Il n'y a pas de lignes à gérer, l'aile se tient directement à la main. La progression est souvent plus rapide pour les débutants, surtout sur notre spot de l'Almanarre à Hyères.",
  },
  {
    question: "Quel vent faut-il pour pratiquer le wingfoil à l'Almanarre ?",
    answer: "Le wingfoil se pratique dès 12 nœuds de vent, soit moins que le kitesurf (15-20 nœuds). C'est un avantage majeur qui permet de naviguer plus souvent sur le spot de l'Almanarre à Hyères.",
  },
  {
    question: "Combien coûte un stage de wingfoil à Hyères Almanarre ?",
    answer: "Notre stage initiation wingfoil 5 jours est à 440€ hors saison (520€ en juillet/août). Il comprend 4 leçons de 2h30 plus une session de foil tracté de 40 minutes pour accélérer votre progression.",
  },
  {
    question: "Faut-il avoir fait du kitesurf avant le wingfoil ?",
    answer: "Non, le wingfoil est une discipline indépendante. Vous pouvez débuter directement en wingfoil sans expérience préalable en kitesurf. Notre école à Hyères propose des cours adaptés aux vrais débutants.",
  },
  {
    question: "Pourquoi l'Almanarre est-il idéal pour apprendre le wingfoil ?",
    answer: "L'Almanarre offre des conditions parfaites : eau plate dans la lagune, vents réguliers, faible profondeur et espace dégagé. Notre bateau d'assistance vous sécurise pendant toute la durée du cours.",
  },
];

const breadcrumbItems = [
  { label: "Stage Wing Foil" }
];

const StageWingfoil = () => {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Le wingfoil est-il plus facile que le kitesurf ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, le wingfoil est généralement plus accessible que le kitesurf. Il n'y a pas de lignes à gérer, l'aile se tient à la main et la progression est souvent plus rapide pour les débutants.",
        },
      },
      {
        "@type": "Question",
        name: "Quel vent faut-il pour faire du wingfoil ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le wingfoil se pratique dès 12 nœuds de vent, soit moins que le kitesurf. C'est un avantage majeur qui permet de naviguer plus souvent à l'Almanarre.",
        },
      },
      {
        "@type": "Question",
        name: "Combien coûte un stage de wingfoil à Hyères ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Notre stage initiation wingfoil 5 jours est à 440€ hors saison (520€ en juillet/août). Il comprend 4 leçons de 2h30 plus une session de foil tracté de 40 minutes.",
        },
      },
      {
        "@type": "Question",
        name: "Faut-il savoir faire du kitesurf avant le wingfoil ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Non, le wingfoil est une discipline indépendante. Vous pouvez débuter directement en wingfoil sans expérience préalable en kitesurf ou autres sports de glisse.",
        },
      },
    ],
  };

  const courseStructuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Stage Wing Foil Initiation",
    description: "Stage de wingfoil pour débutants à Hyères, sport tendance accessible à tous",
    provider: {
      "@type": "LocalBusiness",
      name: "KiteSurf Passion",
      url: "https://www.kitesurfpassion.fr",
      telephone: "+33672716905",
      priceRange: "€€",
      image: "https://www.kitesurfpassion.fr/og-image.jpg",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Port de Carqueiranne",
        addressLocality: "Hyères",
        addressRegion: "Var",
        postalCode: "83400",
        addressCountry: "FR",
      },
    },
    offers: {
      "@type": "Offer",
      price: "440",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  };

  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Stage Wingfoil Initiation - Hyères",
    description: "Stage de wingfoil 5 jours pour débutants à l'Almanarre, Hyères. Sport tendance accessible à tous avec foil tracté inclus.",
    image: "https://www.kitesurfpassion.fr/images/wingfoil-hyeres.jpg",
    brand: {
      "@type": "Brand",
      name: "KiteSurf Passion"
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "90",
      highPrice: "440",
      priceCurrency: "EUR",
      offerCount: 2,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "KiteSurf Passion"
      }
    },
    ...getProductRatingData()
  };

  const imageStructuredData = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: "Stage wingfoil Hyères Almanarre",
    description: "Cours de wingfoil sur le spot de l'Almanarre à Hyères - école KiteSurf Passion Var",
    contentUrl: "https://www.kitesurfpassion.fr/images/wingfoil-hyeres.jpg",
    thumbnailUrl: "https://www.kitesurfpassion.fr/images/wingfoil-hyeres.jpg",
    creditText: "KiteSurf Passion",
    copyrightNotice: "© KiteSurf Passion",
    creator: {
      "@type": "Organization",
      name: "KiteSurf Passion",
      url: "https://www.kitesurfpassion.fr",
    },
    license: "https://www.kitesurfpassion.fr/mentions-legales",
    acquireLicensePage: "https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres",
    contentLocation: {
      "@type": "Place",
      name: "Plage de l'Almanarre, Hyères",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Hyères",
        addressRegion: "Var",
        addressCountry: "FR",
      },
    },
  };

  return (
    <>
      <Helmet>
         <title>Stage Wingfoil Hyères Almanarre | Kitesurf Passion – Cours Wing Foil Var</title>
         <meta
           name="description"
           content="Stage wingfoil 5 jours à Hyères Almanarre avec Kitesurf Passion. Foil tracté inclus, moniteur diplômé, progression rapide sur le meilleur spot du Var. Dès 440€."
         />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Stage Wingfoil Hyères | Kitesurf Passion – Cours Wing Foil Var" />
        <meta property="og:description" content="Apprenez le wingfoil à Hyères dès 440€. Sport tendance, progression rapide, bateau d'assistance. Volez sur l'eau !" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Stage wingfoil à Hyères Almanarre - École KiteSurf Passion Var" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Stage Wingfoil Hyères Almanarre" />
        <meta name="twitter:description" content="Cours wingfoil dès 440€ à Hyères. Sport tendance, progression rapide !" />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Stage wingfoil Hyères Almanarre" />
        
        {/* Single FAQPage with all wingfoil FAQs - removed duplicate to fix GSC error */}
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(courseStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(productStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(imageStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Stage Wing Foil", "item": "https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" }
          ]
        })}</script>
        
        {/* HowTo schema for wingfoil learning steps */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "Comment apprendre le wingfoil à Hyères en 5 jours",
          "description": "Guide complet pour apprendre le wingfoil à l'Almanarre. De la découverte de l'aile aux premiers vols sur le foil.",
          "image": "https://www.kitesurfpassion.fr/images/wingfoil-hyeres.jpg",
          "totalTime": "PT12H30M",
          "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "EUR",
            "value": "440"
          },
          "supply": [
            { "@type": "HowToSupply", "name": "Wing (aile de wingfoil)" },
            { "@type": "HowToSupply", "name": "Planche de wingfoil avec foil" },
            { "@type": "HowToSupply", "name": "Combinaison néoprène" },
            { "@type": "HowToSupply", "name": "Casque et gilet de flottaison" }
          ],
          "tool": [
            { "@type": "HowToTool", "name": "Bateau d'assistance" }
          ],
          "step": [
            {
              "@type": "HowToStep",
              "position": 1,
              "name": "Découverte de la wing",
              "text": "Prise en main de l'aile sur la plage, apprentissage du gonflage, des positions et de la génération de puissance."
            },
            {
              "@type": "HowToStep",
              "position": 2,
              "name": "Navigation sur planche sans foil",
              "text": "Premiers pas dans l'eau avec la wing, apprentissage de la navigation en position debout sur une planche stable."
            },
            {
              "@type": "HowToStep",
              "position": 3,
              "name": "Introduction au foil",
              "text": "Session de foil tracté pour comprendre les sensations de vol et l'équilibre sur le foil sans gérer l'aile."
            },
            {
              "@type": "HowToStep",
              "position": 4,
              "name": "Premiers vols en wingfoil",
              "text": "Combinaison wing + foil, premiers décollages et maintien du vol au-dessus de l'eau."
            },
            {
              "@type": "HowToStep",
              "position": 5,
              "name": "Navigation autonome",
              "text": "Maîtrise des trajectoires, virages et remontée au vent. Vous volez en autonomie sur le spot de l'Almanarre !"
            }
          ]
        })}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="hero-split-breadcrumb" />

      <main>
        {/* Hero */}
        <section className="hero-split">
          <div className="hero-split-photo">
            <img
              src={wingfoilImage}
              alt="Stage wingfoil Hyères Almanarre - Cours wing foil école KiteSurf Passion Var"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="hero-split-panel">
            <div className="max-w-2xl">
              <span className="inline-block text-sunset font-semibold mb-4">Wing Foil</span>
              <h1 className="font-display text-[2.25rem] leading-[1.05] sm:text-5xl xl:text-6xl font-black text-primary-foreground mb-5">
                Stage <span className="text-sunset">Wingfoil</span> Hyères Almanarre
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
                      <span className="font-semibold text-foreground">Stage Initiation 5 jours</span>
                      <p className="text-muted-foreground text-sm">4 leçons de 2h30 + simulateur foil tracté 40min</p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-2xl font-bold text-foreground">440€</span>
                      <p className="text-primary text-xs">Hors saison (520€ juil./août)</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <div>
                      <span className="font-semibold text-foreground">Cours 2h30</span>
                      <p className="text-muted-foreground text-sm">Cours à la carte</p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-2xl font-bold text-foreground">90€</span>
                      <p className="text-primary text-xs">Hors saison (110€ juil./août)</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <div>
                      <span className="font-semibold text-foreground">Foil Tracté 40 min</span>
                      <p className="text-muted-foreground text-sm">Simulateur de foil</p>
                    </div>
                    <span className="font-display text-2xl font-bold text-foreground">80€</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4">
                    <div>
                      <span className="font-semibold text-foreground">Foil Tracté 20 min</span>
                      <p className="text-muted-foreground text-sm">Découverte simulateur</p>
                    </div>
                    <span className="font-display text-2xl font-bold text-foreground">50€</span>
                  </div>
                </div>

                <Button variant="sunset" size="lg" className="w-full mt-8" asChild>
                  <Link to="/contact-reservation-kitesurf-hyeres">Réserver mon Stage</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Expert Content Section - SEO 1500+ mots */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Le Guide Expert du{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">Wingfoil à Hyères</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                  Tout ce que vous devez savoir pour apprendre le wingfoil sur le spot de l'Almanarre avec notre école certifiée FFVL.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-16">
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Le wingfoil : la révolution des sports de glisse</h3>
                  <p>
                    Le <strong>wingfoil</strong> (ou wing foil) est la discipline qui connaît la plus forte croissance dans l'univers des sports nautiques. Né en 2019, il combine une <strong>aile tenue à la main</strong> (la wing) et une planche équipée d'un <strong>hydrofoil</strong> — un appendice immergé qui soulève la planche hors de l'eau à partir d'une certaine vitesse.
                  </p>
                  <p>
                    Le résultat ? Une <strong>sensation de vol silencieuse et écologique</strong> au-dessus de l'eau, sans moteur, sans bruit, uniquement propulsé par le vent. C'est cette expérience unique qui séduit un nombre croissant de pratiquants chaque année, des adolescents aux retraités sportifs.
                  </p>
                  <p>
                    Contrairement au kitesurf qui nécessite la gestion de lignes de 20-25 mètres, le wingfoil se pratique en <strong>contact direct avec l'aile</strong>. Il n'y a pas de systèmes de lignes complexes à apprendre, pas de bar à régler, et la zone de sécurité autour de vous est bien plus réduite. C'est pourquoi le wingfoil est souvent considéré comme <strong>plus accessible que le kitesurf</strong> pour les débutants complets.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Notre méthode d'apprentissage progressive</h3>
                  <p>
                    Notre <strong>stage wingfoil 5 jours</strong> à l'Almanarre suit une progression scientifiquement optimisée qui découple les difficultés pour accélérer votre apprentissage.
                  </p>
                  <p>
                    <strong>Phase 1 — Prise en main de la wing :</strong> vous apprenez à gonfler, tenir et orienter la wing sur la plage, puis dans l'eau peu profonde. L'objectif est de maîtriser la génération de puissance et les transitions bâbord/tribord avant de monter sur la planche.
                  </p>
                  <p>
                    <strong>Phase 2 — Navigation sur planche large :</strong> vous naviguez debout sur une planche volumineuse et stable, propulsé par la wing, mais sans foil. Cette étape développe l'équilibre, la gestion de la puissance et les trajectoires.
                  </p>
                  <p>
                    <strong>Phase 3 — Découverte du foil via le foil tracté :</strong> grâce à une session de <Link to="/foil-tracte-hyeres" className="text-primary hover:underline">foil tracté</Link> incluse dans le stage, vous apprenez les sensations de vol et l'équilibre sur le foil <strong>sans avoir à gérer la wing</strong>. C'est la clé de notre méthode : isoler chaque compétence.
                  </p>
                  <p>
                    <strong>Phase 4 — Vol en wingfoil :</strong> une fois la wing et le foil maîtrisés séparément, vous combinez les deux pour vos premiers vols. La transition est naturelle et rapide grâce à notre méthode progressive.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-16">
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">L'Almanarre : le spot idéal pour le wingfoil</h3>
                  <p>
                    Le <Link to="/spot-kitesurf-almanarre-hyeres-var" className="text-primary hover:underline">spot de l'Almanarre</Link> offre des conditions particulièrement adaptées au wingfoil. La <strong>lagune protégée</strong> côté ouest offre une eau plate et peu profonde, parfaite pour les premières navigations sans foil et les premiers décollages en foil.
                  </p>
                  <p>
                    Le wingfoil se pratique dès <strong>12 nœuds de vent</strong>, soit bien moins que les 15-20 nœuds nécessaires pour le kitesurf. Cela signifie que les sessions sont possibles plus souvent et dans un éventail de conditions plus large. À l'Almanarre, les régimes de Mistral et de Levant offrent régulièrement ce seuil de vent.
                  </p>
                  <p>
                    Notre école étant <strong>itinérante</strong>, nous adaptons le lieu de pratique en fonction de la direction du vent. Que ce soit côté lagune (Mistral) ou côté mer (Levant), nous trouvons toujours les conditions optimales pour votre apprentissage du wingfoil à Hyères.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Wingfoil vs kitesurf : les différences clés</h3>
                  <p>
                    Le choix entre wingfoil et <Link to="/cours-kitesurf-hyeres-debutant" className="text-primary hover:underline">kitesurf</Link> dépend de vos préférences personnelles. Le <strong>kitesurf</strong> offre plus de puissance, de sauts spectaculaires et une sensation de vitesse grisante. Le <strong>wingfoil</strong> privilégie le vol silencieux, l'élégance et l'harmonie avec les éléments.
                  </p>
                  <p>
                    En termes de <strong>facilité d'apprentissage</strong>, le wingfoil a l'avantage : pas de lignes à gérer, setup plus rapide, et zone de sécurité réduite. Cependant, le foil ajoute une dimension d'équilibre supplémentaire qui demande de la pratique. Notre méthode avec <Link to="/foil-tracte-hyeres" className="text-primary hover:underline">foil tracté</Link> résout ce problème en isolant l'apprentissage du foil.
                  </p>
                  <p>
                    Le wingfoil nécessite <strong>moins de vent</strong> (12 vs 15+ nœuds) et <strong>moins d'espace</strong> que le kitesurf, ce qui en fait un sport praticable sur davantage de spots et dans des conditions plus variées. C'est un avantage décisif pour les pratiquants qui veulent naviguer le plus souvent possible.
                  </p>
                  <p>
                    Beaucoup de nos élèves finissent par pratiquer les deux disciplines, profitant des jours de vent fort pour le kitesurf et des jours de vent modéré pour le wingfoil. C'est l'avantage d'apprendre dans une école multi-disciplines comme <strong>KiteSurf Passion</strong>. Découvrez aussi le <Link to="/cours-pumpfoil-dock-start-hyeres" className="text-primary hover:underline">pumpfoil</Link> pour les jours sans vent !
                  </p>
                </div>
              </div>

              {/* Trust badges wingfoil */}
              <div className="bg-gradient-to-r from-primary/5 to-turquoise/5 rounded-3xl p-8 md:p-12 border border-primary/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div>
                    <p className="font-display text-3xl font-bold text-primary mb-2">12 nœuds</p>
                    <p className="text-muted-foreground text-sm">Vent minimum</p>
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-primary mb-2">5 jours</p>
                    <p className="text-muted-foreground text-sm">Pour voler</p>
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-primary mb-2">440€</p>
                    <p className="text-muted-foreground text-sm">Stage complet</p>
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-primary mb-2">Foil tracté</p>
                    <p className="text-muted-foreground text-sm">Inclus dans le stage</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <ActivityFAQ
          title="Questions Fréquentes Wingfoil"
          subtitle="Tout savoir sur nos cours de wingfoil à Hyères Almanarre"
          faqs={wingfoilFaqs}
          accentColor="primary"
        />

        {/* Blog Articles Section */}
        <RelatedBlogArticles
          title="Nos Articles Wingfoil"
          subtitle="Guides et conseils pour progresser en wing foil"
          articles={wingfoilBlogArticles}
          accentColor="primary"
        />

        {/* Maillage interne - Disciplines complémentaires */}
        <InternalLinking
          title="Complétez Votre Expérience"
          subtitle="Découvrez nos autres activités de glisse à Hyères"
          links={[
            disciplineLinks.pumpfoil,
            disciplineLinks.foilTracte,
            disciplineLinks.stage100,
            { ...pillarLinks.tarifs, description: "Tous nos tarifs" },
          ]}
          accentColor="ocean"
        />
      </main>

      <Footer />
    </>
  );
};

export default StageWingfoil;
