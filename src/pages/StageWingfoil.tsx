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
      "@type": "Organization",
      name: "KiteSurf Passion",
      sameAs: "https://www.kitesurfpassion.fr",
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
    image: "https://www.kitesurfpassion.fr/assets/wingfoil-hyeres.jpg",
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
    contentUrl: "https://www.kitesurfpassion.fr/assets/wingfoil-hyeres.jpg",
    thumbnailUrl: "https://www.kitesurfpassion.fr/assets/wingfoil-hyeres.jpg",
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
        <title>Stage Wingfoil Hyères Almanarre | Cours Wing Foil Var</title>
        <meta
          name="description"
          content="Stage wingfoil Hyères Almanarre : sport tendance accessible à tous. Cours avec bateau d'assistance, moniteur diplômé. Dès 440€ le stage 5 jours."
        />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" />
        <link rel="alternate" hrefLang="fr" href="https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Stage Wingfoil Hyères Almanarre | Cours Wing Foil Var" />
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
        
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(courseStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(productStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(imageStructuredData)}</script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: wingfoilFaqs.map(faq => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer }
            }))
          })}
        </script>
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
          "image": "https://www.kitesurfpassion.fr/assets/wingfoil-hyeres.jpg",
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
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={wingfoilImage}
              alt="Stage wingfoil Hyères Almanarre - Cours wing foil école KiteSurf Passion Var"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-navy/20" />
          </div>

          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-2xl">
              <span className="inline-block text-sunset font-semibold mb-4">Wing Foil</span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
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
