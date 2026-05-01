import { Helmet } from "react-helmet-async";
import { trackPhoneClick } from "@/lib/analytics";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Ship, Users, Award, Clock, CheckCircle, Calendar, Target, Zap, Shield, Radio } from "lucide-react";
import { ActivityFAQ } from "@/components/sections/ActivityFAQ";
import { InternalLinking, disciplineLinks, pillarLinks } from "@/components/sections/InternalLinking";
import { getProductRatingData } from "@/lib/seo-ratings";
import kitesurfLesson from "@/assets/stage-100-glisse-action.jpg?webp";
import hero100Glisse from "@/assets/hero-100-glisse.jpg?webp";

const stage100GlisseFaqs = [
  {
    question: "Combien de temps dure le stage 100% Glisse à Hyères ?",
    answer: "Le stage 100% Glisse dure 5 jours consécutifs, à raison de 3 heures par jour. Cette immersion intensive sur le spot de l'Almanarre permet une progression optimale vers l'autonomie en kitesurf.",
  },
  {
    question: "Quel est le prix du stage kitesurf 100% Glisse à l'Almanarre ?",
    answer: "Le stage est à 399€ hors saison et 499€ en juillet/août. Ce tarif inclut tout le matériel (aile, planche, combinaison, harnais), le bateau d'assistance permanent et l'encadrement par un moniteur diplômé d'État.",
  },
  {
    question: "Pourquoi choisir l'Almanarre pour apprendre le kitesurf ?",
    answer: "L'Almanarre à Hyères est l'un des meilleurs spots de France pour débuter : eau peu profonde, vents réguliers (Mistral et Levant), espace dégagé et cadre naturel exceptionnel. Notre école y est implantée depuis 1999.",
  },
  {
    question: "Le bateau d'assistance est-il vraiment utile pour apprendre ?",
    answer: "Absolument ! Le bateau vous récupère si vous dérivez, vous ramène au point de départ rapidement et intervient en cas de besoin. Vous passez plus de temps à naviguer et moins à nager, ce qui accélère votre progression.",
  },
  {
    question: "À quel niveau peut-on espérer arriver après le stage ?",
    answer: "À la fin des 5 jours, vous serez capable de naviguer de manière autonome : départ de la plage, navigation dans les deux sens, remontée au vent et arrêts contrôlés. Vous pourrez ensuite louer du matériel et pratiquer seul.",
  },
];

const breadcrumbItems = [
  { label: "Kitesurf", href: "/cours-kitesurf-hyeres-debutant" },
  { label: "Stage 100% Glisse" }
];

const Stage100Glisse = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Stage Kitesurf 100% Glisse",
    "description": "Stage kitesurf intensif sur 5 jours consécutifs à Hyères. Progression rapide vers l'autonomie avec bateau d'assistance et moniteur diplômé.",
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
        "name": "Stage 100% Glisse - Hors saison",
        "price": "399",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "name": "Stage 100% Glisse - Juillet/Août",
        "price": "499",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      }
    ]
  };

  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Stage Kitesurf 100% Glisse - Hyères",
    description: "Stage kitesurf intensif 5 jours consécutifs à Hyères. Atteignez l'autonomie avec bateau d'assistance, petits groupes et moniteur diplômé.",
    image: "https://www.kitesurfpassion.fr/images/hero-100-glisse.jpg",
    brand: {
      "@type": "Brand",
      name: "KiteSurf Passion"
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "399",
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
    name: "Stage kitesurf 100% Glisse Hyères",
    description: "Stage intensif kitesurf 5 jours sur le spot de l'Almanarre à Hyères - école KiteSurf Passion Var",
    contentUrl: "https://www.kitesurfpassion.fr/images/hero-100-glisse.jpg",
    thumbnailUrl: "https://www.kitesurfpassion.fr/images/hero-100-glisse.jpg",
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

  const programSteps = [
    {
      day: "Jour 1",
      title: "Découverte & Fondamentaux",
      content: "Présentation du matériel et des règles de sécurité essentielles. Compréhension de la fenêtre de vent et gestion des risques. Initiation au body drag. Pour les plus à l'aise : premières tentatives de waterstart.",
    },
    {
      day: "Jour 2",
      title: "Premiers Waterstarts",
      content: "Consolidation du waterstart et équilibre dans l'eau avec la planche aux pieds. Travail du maniement de la planche et contrôle de l'équilibre. Positionnement du corps et premières sensations de glisse.",
    },
    {
      day: "Jour 3",
      title: "Contrôle & Trajectoire",
      content: "Affinage du positionnement corporel pour une posture optimale. Apprentissage du contrôle de la vitesse et maîtrise de la trajectoire. Stabilité en navigation.",
    },
    {
      day: "Jour 4",
      title: "Navigation Confirmée",
      content: "Navigation fluide dans les deux sens : tribord et bâbord amure. Construction de la confiance et développement de l'indépendance sur la planche.",
    },
    {
      day: "Jour 5",
      title: "Autonomie Complète",
      content: "Apprentissage de la remontée au vent pour revenir à votre point de départ. Réalisation de demi-tours contrôlés. Fluidité et autonomie totale : vous êtes prêt à naviguer seul !",
    },
  ];

  const advantages = [
    { icon: Ship, title: "Bateau d'Assistance", desc: "Sécurité maximale sur l'eau" },
    { icon: Users, title: "Petits Groupes", desc: "3-4 élèves maximum" },
    { icon: Clock, title: "5 Jours Consécutifs", desc: "Stage intensif" },
    { icon: Award, title: "Moniteur Diplômé", desc: "25 ans d'expérience" },
  ];

  const safetyFeatures = [
    { icon: Radio, title: "Communication Radio", desc: "Contact permanent avec le moniteur" },
    { icon: Ship, title: "Bateau d'Assistance", desc: "Récupération rapide en cas de besoin" },
    { icon: Shield, title: "Matériel Sécurisé", desc: "Équipement vérifié quotidiennement" },
    { icon: Target, title: "Zone Adaptée", desc: "Spot choisi selon les conditions" },
  ];

  return (
    <>
      <Helmet>
         <title>Stage Kitesurf 100% Glisse – Hyères Almanarre | Kitesurf Passion</title>
         <meta
           name="description"
           content="Stage kitesurf 100% Glisse à Hyères avec Kitesurf Passion. 5 jours pour devenir autonome sur l'Almanarre : bateau d'assistance, moniteur diplômé, petits groupes. Dès 399€."
         />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/stage-kitesurf-100-glisse-hyeres" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/stage-kitesurf-100-glisse-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/stage-kitesurf-100-glisse-hyeres" />
        <meta property="og:title" content="Stage 100% Glisse Hyères | Kitesurf Passion – 5 Jours Autonomie" />
        <meta property="og:description" content="Stage intensif 5 jours pour devenir autonome en kitesurf à l'Almanarre Hyères. Bateau sécurité, moniteur diplômé, petits groupes." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/stage-kitesurf-100-glisse-hyeres" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Stage kitesurf 100% Glisse Hyères - École KiteSurf Passion Almanarre" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Stage Kitesurf 100% Glisse Hyères | 5 Jours" />
        <meta name="twitter:description" content="5 jours pour devenir autonome en kitesurf à l'Almanarre Hyères !" />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Stage kitesurf 100% Glisse Hyères Almanarre" />
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
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: stage100GlisseFaqs.map(faq => ({
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
            { "@type": "ListItem", "position": 2, "name": "Kitesurf", "item": "https://www.kitesurfpassion.fr/cours-kitesurf-hyeres-debutant" },
            { "@type": "ListItem", "position": 3, "name": "Stage 100% Glisse", "item": "https://www.kitesurfpassion.fr/stage-kitesurf-100-glisse-hyeres" }
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
              src={hero100Glisse}
              alt="Stage kitesurf 100% Glisse Hyères Almanarre - Formation intensive école KiteSurf Passion Var"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/50 to-navy/30" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sunset/20 text-sunset border border-sunset/30 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Stage Intensif
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6">
                Stage Kitesurf <span className="text-sunset">100% Glisse</span> Hyères Almanarre
              </h1>
              <p className="text-primary-foreground/80 text-lg mb-8">
                5 jours consécutifs pour atteindre l'autonomie. Progression rapide, encadrement professionnel et sécurité maximale sur le spot de l'Almanarre.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="sunset" size="lg" asChild>
                  <Link to="/contact-reservation-kitesurf-hyeres">Réserver mon stage</Link>
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
                <div key={item.title} className="bg-card rounded-2xl p-6 border border-border/50 text-center hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-turquoise/20 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-primary" />
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
                  Tarifs Stage 100% Glisse
                </h2>
                <p className="text-muted-foreground">
                  Tout le matériel et le bateau d'assistance sont inclus.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                    Hors saison
                  </span>
                  <div className="mb-4">
                    <span className="text-4xl font-display font-bold text-foreground">399€</span>
                  </div>
                  <p className="text-muted-foreground mb-6">Stage de 5 jours consécutifs</p>
                  <ul className="space-y-3 mb-8">
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
                    <span className="text-4xl font-display font-bold text-foreground">499€</span>
                  </div>
                  <p className="text-muted-foreground mb-6">Stage de 5 jours consécutifs</p>
                  <ul className="space-y-3 mb-8">
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

              {/* Semi-Privé Option */}
              <div className="mt-8 bg-gradient-to-r from-primary/10 to-turquoise/10 rounded-2xl p-8 border border-primary/20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Stage Semi-Privé (2 personnes)</h3>
                    <p className="text-muted-foreground">Progressez en duo avec une attention personnalisée.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">À partir de</p>
                    <span className="text-3xl font-display font-bold text-foreground">599€</span>
                    <p className="text-muted-foreground text-sm">par personne</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Program Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Programme Kitesurf – Stage Progressif 5 Jours
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Une pédagogie axée sur la sécurité, la progression et l'autonomie. Chaque jour vous rapproche de la liberté sur l'eau.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="space-y-4">
                {programSteps.map((step, index) => (
                  <div 
                    key={step.day}
                    className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-turquoise rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-primary-foreground font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-primary font-bold">{step.day}</span>
                          <span className="text-foreground font-semibold">{step.title}</span>
                        </div>
                        <p className="text-muted-foreground">{step.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Shield className="w-4 h-4" />
                  Sécurité Renforcée
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  Votre Sécurité, Notre Priorité
                </h2>
                <p className="text-muted-foreground mb-8">
                  Grâce à notre bateau d'assistance permanent et notre système de communication radio, vous progressez en toute sérénité. Notre moniteur diplômé vous accompagne à chaque instant.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {safetyFeatures.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <img 
                  src={kitesurfLesson} 
                  alt="Stage kitesurf bateau assistance Hyères - Sécurité école KiteSurf Passion Almanarre Var" 
                  loading="lazy"
                  decoding="async"
                  className="rounded-2xl shadow-2xl w-full aspect-[4/3] object-cover"
                />
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
              <p className="text-muted-foreground">Découvrez nos autres options d'apprentissage</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                to="/session-kitesurf-carte-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Cours à la Carte</h3>
                <p className="text-muted-foreground text-sm mb-3">Flexibilité totale selon vos disponibilités</p>
                <span className="text-primary text-sm font-medium">Dès 120€ →</span>
              </Link>
              <Link 
                to="/cours-particulier-kitesurf-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Cours Particulier</h3>
                <p className="text-muted-foreground text-sm mb-3">Moniteur 100% dédié à votre progression</p>
                <span className="text-primary text-sm font-medium">Dès 230€ →</span>
              </Link>
              <Link 
                to="/location-materiel-kitesurf-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Location Matériel</h3>
                <p className="text-muted-foreground text-sm mb-3">Après votre stage, louez votre équipement</p>
                <span className="text-primary text-sm font-medium">Dès 30€/jour →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <ActivityFAQ
          title="Questions Fréquentes Kitesurf"
          subtitle="Tout savoir sur notre stage 100% Glisse à Hyères Almanarre"
          faqs={stage100GlisseFaqs}
          accentColor="primary"
        />

        {/* Maillage interne - Autres disciplines */}
        <InternalLinking
          title="Découvrez Nos Autres Activités"
          subtitle="Complétez votre expérience de glisse à Hyères"
          links={[
            disciplineLinks.wingfoil,
            disciplineLinks.pumpfoil,
            disciplineLinks.foilTracte,
            { ...pillarLinks.spot, description: "Le meilleur spot du Var" },
          ]}
          accentColor="primary"
        />

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-navy via-navy to-primary/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
              Prêt pour le Stage 100% Glisse ?
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
              Réservez votre stage et rejoignez-nous sur le magnifique spot de l'Almanarre pour 5 jours de glisse inoubliables.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="sunset" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Réserver maintenant</Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <a href="tel:0672716905" onClick={() => trackPhoneClick("stage100_glisse")}>06 72 71 69 05</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Stage100Glisse;
