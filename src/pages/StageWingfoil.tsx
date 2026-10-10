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
    title: "Wingfoil à l'Almanarre : Conditions et Pratique",
    excerpt: "Découvrez les conditions de navigation et les repères pour pratiquer le wingfoil à l'Almanarre.",
  },
];
const wingfoilFaqs = [
  {
    question: "Le wingfoil est-il plus facile que le kitesurf à apprendre ?",
    answer: "Il n'existe pas de réponse valable pour tous les élèves. En wingfoil, l'aile se tient à la main, sans lignes ; l'équilibre sur le foil demande un apprentissage spécifique. La progression dépend de votre expérience, du matériel et des conditions.",
  },
  {
    question: "Quel vent faut-il pour pratiquer le wingfoil à l'Almanarre ?",
    answer: "Le vent nécessaire dépend de votre poids, de votre niveau et du matériel utilisé. Le moniteur évalue également les rafales, la direction du vent et l'état de la mer avant de confirmer la séance.",
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
    question: "Comment le lieu d'apprentissage du wingfoil est-il choisi ?",
    answer: "Notre école itinérante choisit le lieu selon le vent, l'état de la mer, la profondeur et votre niveau. Le bateau d'assistance accompagne la séance et permet au moniteur d'intervenir en cas de difficulté.",
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
          text: "Il n'existe pas de réponse valable pour tous les élèves. En wingfoil, l'aile se tient à la main, sans lignes ; l'équilibre sur le foil demande un apprentissage spécifique. La progression dépend de votre expérience, du matériel et des conditions.",
        },
      },
      {
        "@type": "Question",
        name: "Quel vent faut-il pour faire du wingfoil ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le vent nécessaire dépend de votre poids, de votre niveau et du matériel utilisé. Le moniteur évalue également les rafales, la direction du vent et l'état de la mer avant de confirmer la séance.",
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
           content="Stage wingfoil 5 jours à Hyères Almanarre avec Kitesurf Passion. Foil tracté inclus, moniteur diplômé, cours adaptés à votre niveau avec bateau d'assistance. Dès 440€."
         />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Stage Wingfoil Hyères | Kitesurf Passion – Cours Wing Foil Var" />
        <meta property="og:description" content="Apprenez le wingfoil à Hyères dès 440€. Aile tenue à la main, foil tracté inclus, bateau d'assistance. Volez sur l'eau !" />
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
        <meta name="twitter:description" content="Cours wingfoil dès 440€ à Hyères. Foil tracté inclus et cours adaptés à votre niveau." />
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
                Une aile tenue à la main et une planche équipée d'un foil : apprenez à les utiliser lors de cours adaptés à votre niveau.
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
                  En wingfoil, une aile tenue à la main propulse une planche équipée d'un foil. L'apprentissage porte sur le maniement de l'aile, l'équilibre et le contrôle du foil, avec des exercices adaptés aux acquis de chaque élève.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {[
                  "Aile tenue directement à la main",
                  "Pas de lignes à gérer",
                  "Sensations de vol uniques",
                  "Conditions évaluées avant la séance",
                  "Silencieux et écologique",
                  "Exercices adaptés à votre niveau",
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
                    Le <strong>wingfoil</strong> (ou wing foil) combine une <strong>aile tenue à la main</strong> (la wing) et une planche équipée d'un <strong>hydrofoil</strong> — un appendice immergé qui soulève la planche hors de l'eau à partir d'une certaine vitesse.
                  </p>
                  <p>
                    Le résultat ? Une <strong>sensation de vol silencieuse et écologique</strong> au-dessus de l'eau, sans moteur, sans bruit, uniquement propulsé par le vent. C'est cette expérience unique qui séduit un nombre croissant de pratiquants chaque année, des adolescents aux retraités sportifs.
                  </p>
                  <p>
                    En kitesurf, l'aile est reliée au pratiquant par des lignes et pilotée avec une barre. En wingfoil, vous êtes en <strong>contact direct avec l'aile</strong>, tenue par ses poignées ou son wishbone. Chaque discipline demande d'apprendre ses gestes de pilotage et de respecter une distance de sécurité adaptée aux conditions.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Notre méthode d'apprentissage progressive</h3>
                  <p>
                    Notre <strong>stage wingfoil 5 jours</strong> à l'Almanarre sépare l'apprentissage de l'aile et celui du foil avant de les associer.
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
                    <strong>Phase 4 — Vol en wingfoil :</strong> une fois la wing et le foil maîtrisés séparément, vous combinez les deux pour vos premiers vols. Les exercices sont adaptés à votre maîtrise de chaque étape.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-16">
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Pratiquer le wingfoil autour de l'Almanarre</h3>
                  <p>
                    Le <Link to="/spot-kitesurf-almanarre-hyeres-var" className="text-primary hover:underline">spot de l'Almanarre</Link> fait partie des lieux de pratique de notre école. Le moniteur vérifie le <strong>vent, l'état de la mer et la profondeur</strong> avant de choisir une zone adaptée aux exercices, notamment pour éviter que le foil touche le fond.
                  </p>
                  <p>
                    Le vent nécessaire pour naviguer dépend du <strong>poids du pratiquant, de son niveau et du matériel</strong>. La force moyenne du vent ne suffit pas à décider : les rafales, la direction du vent et l'état de la mer sont également pris en compte.
                  </p>
                  <p>
                    Notre école étant <strong>itinérante</strong>, nous adaptons le lieu de pratique en fonction de la direction du vent. La séance est confirmée en fonction des conditions observées et de votre niveau ; aucun lieu ne garantit des conditions navigables tous les jours.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Wingfoil vs kitesurf : les différences clés</h3>
                  <p>
                    Le choix entre wingfoil et <Link to="/cours-kitesurf-hyeres-debutant" className="text-primary hover:underline">kitesurf</Link> dépend de vos préférences personnelles. Le <strong>kitesurf</strong> utilise une aile reliée à une barre par des lignes. Le <strong>wingfoil</strong> associe une aile tenue à la main à une planche équipée d'un foil.
                  </p>
                  <p>
                    L'<strong>apprentissage du wingfoil</strong> porte sur le maniement de l'aile et l'équilibre sur le foil. Ces deux compétences demandent de la pratique. Notre méthode avec <Link to="/foil-tracte-hyeres" className="text-primary hover:underline">foil tracté</Link> permet de travailler l'équilibre sur le foil sans gérer l'aile.
                  </p>
                  <p>
                    Pour les deux disciplines, les conditions de pratique dépendent du <strong>matériel, du niveau et de la météo</strong>. En wingfoil comme en kitesurf, il faut disposer d'une zone autorisée et d'un espace suffisant pour naviguer et intervenir en cas de difficulté.
                  </p>
                  <p>
                    <strong>KiteSurf Passion</strong> propose des cours dans les deux disciplines. Le moniteur peut vous présenter leurs exigences respectives et vous conseiller selon votre expérience et vos objectifs. Découvrez aussi le <Link to="/cours-pumpfoil-dock-start-hyeres" className="text-primary hover:underline">pumpfoil</Link> pour les jours sans vent !
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
