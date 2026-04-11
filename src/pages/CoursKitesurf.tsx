import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Ship, Users, Clock, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { InternalLinking, disciplineLinks, pillarLinks } from "@/components/sections/InternalLinking";
import { getProductRatingData } from "@/lib/seo-ratings";
import kitesurfImage from "@/assets/kitesurf-cours-hyeres.jpg?webp";

const breadcrumbItems = [
  { label: "Cours Kitesurf" }
];

const stages = [
  {
    name: "Stage 100% Glisse",
    sessions: "5 jours consécutifs",
    duration: "Groupe 3-4 personnes",
    price: "399€",
    priceNote: "Hors saison (499€ juil./août)",
    description: "Le stage complet pour devenir autonome. En cas de jours sans vent : planche tractée et foil tracté inclus.",
    features: [
      "5 jours consécutifs de formation",
      "Pilotage aile + waterstart + navigation",
      "Foil tracté inclus (jours sans vent)",
      "Bateau d'assistance permanent",
      "Autonomie garantie",
    ],
    popular: true,
  },
  {
    name: "Stage Semi-Privé",
    sessions: "5 jours",
    duration: "2 personnes / 1 moniteur",
    price: "599€",
    priceNote: "Hors saison (699€ juil./août)",
    description: "Progression accélérée avec seulement 2 élèves par moniteur.",
    features: [
      "2 élèves maximum par moniteur",
      "Attention personnalisée",
      "Progression rapide",
      "Horaires flexibles",
    ],
  },
  {
    name: "Cours Particulier",
    sessions: "2 heures",
    duration: "1 personne / 1 moniteur",
    price: "230€",
    priceNote: "Hors saison (380€ juil./août)",
    description: "Progression maximale avec un moniteur dédié et radios interactives.",
    features: [
      "1 moniteur pour 1 élève",
      "Radios interactives incluses",
      "Programme personnalisé",
      "Horaires au choix",
    ],
  },
];

const programSteps = [
  {
    day: "Jour 1",
    title: "Découverte & Sécurité",
    content: "Présentation du matériel, règles de sécurité, fenêtre de vent. Pilotage de l'aile sur la plage.",
  },
  {
    day: "Jour 2",
    title: "Premiers Pas dans l'Eau",
    content: "Bodydrag, nage tractée par l'aile, gestion de la puissance dans l'eau.",
  },
  {
    day: "Jour 3",
    title: "Waterstart",
    content: "Mise en place de la planche, premiers waterstarts, gestion de l'équilibre.",
  },
  {
    day: "Jour 4",
    title: "Navigation",
    content: "Premiers bords, maintien de la trajectoire, arrêts contrôlés.",
  },
  {
    day: "Jour 5",
    title: "Autonomie",
    content: "Remonter au vent, virages, validation de l'autonomie. Vous êtes prêt à naviguer seul !",
  },
];

const CoursKitesurf = () => {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Combien de temps faut-il pour apprendre le kitesurf ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "En moyenne, 5 séances de 3 heures (soit un stage de 5 jours) suffisent pour devenir autonome. Notre pédagogie avec bateau d'assistance accélère considérablement la progression.",
        },
      },
      {
        "@type": "Question",
        name: "Quel est le prix d'un stage de kitesurf à Hyères ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Notre stage 100% Glisse (5 jours consécutifs) est à 399€ hors saison et 499€ en juillet/août. Tout est inclus : matériel, combinaison, bateau d'assistance et foil tracté en cas de jour sans vent.",
        },
      },
      {
        "@type": "Question",
        name: "Le kitesurf est-il accessible aux débutants ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui ! Le kitesurf est accessible à tous dès 10 ans (35 kg minimum). Notre encadrement avec bateau d'assistance et notre spot protégé de l'Almanarre sont idéaux pour débuter en toute sécurité.",
        },
      },
      {
        "@type": "Question",
        name: "Pourquoi un bateau d'assistance est-il important ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le bateau permet de vous récupérer rapidement si vous dérivez, de vous ramener au point de départ et d'intervenir en cas de problème. C'est un gain de temps énorme pour votre apprentissage.",
        },
      },
      {
        "@type": "Question",
        name: "Quelle est la meilleure période pour apprendre le kitesurf à Hyères ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "L'Almanarre bénéficie de vents réguliers de mars à novembre. Le Mistral et le Levant offrent d'excellentes conditions. L'été combine eau chaude et vent régulier, idéal pour débuter.",
        },
      },
    ],
  };

  const courseStructuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Stage Kitesurf Débutant",
    description: "Stage de kitesurf 5 jours pour débutants avec bateau d'assistance à Hyères",
    provider: {
      "@type": "Organization",
      name: "KiteSurf Passion",
      sameAs: "https://www.kitesurfpassion.fr",
    },
    offers: {
      "@type": "Offer",
      price: "399",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  };

  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Stage Kitesurf 100% Glisse - Hyères",
    description: "Stage de kitesurf 5 jours pour débutants avec bateau d'assistance à l'Almanarre, Hyères. Devenez autonome en kitesurf avec un moniteur diplômé d'État.",
    image: "https://www.kitesurfpassion.fr/images/kitesurf-cours-hyeres.jpg",
    brand: {
      "@type": "Brand",
      name: "KiteSurf Passion"
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "230",
      highPrice: "599",
      priceCurrency: "EUR",
      offerCount: 3,
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
    name: "Stage kitesurf Hyères Almanarre",
    description: "Formation kitesurf avec élèves et moniteur diplômé sur le spot de l'Almanarre à Hyères - école KiteSurf Passion",
    contentUrl: "https://www.kitesurfpassion.fr/images/kitesurf-cours-hyeres.jpg",
    thumbnailUrl: "https://www.kitesurfpassion.fr/images/kitesurf-cours-hyeres.jpg",
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

  // HowTo schema for learning steps - helps with "How to" rich snippets
  const howToStructuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Comment apprendre le kitesurf à Hyères en 5 jours",
    description: "Guide complet pour apprendre le kitesurf avec notre stage 100% Glisse à l'Almanarre. De la découverte à l'autonomie en 5 séances.",
    image: "https://www.kitesurfpassion.fr/images/kitesurf-cours-hyeres.jpg",
    totalTime: "PT15H",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: "399"
    },
    supply: [
      { "@type": "HowToSupply", name: "Aile de kitesurf (fournie)" },
      { "@type": "HowToSupply", name: "Planche twin-tip (fournie)" },
      { "@type": "HowToSupply", name: "Harnais (fourni)" },
      { "@type": "HowToSupply", name: "Combinaison néoprène (fournie)" },
      { "@type": "HowToSupply", name: "Casque et gilet (fournis)" }
    ],
    tool: [
      { "@type": "HowToTool", name: "Bateau d'assistance" },
      { "@type": "HowToTool", name: "Radio de communication" }
    ],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Découverte & Sécurité",
        text: "Présentation du matériel, règles de sécurité, fenêtre de vent. Pilotage de l'aile sur la plage pour comprendre les bases.",
        image: "https://www.kitesurfpassion.fr/images/kitesurf-cours-hyeres.jpg"
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Premiers Pas dans l'Eau",
        text: "Bodydrag, nage tractée par l'aile, gestion de la puissance dans l'eau. Apprentissage du contrôle de l'aile en milieu aquatique."
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Waterstart",
        text: "Mise en place de la planche, premiers waterstarts, gestion de l'équilibre. La technique clé pour décoller sur l'eau."
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Navigation",
        text: "Premiers bords, maintien de la trajectoire, arrêts contrôlés. Vous commencez à naviguer de manière autonome."
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Autonomie",
        text: "Remonter au vent, virages, validation de l'autonomie. Vous êtes prêt à naviguer seul sur le spot de l'Almanarre !"
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Cours Kitesurf Débutant Hyères | Stage 5 Séances | Bateau Assistance</title>
        <meta
          name="description"
          content="Apprenez le kitesurf à Hyères avec notre stage débutant 5 séances. Bateau d'assistance, moniteur expert, spot Almanarre idéal. Autonomie garantie !"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/cours-kitesurf-hyeres-debutant" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/cours-kitesurf-hyeres-debutant" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/cours-kitesurf-hyeres-debutant" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Cours Kitesurf Débutant Hyères | Kitesurf Passion – Bateau d'Assistance" />
        <meta property="og:description" content="Stage kitesurf 5 jours dès 399€ à Hyères. Bateau d'assistance, moniteur diplômé, spot Almanarre. Devenez autonome !" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/cours-kitesurf-hyeres-debutant" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Cours de kitesurf débutant à Hyères - École KiteSurf Passion Almanarre" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cours Kitesurf Débutant Hyères" />
        <meta name="twitter:description" content="Stage kitesurf 5 jours avec bateau d'assistance à Hyères Almanarre." />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Cours kitesurf Hyères Almanarre" />
        
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(courseStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(productStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(imageStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Cours Kitesurf", "item": "https://www.kitesurfpassion.fr/cours-kitesurf-hyeres-debutant" }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify(howToStructuredData)}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={kitesurfImage}
              alt="Stage kitesurf Hyères Almanarre - Formation élèves école KiteSurf Passion Var"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-navy/20" />
          </div>

          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-2xl">
              <span className="inline-block text-sunset font-semibold mb-4">Cours Kitesurf</span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
                Apprenez le Kitesurf à Hyères
              </h1>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Stage 100% Glisse sur 5 jours consécutifs avec bateau d'assistance pour une progression rapide et sécurisée sur le spot de l'Almanarre.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="sunset" size="lg" asChild>
                  <a href="#tarifs">
                    Voir les Tarifs
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </Button>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/contact-reservation-kitesurf-hyeres">Réserver</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Avantages */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Ship, title: "Bateau d'Assistance", desc: "Sécurité maximale" },
                { icon: Users, title: "Petits Groupes", desc: "3-4 élèves / moniteur" },
                { icon: Clock, title: "5 Jours Consécutifs", desc: "Stage intensif" },
                { icon: Award, title: "Moniteur Diplômé", desc: "25 ans d'expérience" },
              ].map((item) => (
                <div key={item.title} className="bg-card rounded-2xl p-6 border border-border/50 text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Programme */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Programme du Stage Kitesurf
              </h2>
              <p className="text-muted-foreground text-lg">
                5 séances progressives pour passer de débutant à rider autonome
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {programSteps.map((step, index) => (
                  <div key={step.day} className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      {index < programSteps.length - 1 && (
                        <div className="w-0.5 h-full bg-primary/20 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 bg-card rounded-2xl p-6 border border-border/50">
                      <span className="text-primary font-semibold text-sm">{step.day}</span>
                      <h3 className="font-display font-bold text-foreground text-xl mt-1 mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.content}</p>
                    </div>
                  </div>
                ))}
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
                  Tout Savoir sur l'Apprentissage du{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">Kitesurf à Hyères</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                  Un guide complet pour comprendre notre méthode, choisir la bonne formule et maximiser votre progression sur le spot de l'Almanarre.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-16">
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Notre méthode pédagogique unique</h3>
                  <p>
                    Chez <strong>KiteSurf Passion</strong>, l'apprentissage du kitesurf ne se résume pas à vous mettre une aile dans les mains et vous pousser dans l'eau. Notre pédagogie, affinée pendant plus de <strong>25 ans d'enseignement</strong> et plus de 2 500 élèves formés, suit une progression rigoureuse et éprouvée qui garantit votre autonomie.
                  </p>
                  <p>
                    La première journée est entièrement consacrée à la <strong>sécurité et au pilotage de l'aile sur la plage</strong>. C'est une étape cruciale que beaucoup d'écoles raccourcissent pour gagner du temps, mais qui est fondamentale pour votre sécurité future. Vous apprenez la fenêtre de vent, les systèmes de sécurité de l'aile (largages), et le pilotage précis qui vous permettra de contrôler la puissance.
                  </p>
                  <p>
                    Dès le deuxième jour, vous entrez dans l'eau pour le <strong>bodydrag</strong> — la nage tractée par l'aile. Cette technique vous apprend à vous déplacer dans l'eau en utilisant la puissance de l'aile, à récupérer votre planche après une chute, et à remonter au vent sans planche. C'est une compétence de sécurité indispensable que tout kitesurfeur doit maîtriser.
                  </p>
                  <p>
                    Les jours 3 à 5 sont dédiés au <strong>waterstart</strong> et à la <strong>navigation</strong>. Le waterstart — le fait de se lever sur la planche grâce à la traction de l'aile — est le moment déclic que tous nos élèves attendent. Grâce à notre <Link to="/blog/pourquoi-bateau-assistance-essentiel" className="text-primary hover:underline">bateau d'assistance</Link> et aux radios de communication, votre moniteur vous guide en temps réel pour corriger votre posture et optimiser chaque tentative.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Pourquoi choisir une école certifiée FFVL ?</h3>
                  <p>
                    Le kitesurf est un sport qui peut présenter des risques si l'encadrement n'est pas professionnel. Choisir une <strong>école labellisée FFVL (Fédération Française de Vol Libre)</strong> et <strong>EFK (École Française de Kite)</strong>, c'est l'assurance d'un cadre réglementé, d'un matériel aux normes et d'un moniteur diplômé.
                  </p>
                  <p>
                    Notre moniteur <strong>Yoanne Cros</strong> détient le <strong>BPJEPS</strong> (Brevet Professionnel de la Jeunesse, de l'Éducation Populaire et du Sport), seul diplôme autorisant l'enseignement du kitesurf contre rémunération en France. Mais il va bien au-delà : en tant que <strong>formateur de moniteurs pour la FFVL</strong>, il forme lui-même les futurs enseignants de kitesurf. C'est une garantie de compétence pédagogique rare dans la profession.
                  </p>
                  <p>
                    La certification FFVL implique également un <strong>contrôle régulier du matériel</strong>, un ratio élèves/moniteur encadré, et une assurance responsabilité civile professionnelle. Pour les stages de kitesurf et de <Link to="/stage-wingfoil-hyeres-almanarre" className="text-primary hover:underline">wingfoil</Link>, une licence FFVL est obligatoire pour couvrir l'élève pendant la pratique.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-16">
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Stage vs cours particulier : quelle formule choisir ?</h3>
                  <p>
                    Le choix entre le <Link to="/stage-kitesurf-100-glisse-hyeres" className="text-primary hover:underline"><strong>stage 100% Glisse</strong></Link> sur 5 jours et le <Link to="/cours-particulier-kitesurf-hyeres" className="text-primary hover:underline"><strong>cours particulier</strong></Link> dépend de votre profil, de vos disponibilités et de votre budget.
                  </p>
                  <p>
                    Le <strong>stage intensif</strong> est notre formule la plus populaire et offre le meilleur rapport qualité-prix. Sur 5 jours consécutifs, vous bénéficiez d'une immersion totale qui favorise la mémorisation musculaire. En groupe de 3-4 personnes, l'émulation collective stimule la progression et rend l'apprentissage plus ludique. C'est la formule idéale si vous disposez d'une semaine de vacances à Hyères.
                  </p>
                  <p>
                    Le <strong>cours particulier</strong> (2 heures en tête-à-tête avec le moniteur) convient aux personnes souhaitant une <strong>progression accélérée</strong> ou ayant des contraintes de planning. Le ratio 1:1 permet un encadrement premium : chaque seconde est optimisée, les corrections sont immédiates, et le programme est 100% adapté à vos points forts et axes de progression.
                  </p>
                  <p>
                    Les <Link to="/session-kitesurf-carte-hyeres" className="text-primary hover:underline"><strong>sessions à la carte</strong></Link> offrent une troisième option, parfaite pour les résidents locaux ou les vacanciers qui souhaitent pratiquer à leur rythme sans s'engager sur un stage complet.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Les conditions idéales sur le spot de l'Almanarre</h3>
                  <p>
                    Le <Link to="/spot-kitesurf-almanarre-hyeres-var" className="text-primary hover:underline"><strong>spot de l'Almanarre</strong></Link> à Hyères est notre terrain de jeu quotidien. Situé sur la presqu'île de Giens, il offre des conditions d'apprentissage exceptionnelles reconnues par les kitesurfeurs du monde entier.
                  </p>
                  <p>
                    <strong>Le Mistral</strong> (nord-ouest, 300+ jours/an dans le Var) génère un vent latéral parfait pour l'apprentissage côté lagune. L'eau y est plate, peu profonde et le fond sablonneux — des conditions rêvées pour un débutant. <strong>Le Levant</strong> (est) offre des sessions plus engagées côté pleine mer, idéales pour les riders intermédiaires et confirmés.
                  </p>
                  <p>
                    Notre école est <strong>itinérante</strong> : selon la direction du vent du jour, nous nous déplaçons des deux côtés de la presqu'île pour toujours trouver les meilleures conditions. Cette flexibilité, combinée à notre connaissance intime du spot acquise en 25 ans, vous garantit des sessions productives quelle que soit la météo.
                  </p>
                  <p>
                    La <strong>saison de navigation</strong> s'étend de mars à novembre, avec un pic d'activité en été. Les mois de juin et septembre offrent souvent le meilleur compromis : vent régulier, eau chaude, et moins de monde sur le spot. Consultez nos <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="text-primary hover:underline">tarifs basse/haute saison</Link> pour optimiser votre budget.
                  </p>
                </div>
              </div>

              {/* Chiffres clés */}
              <div className="bg-gradient-to-r from-primary/5 to-turquoise/5 rounded-3xl p-8 md:p-12 border border-primary/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div>
                    <p className="font-display text-3xl font-bold text-primary mb-2">5 jours</p>
                    <p className="text-muted-foreground text-sm">Pour devenir autonome</p>
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-primary mb-2">3-4 max</p>
                    <p className="text-muted-foreground text-sm">Élèves par moniteur</p>
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-primary mb-2">200+</p>
                    <p className="text-muted-foreground text-sm">Jours de vent/an</p>
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-primary mb-2">100%</p>
                    <p className="text-muted-foreground text-sm">Matériel inclus</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tarifs */}
        <section id="tarifs" className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Nos Formules Kitesurf
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {stages.map((stage) => (
                <div
                  key={stage.name}
                  className={`bg-card rounded-3xl p-8 border ${
                    stage.popular ? "border-primary shadow-glow" : "border-border/50"
                  } relative`}
                >
                  {stage.popular && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm px-4 py-1 rounded-full font-bold">
                      Le Plus Populaire
                    </span>
                  )}
                  <h3 className="font-display font-bold text-foreground text-xl mb-2">{stage.name}</h3>
                  <p className="text-muted-foreground text-sm mb-1">{stage.sessions}</p>
                  <p className="text-muted-foreground text-sm mb-4">{stage.duration}</p>
                  <p className="font-display text-4xl font-bold text-foreground mb-1">{stage.price}</p>
                  <p className="text-primary text-sm mb-4">{stage.priceNote}</p>
                  <p className="text-muted-foreground text-sm mb-6">{stage.description}</p>
                  <ul className="space-y-3 mb-8">
                    {stage.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={stage.popular ? "sunset" : "outline"}
                    className="w-full"
                    asChild
                  >
                    <Link to="/contact-reservation-kitesurf-hyeres">Réserver</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <InternalLinking
          title="Disciplines Complémentaires"
          links={Object.values(disciplineLinks).filter(l => l.href !== "/cours-kitesurf-hyeres-debutant")}
        />
        <InternalLinking
          title="Informations Pratiques"
          links={Object.values(pillarLinks)}
        />
      </main>

      <Footer />
    </>
  );
};

export default CoursKitesurf;
