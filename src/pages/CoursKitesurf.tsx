import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Ship, Users, Clock, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { getProductRatingData } from "@/lib/seo-ratings";
import kitesurfImage from "@/assets/kitesurf-cours-hyeres.jpg";

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
    image: "https://www.kitesurfpassion.fr/assets/kitesurf-cours-hyeres.jpg",
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
    contentUrl: "https://www.kitesurfpassion.fr/assets/kitesurf-cours-hyeres.jpg",
    thumbnailUrl: "https://www.kitesurfpassion.fr/assets/kitesurf-cours-hyeres.jpg",
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
    image: "https://www.kitesurfpassion.fr/assets/kitesurf-cours-hyeres.jpg",
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
        image: "https://www.kitesurfpassion.fr/assets/kitesurf-cours-hyeres.jpg"
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
        <link rel="alternate" hrefLang="fr" href="https://www.kitesurfpassion.fr/cours-kitesurf-hyeres-debutant" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/cours-kitesurf-hyeres-debutant" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Cours Kitesurf Débutant Hyères | Stage avec Bateau d'Assistance" />
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

        {/* Tarifs */}
        <section id="tarifs" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Tarifs Stage Kitesurf
              </h2>
              <p className="text-muted-foreground text-lg">
                Choisissez la formule adaptée à vos objectifs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {stages.map((stage) => (
                <div
                  key={stage.name}
                  className={`relative bg-card rounded-3xl p-8 border ${
                    stage.popular
                      ? "border-primary shadow-glow"
                      : "border-border/50"
                  }`}
                >
                  {stage.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                      Populaire
                    </div>
                  )}

                  <h3 className="font-display font-bold text-xl text-foreground mb-2">{stage.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{stage.description}</p>

                  <div className="mb-6">
                    <span className="font-display text-4xl font-bold text-foreground">{stage.price}</span>
                    <span className="text-muted-foreground"> / {stage.sessions}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {stage.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-foreground">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
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

            {/* Links to dedicated pages */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-6">Découvrez nos formules en détail :</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="outline" asChild>
                  <Link to="/stage-kitesurf-100-glisse-hyeres">Stage 100% Glisse</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/session-kitesurf-carte-hyeres">Cours à la Carte</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/cours-particulier-kitesurf-hyeres">Cours Particulier</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Related Activities */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Découvrez Aussi
              </h2>
              <p className="text-muted-foreground">Nos autres activités de glisse à Hyères</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                to="/stage-wingfoil-hyeres-almanarre"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stage Wing Foil</h3>
                <p className="text-muted-foreground text-sm">Volez sur l'eau avec cette discipline tendance</p>
              </Link>
              <Link 
                to="/cours-pumpfoil-dock-start-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Initiation Pump Foil</h3>
                <p className="text-muted-foreground text-sm">Sans vent, sans vagues : dock start</p>
              </Link>
              <Link 
                to="/location-materiel-kitesurf-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Location Matériel</h3>
                <p className="text-muted-foreground text-sm">Louez votre équipement complet</p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default CoursKitesurf;
