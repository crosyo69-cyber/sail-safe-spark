import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Ship, Star, Award, Clock, CheckCircle, Target, Zap, Shield, User } from "lucide-react";
import { ActivityFAQ } from "@/components/sections/ActivityFAQ";
import { InternalLinking, disciplineLinks, pillarLinks } from "@/components/sections/InternalLinking";
import { getProductRatingData } from "@/lib/seo-ratings";
import kitesurfLesson from "@/assets/kitesurf-cours-hyeres.jpg?webp";
import heroKitesurf from "@/assets/kitesurf-hyeres.jpg?webp";

const coursParticulierFaqs = [
  {
    question: "Pourquoi choisir un cours particulier de kitesurf à Hyères ?",
    answer: "Le cours particulier offre une progression 3 fois plus rapide qu'en groupe. Vous bénéficiez d'un moniteur 100% dédié qui adapte le contenu à vos objectifs et corrige vos gestes en temps réel sur le spot de l'Almanarre.",
  },
  {
    question: "Combien coûte un cours particulier de kitesurf à l'Almanarre ?",
    answer: "Le cours particulier de 2 heures avec moniteur diplômé dédié est à 230€ hors saison et 380€ en juillet/août. Tout le matériel et le bateau d'assistance sont inclus.",
  },
  {
    question: "Le cours particulier est-il adapté aux vrais débutants ?",
    answer: "Absolument ! C'est même l'option idéale pour débuter en toute confiance. L'encadrement individualisé permet de progresser à votre rythme, sans pression, avec des explications adaptées à votre niveau.",
  },
  {
    question: "Quelle est la durée idéale pour un cours particulier ?",
    answer: "Chaque séance dure 2 heures, la durée optimale pour apprendre efficacement sans fatigue excessive. Vous pouvez enchaîner plusieurs séances sur différents jours selon vos objectifs.",
  },
  {
    question: "Peut-on prendre un cours particulier à deux personnes ?",
    answer: "Oui, nous proposons des cours semi-privatifs pour 2 personnes qui souhaitent progresser ensemble. Le tarif est ajusté et vous conservez une attention quasi-individualisée de la part du moniteur.",
  },
];

const breadcrumbItems = [
  { label: "Kitesurf", href: "/cours-kitesurf-hyeres-debutant" },
  { label: "Cours Particulier" }
];

const CoursParticulier = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Cours Particulier Kitesurf",
    "description": "Cours de kitesurf 100% individualisé à Hyères. Progression rapide et sécurisée avec un moniteur diplômé dédié.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "KiteSurf Passion",
      "telephone": "+33672716905",
      "priceRange": "€€",
      "image": "https://www.kitesurfpassion.fr/og-image.jpg",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Port de Carqueiranne",
        "addressLocality": "Hyères",
        "addressRegion": "Var",
        "postalCode": "83400",
        "addressCountry": "FR"
      }
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Cours Particulier 2h - Hors saison",
        "price": "230",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "name": "Cours Particulier 2h - Juillet/Août",
        "price": "380",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      }
    ]
  };

  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Cours Particulier Kitesurf - Hyères",
    description: "Cours de kitesurf 100% individualisé de 2h à Hyères. Progression rapide et sécurisée avec moniteur diplômé dédié et bateau d'assistance.",
    image: "https://www.kitesurfpassion.fr/images/kitesurf-cours-hyeres.jpg",
    brand: {
      "@type": "Brand",
      name: "KiteSurf Passion"
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "230",
      highPrice: "380",
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
    name: "Cours particulier kitesurf Hyères",
    description: "Cours particulier de kitesurf avec moniteur dédié sur le spot de l'Almanarre à Hyères - école KiteSurf Passion Var",
    contentUrl: "https://www.kitesurfpassion.fr/assets/kitesurf-hyeres.jpg",
    thumbnailUrl: "https://www.kitesurfpassion.fr/assets/kitesurf-hyeres.jpg",
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

  const advantages = [
    { icon: User, title: "100% Dédié", desc: "Attention exclusive du moniteur" },
    { icon: Target, title: "Progression Rapide", desc: "Objectifs personnalisés" },
    { icon: Ship, title: "Bateau d'Assistance", desc: "Sécurité maximale" },
    { icon: Award, title: "Moniteur Expert", desc: "25 ans d'expérience" },
  ];

  const benefits = [
    {
      title: "Progression 3x plus rapide",
      description: "Avec toute l'attention du moniteur, vous progressez bien plus vite qu'en groupe. Chaque minute est optimisée pour votre apprentissage."
    },
    {
      title: "Programme sur mesure",
      description: "Le contenu de chaque cours est adapté à vos objectifs, votre niveau et votre rythme d'apprentissage."
    },
    {
      title: "Corrections en temps réel",
      description: "Le moniteur vous observe en permanence et peut corriger immédiatement vos gestes pour éviter les mauvaises habitudes."
    },
    {
      title: "Flexibilité totale",
      description: "Choisissez vos créneaux horaires. Les cours sont planifiés selon vos disponibilités et les conditions météo optimales."
    }
  ];

  const forWhom = [
    {
      title: "Débutants pressés",
      description: "Vous voulez apprendre rapidement et efficacement, sans contrainte de groupe."
    },
    {
      title: "Perfectionnement",
      description: "Vous avez les bases et souhaitez travailler des techniques spécifiques avec un expert."
    },
    {
      title: "Appréhensions",
      description: "Vous préférez un cadre rassurant et personnalisé pour débuter en toute confiance."
    },
    {
      title: "Emploi du temps serré",
      description: "Vous avez peu de temps et voulez maximiser chaque minute sur l'eau."
    }
  ];

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: coursParticulierFaqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer }
    }))
  };

  return (
    <>
      <Helmet>
        <title>Cours Particulier Kitesurf – Hyères Almanarre | Progression Premium</title>
        <meta
          name="description"
          content="Cours particulier kitesurf à Hyères Almanarre (Var). Leçon privée 100% individualisée, moniteur diplômé dédié, bateau sécurité, progression 3x plus rapide. Dès 230€."
        />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/cours-particulier-kitesurf-hyeres" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/cours-particulier-kitesurf-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/cours-particulier-kitesurf-hyeres" />
        <meta property="og:title" content="Cours Particulier Kitesurf – Hyères Almanarre | Progression Premium" />
        <meta property="og:description" content="Leçon privée kitesurf avec moniteur dédié à l'Almanarre Hyères. Progression rapide, encadrement premium, bateau sécurité." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/cours-particulier-kitesurf-hyeres" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Cours particulier kitesurf Hyères - École KiteSurf Passion Almanarre" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cours Particulier Kitesurf Hyères | Premium" />
        <meta name="twitter:description" content="Leçon privée kitesurf avec moniteur dédié à Hyères Almanarre." />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Cours particulier kitesurf Hyères Almanarre" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(productStructuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(imageStructuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqStructuredData)}
        </script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Kitesurf", "item": "https://www.kitesurfpassion.fr/cours-kitesurf-hyeres-debutant" },
            { "@type": "ListItem", "position": 3, "name": "Cours Particulier", "item": "https://www.kitesurfpassion.fr/cours-particulier-kitesurf-hyeres" }
          ]
        })}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroKitesurf}
              alt="Cours particulier kitesurf Hyères - Formation premium moniteur dédié école KiteSurf Passion Var"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-navy/75 via-navy/45 to-navy/25" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sunset/20 text-sunset border border-sunset/30 text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                Encadrement Premium
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6">
                Cours Particulier <span className="text-sunset">Kitesurf</span> Hyères Almanarre
              </h1>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Bénéficiez d'un cours 100% individualisé avec un moniteur diplômé entièrement dédié à votre progression. L'approche la plus efficace pour apprendre le kitesurf.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="sunset" size="lg" asChild>
                  <Link to="/contact-reservation-kitesurf-hyeres">Réserver mon cours</Link>
                </Button>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">Voir les tarifs</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Advantages Grid */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {advantages.map((item) => (
                <div key={item.title} className="bg-card rounded-2xl p-6 border border-border/50 text-center hover:border-sunset/50 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-sunset/20 to-sunset/10 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-sunset" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  Tarifs Cours Particulier
                </h2>
                <p className="text-muted-foreground">
                  Séance de 2 heures avec moniteur diplômé dédié.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-8 hover:border-sunset/50 transition-colors">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                    Hors saison
                  </span>
                  <div className="mb-4">
                    <span className="text-4xl font-display font-bold text-foreground">230€</span>
                    <span className="text-muted-foreground ml-2">/ 2 heures</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Moniteur 100% dédié
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Matériel complet fourni
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Bateau d'assistance
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Assurance incluse
                    </li>
                  </ul>
                  <Button variant="sunset" className="w-full" asChild>
                    <Link to="/contact-reservation-kitesurf-hyeres">Réserver</Link>
                  </Button>
                </div>

                <div className="bg-card border-2 border-sunset rounded-2xl p-8 relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-sunset text-white text-sm font-medium rounded-full">
                    Haute saison
                  </span>
                  <span className="inline-block px-3 py-1 bg-sunset/10 text-sunset text-sm font-medium rounded-full mb-4">
                    Juillet / Août
                  </span>
                  <div className="mb-4">
                    <span className="text-4xl font-display font-bold text-foreground">380€</span>
                    <span className="text-muted-foreground ml-2">/ 2 heures</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-sunset" />
                      Moniteur 100% dédié
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-sunset" />
                      Matériel complet fourni
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-sunset" />
                      Bateau d'assistance
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-sunset" />
                      Assurance incluse
                    </li>
                  </ul>
                  <Button variant="sunset" className="w-full" asChild>
                    <Link to="/contact-reservation-kitesurf-hyeres">Réserver</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <img 
                  src={kitesurfLesson} 
                  alt="Cours particulier kitesurf moniteur Hyères - Encadrement premium école KiteSurf Passion Almanarre" 
                  loading="lazy"
                  decoding="async"
                  className="rounded-2xl shadow-2xl w-full aspect-[4/3] object-cover"
                />
              </div>
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sunset/10 text-sunset text-sm font-medium mb-4">
                  <Zap className="w-4 h-4" />
                  Avantages Premium
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  Pourquoi Choisir un Cours Particulier ?
                </h2>
                <div className="space-y-6">
                  {benefits.map((benefit) => (
                    <div key={benefit.title} className="flex gap-4">
                      <div className="w-8 h-8 bg-sunset/10 rounded-lg flex items-center justify-center shrink-0 mt-1">
                        <CheckCircle className="w-5 h-5 text-sunset" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-1">{benefit.title}</h3>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Whom Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Pour Qui ?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Le cours particulier s'adapte à tous les profils et tous les niveaux.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {forWhom.map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-2xl p-6 hover:border-sunset/50 transition-colors">
                  <div className="w-12 h-12 mb-4 bg-gradient-to-br from-sunset/20 to-sunset/10 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-sunset" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instructor Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-turquoise/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Award className="w-4 h-4" />
                Votre Moniteur
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                Yoanne Cros, 25 Ans d'Expérience
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Moniteur diplômé d'État BPJEPS et formateur de moniteurs, Yoanne vous transmet sa passion et son expertise. Sa parfaite connaissance du spot de l'Almanarre garantit des conditions d'apprentissage optimales.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">BPJEPS</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                  <Star className="w-5 h-5 text-sunset" />
                  <span className="text-sm font-medium">Formateur de moniteurs</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">25+ ans</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Offers Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                Autres Formules Kitesurf
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                to="/stage-kitesurf-100-glisse-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-sunset/50 transition-colors group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-sunset transition-colors">Stage 100% Glisse</h3>
                <p className="text-muted-foreground text-sm mb-3">5 jours consécutifs pour l'autonomie</p>
                <span className="text-sunset text-sm font-medium">Dès 399€ →</span>
              </Link>
              <Link 
                to="/session-kitesurf-carte-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-sunset/50 transition-colors group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-sunset transition-colors">Cours à la Carte</h3>
                <p className="text-muted-foreground text-sm mb-3">Flexibilité totale</p>
                <span className="text-sunset text-sm font-medium">Dès 120€ →</span>
              </Link>
              <Link 
                to="/location-materiel-kitesurf-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-sunset/50 transition-colors group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-sunset transition-colors">Location Matériel</h3>
                <p className="text-muted-foreground text-sm mb-3">Pratiquez en autonomie</p>
                <span className="text-sunset text-sm font-medium">Dès 30€/jour →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <ActivityFAQ
          title="Questions Fréquentes Kitesurf"
          subtitle="Tout savoir sur nos cours particuliers à Hyères Almanarre"
          faqs={coursParticulierFaqs}
          accentColor="sunset"
        />

        {/* Maillage interne - Autres formules */}
        <InternalLinking
          title="Autres Formules Kitesurf"
          subtitle="Découvrez toutes nos offres de cours à Hyères"
          links={[
            disciplineLinks.stage100,
            disciplineLinks.sessionCarte,
            disciplineLinks.wingfoil,
            { ...pillarLinks.tarifs, description: "Tous nos tarifs" },
          ]}
          accentColor="sunset"
        />

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-navy via-navy to-sunset/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
              Prêt pour Votre Cours Privé ?
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
              Offrez-vous une expérience d'apprentissage premium avec un moniteur dédié à 100% à votre progression.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="sunset" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Réserver maintenant</Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <a href="tel:0672716905">06 72 71 69 05</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default CoursParticulier;
