import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { RelatedBlogArticles } from "@/components/sections/RelatedBlogArticles";
import { InternalLinking, disciplineLinks, pillarLinks } from "@/components/sections/InternalLinking";
import { Check, Anchor, Shield, Zap, Users, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { getProductRatingData } from "@/lib/seo-ratings";
import foilTracteHero from "@/assets/foil-tracte-hyeres.jpg?webp";
import { FoilWakeboardTestimonials } from "@/components/sections/FoilWakeboardTestimonials";
import { ActivityFAQ } from "@/components/sections/ActivityFAQ";

const foilTracteBlogArticles = [
  {
    slug: "foil-tracte-initiation-vol-eau",
    title: "Foil Tracté : L'Initiation Parfaite au Vol sur l'Eau",
    excerpt: "Découvrez pourquoi le foil tracté est la méthode idéale pour apprendre à voler sur l'eau en toute sécurité.",
  },
  {
    slug: "du-foil-tracte-au-wingfoil-progression",
    title: "Du Foil Tracté au Wingfoil : Parcours de Progression Idéal",
    excerpt: "Comment le foil tracté prépare parfaitement à la pratique du wingfoil et accélère votre progression.",
  },
  {
    slug: "sensations-foil-tracte-hyeres-baie-giens",
    title: "Sensations Foil Tracté sur la Baie d'Hyères",
    excerpt: "Témoignages et retours d'expérience sur les sessions de foil tracté dans le cadre exceptionnel de la baie d'Hyères.",
  },
];

const breadcrumbItems = [
  { label: "Wing Foil", href: "/stage-wingfoil-hyeres-almanarre" },
  { label: "Foil Tracté" }
];

const foilPrices = [
  { 
    name: "Session 20 min", 
    description: "Découverte du foil tracté",
    price: "50€",
    features: ["Initiation au foil", "Encadrement moniteur", "Matériel fourni"]
  },
  { 
    name: "Session 40 min", 
    description: "Apprentissage complet",
    price: "80€",
    popular: true,
    features: ["Temps de pratique optimal", "Progression assurée", "Conseils personnalisés"]
  },
];

const foilBenefits = [
  {
    icon: Shield,
    title: "Sécurité maximale",
    description: "Apprentissage sécurisé avec notre bateau et moniteur diplômé"
  },
  {
    icon: Zap,
    title: "Sensations uniques",
    description: "Découvrez la sensation de voler au-dessus de l'eau"
  },
  {
    icon: Users,
    title: "Accessible à tous",
    description: "Aucun prérequis, idéal pour débuter le foil"
  },
];

const FoilTracte = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Foil Tracté Hyères - Initiation au vol sur l'eau",
    "description": "Sessions de foil tracté sur la baie d'Hyères. Découvrez les sensations du foil en toute sécurité, tracté par notre bateau avec moniteur diplômé.",
    "url": "https://www.kitesurfpassion.fr/foil-tracte-hyeres",
    "provider": {
      "@type": "LocalBusiness",
      "name": "KiteSurf Passion",
      "url": "https://www.kitesurfpassion.fr",
      "image": "https://www.kitesurfpassion.fr/assets/foil-tracte-hyeres.jpg",
      "priceRange": "€€",
      "telephone": "+33672716905",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Port de Carqueiranne",
        "addressLocality": "Hyères",
        "addressRegion": "Var",
        "postalCode": "83400",
        "addressCountry": "FR"
      }
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "50",
      "highPrice": "80",
      "priceCurrency": "EUR",
      "offerCount": 2,
      "availability": "https://schema.org/InStock"
    }
  };

  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Foil Tracté Initiation - Hyères",
    description: "Sessions de foil tracté de 20 à 40 min sur la baie d'Hyères. Découvrez les sensations du vol sur l'eau en toute sécurité avec moniteur diplômé.",
    image: "https://www.kitesurfpassion.fr/assets/foil-tracte-hyeres.jpg",
    brand: {
      "@type": "Brand",
      name: "KiteSurf Passion"
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "50",
      highPrice: "80",
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
    name: "Foil tracté Hyères bateau",
    description: "Session de foil tracté par bateau sur la baie d'Hyères - école KiteSurf Passion initiation au vol",
    contentUrl: "https://www.kitesurfpassion.fr/assets/foil-tracte-hyeres.jpg",
    thumbnailUrl: "https://www.kitesurfpassion.fr/assets/foil-tracte-hyeres.jpg",
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
      name: "Baie d'Hyères",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Hyères",
        addressRegion: "Var",
        addressCountry: "FR",
      },
    },
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Qu'est-ce que le foil tracté et comment ça fonctionne ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le foil tracté est une méthode d'initiation au foil où vous êtes remorqué par un bateau. Une planche équipée d'un hydrofoil vous permet de vous élever au-dessus de l'eau. C'est la façon la plus simple et sécurisée de découvrir les sensations du vol, sans avoir besoin de vent ni d'aile."
        }
      },
      {
        "@type": "Question",
        name: "Faut-il savoir nager pour faire du foil tracté à Hyères ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, il est nécessaire de savoir nager pour pratiquer le foil tracté. Vous portez un gilet de flottaison fourni par notre école, mais une aisance dans l'eau est indispensable pour votre sécurité. Notre moniteur diplômé reste à proximité en bateau."
        }
      },
      {
        "@type": "Question",
        name: "Quel est l'âge minimum pour une session de foil tracté ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le foil tracté est accessible dès 12 ans, sous réserve de savoir nager et d'avoir une condition physique adaptée. Pour les mineurs, une autorisation parentale est requise. Notre moniteur évalue chaque participant avant la session."
        }
      },
      {
        "@type": "Question",
        name: "Combien de temps faut-il pour réussir à voler en foil tracté ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La plupart des débutants parviennent à décoller et voler quelques secondes dès leur première session de 20 minutes. Avec une session de 40 minutes, vous aurez le temps de stabiliser votre vol et de ressentir pleinement les sensations uniques du foil."
        }
      },
      {
        "@type": "Question",
        name: "Le foil tracté est-il une bonne préparation au wing foil ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolument ! Le foil tracté est le tremplin idéal vers le wing foil. Vous apprenez l'équilibre et la position sur le foil sans gérer l'aile. Une fois à l'aise avec la planche, la transition vers le wing foil à l'Almanarre devient beaucoup plus rapide."
        }
      },
      {
        "@type": "Question",
        name: "Où se déroulent les sessions de foil tracté à Hyères ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Les sessions ont lieu sur la baie d'Hyères, près de la presqu'île de Giens. Ce plan d'eau protégé offre des conditions idéales pour l'apprentissage : eau calme, faible profondeur et paysages magnifiques avec vue sur les îles d'Or."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Foil Tracté – Hyères Almanarre | Volez sur l'Eau en Sécurité</title>
        <meta 
          name="description" 
          content="Foil tracté à Hyères Almanarre (Var). Volez sur l'eau en toute sécurité près de Giens ! Sessions 20-40 min avec bateau et moniteur diplômé. Dès 50€, idéal débutants." 
        />
        <meta name="keywords" content="foil tracté Hyères, foil tracté bateau, initiation foil Hyères, apprendre foil bateau, foil débutant Var, foil tracté Almanarre" />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/foil-tracte-hyeres" />
        <link rel="alternate" hrefLang="fr" href="https://www.kitesurfpassion.fr/foil-tracte-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/foil-tracte-hyeres" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Foil Tracté Hyères | Voler sur l'Eau en Sécurité" />
        <meta property="og:description" content="Sessions foil tracté par bateau dès 50€ à Hyères. Découvrez les sensations du vol sur l'eau sans vent ni expérience préalable." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/foil-tracte-hyeres" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Foil tracté Hyères - Session bateau école KiteSurf Passion" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Foil Tracté Hyères | Sensations Vol" />
        <meta name="twitter:description" content="Volez sur l'eau dès 50€ ! Foil tracté par bateau à Hyères." />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Foil tracté Hyères bateau" />
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
            { "@type": "ListItem", "position": 2, "name": "Wing Foil", "item": "https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre" },
            { "@type": "ListItem", "position": 3, "name": "Foil Tracté", "item": "https://www.kitesurfpassion.fr/foil-tracte-hyeres" }
          ]
        })}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={foilTracteHero}
              alt="Foil tracté Hyères - Session foil remorqué bateau école KiteSurf Passion Almanarre Var"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/25 to-background" />
          </div>

          <div className="container mx-auto px-4 text-center relative z-10 pt-32 pb-16">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6 drop-shadow-lg">
              Foil Tracté{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-turquoise to-primary-foreground">
                Hyères
              </span>
            </h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8 drop-shadow-md">
              Découvrez les sensations uniques du foil tracté sur la baie d'Hyères. 
              La méthode idéale pour apprendre à voler sur l'eau en toute sécurité.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  <Anchor className="w-5 h-5 mr-2" />
                  Réserver une Session
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

        {/* Foil Tracté Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Simulateur de Foil
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Apprenez à Voler sur l'Eau
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Le foil tracté est la méthode idéale pour découvrir les sensations du foil en toute sécurité. 
                Tracté par notre bateau, apprenez l'équilibre et la position sans les contraintes du vent.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {foilBenefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Prices */}
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {foilPrices.map((item, index) => (
                <div 
                  key={index}
                  className={`relative bg-card p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                    item.popular 
                      ? "border-primary shadow-lg shadow-primary/10" 
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  {item.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-primary to-turquoise text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                        Recommandé
                      </span>
                    </div>
                  )}
                  <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                  <div className="text-3xl font-bold text-primary mb-4">{item.price}</div>
                  <ul className="space-y-2">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contenu SEO descriptif */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-8 text-center">
                Le Foil Tracté : Votre Porte d'Entrée vers le{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">Vol sur l'Eau</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed">
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-foreground">Qu'est-ce que le foil tracté ?</h3>
                  <p>
                    Le <strong>foil tracté</strong> est une méthode d'initiation révolutionnaire qui vous permet de découvrir les sensations uniques du vol au-dessus de l'eau, sans aucune dépendance au vent. Tracté par notre bateau professionnel sur la <strong>baie d'Hyères</strong>, vous montez sur une planche équipée d'un hydrofoil — une aile immergée qui génère une portance hydrodynamique vous soulevant progressivement hors de l'eau.
                  </p>
                  <p>
                    Cette discipline est née du constat que l'apprentissage du foil dans le cadre du wingfoil ou du kitefoil est complexe : il faut à la fois gérer l'aile, le vent, l'équilibre et la planche. Le foil tracté supprime toutes ces variables pour ne garder que l'essentiel : <strong>apprendre l'équilibre et la position sur un foil</strong>. C'est la méthode la plus rapide et la plus sûre pour ressentir vos premières sensations de vol.
                  </p>
                  <p>
                    Accessible <strong>dès 12 ans</strong>, le foil tracté ne nécessite aucune expérience préalable en sports de glisse. Notre moniteur diplômé d'État contrôle la vitesse du bateau en temps réel et communique avec vous pour ajuster votre posture. La majorité des participants parviennent à décoller dès leur première session de 20 minutes.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-foreground">Le tremplin idéal vers le wingfoil</h3>
                  <p>
                    Le foil tracté est reconnu comme le <strong>meilleur tremplin vers le wingfoil</strong>. En maîtrisant d'abord l'équilibre sur le foil sans avoir à gérer une aile, vous développez les réflexes essentiels : gestion de l'altitude, appuis sur les pieds, transfert de poids, et contrôle de la trajectoire. Ces compétences se transfèrent directement lorsque vous passez au <Link to="/stage-wingfoil-hyeres-almanarre" className="text-primary hover:underline">stage wingfoil</Link>.
                  </p>
                  <p>
                    Nos sessions se déroulent sur la <strong>baie d'Hyères</strong>, un plan d'eau protégé offrant des conditions optimales : eau calme, faible courant et profondeur adaptée. Le cadre naturel exceptionnel — avec vue sur la presqu'île de Giens et les îles d'Or — rend chaque session mémorable.
                  </p>
                  <p>
                    Nous proposons deux formats : la <strong>session découverte de 20 minutes</strong> à 50€, idéale pour une première expérience, et la <strong>session apprentissage de 40 minutes</strong> à 80€, recommandée pour stabiliser votre vol et progresser réellement. Le matériel complet (planche foil, gilet, casque) est fourni.
                  </p>
                  <p>
                    Depuis 1999, notre école <Link to="/a-propos-ecole-kitesurf-hyeres" className="text-primary hover:underline">KiteSurf Passion</Link> est pionnière dans l'enseignement des sports de glisse à Hyères. Le foil tracté s'inscrit dans notre philosophie : rendre le foil accessible à tous grâce à une pédagogie progressive et sécurisée, avec un <Link to="/blog/pourquoi-bateau-assistance-essentiel" className="text-primary hover:underline">bateau d'assistance</Link> permanent sur zone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Témoignages Foil Tracté */}
        <FoilWakeboardTestimonials 
          variant="foilTracte" 
          title="Ils Ont Testé le Foil Tracté" 
        />

        {/* Passerelle vers Wingfoil */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-primary/5 to-turquoise/5 rounded-3xl p-8 md:p-12 border border-primary/10">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Prêt pour le Wing Foil ?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Le foil tracté est une excellente préparation au wing foil. 
                  Une fois à l'aise avec l'équilibre sur le foil, passez à l'étape supérieure avec nos stages wing foil !
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/stage-wingfoil-hyeres-almanarre">
                    <Button variant="default" size="lg">
                      Stages Wing Foil
                    </Button>
                  </Link>
                  <Link to="/cours-pumpfoil-dock-start-hyeres">
                    <Button variant="outline" size="lg">
                      Initiation Pump Foil
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SEO */}
        <ActivityFAQ
          title="Questions Fréquentes"
          subtitle="Tout savoir sur le foil tracté à Hyères et dans la baie de Giens"
          accentColor="primary"
          faqs={[
            {
              question: "Qu'est-ce que le foil tracté et comment ça fonctionne ?",
              answer: "Le foil tracté est une méthode d'initiation au foil où vous êtes remorqué par un bateau. Une planche équipée d'un hydrofoil vous permet de vous élever au-dessus de l'eau. C'est la façon la plus simple et sécurisée de découvrir les sensations du vol, sans avoir besoin de vent ni d'aile."
            },
            {
              question: "Faut-il savoir nager pour faire du foil tracté à Hyères ?",
              answer: "Oui, il est nécessaire de savoir nager pour pratiquer le foil tracté. Vous portez un gilet de flottaison fourni par notre école, mais une aisance dans l'eau est indispensable pour votre sécurité. Notre moniteur diplômé reste à proximité en bateau."
            },
            {
              question: "Quel est l'âge minimum pour une session de foil tracté ?",
              answer: "Le foil tracté est accessible dès 12 ans, sous réserve de savoir nager et d'avoir une condition physique adaptée. Pour les mineurs, une autorisation parentale est requise. Notre moniteur évalue chaque participant avant la session."
            },
            {
              question: "Combien de temps faut-il pour réussir à voler en foil tracté ?",
              answer: "La plupart des débutants parviennent à décoller et voler quelques secondes dès leur première session de 20 minutes. Avec une session de 40 minutes, vous aurez le temps de stabiliser votre vol et de ressentir pleinement les sensations uniques du foil."
            },
            {
              question: "Le foil tracté est-il une bonne préparation au wing foil ?",
              answer: "Absolument ! Le foil tracté est le tremplin idéal vers le wing foil. Vous apprenez l'équilibre et la position sur le foil sans gérer l'aile. Une fois à l'aise avec la planche, la transition vers le wing foil à l'Almanarre devient beaucoup plus rapide."
            },
            {
              question: "Où se déroulent les sessions de foil tracté à Hyères ?",
              answer: "Les sessions ont lieu sur la baie d'Hyères, près de la presqu'île de Giens. Ce plan d'eau protégé offre des conditions idéales pour l'apprentissage : eau calme, faible profondeur et paysages magnifiques avec vue sur les îles d'Or."
            }
          ]}
        />

        {/* Related Activities */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Découvrez Aussi
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                to="/stage-wingfoil-hyeres-almanarre"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stage Wing Foil</h3>
                <p className="text-muted-foreground text-sm mb-3">Volez sur l'eau en autonomie</p>
                <span className="text-primary text-sm font-medium">Dès 90€ →</span>
              </Link>
              <Link 
                to="/wakeboard-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Wakeboard</h3>
                <p className="text-muted-foreground text-sm mb-3">Glisse tractée fun</p>
                <span className="text-primary text-sm font-medium">40€ →</span>
              </Link>
              <Link 
                to="/cours-pumpfoil-dock-start-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Initiation Pump Foil</h3>
                <p className="text-muted-foreground text-sm mb-3">Sans vent, sans vagues</p>
                <span className="text-primary text-sm font-medium">50€ →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Blog Articles Section */}
        <RelatedBlogArticles
          title="Nos Articles Foil"
          subtitle="Guides et conseils pour apprendre le foil"
          articles={foilTracteBlogArticles}
          accentColor="primary"
        />

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-navy via-primary/90 to-turquoise text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Prêt à Voler sur l'Eau ?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Réservez votre session de foil tracté et découvrez les sensations uniques 
              du vol sur la magnifique baie d'Hyères !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  <Anchor className="w-5 h-5 mr-2" />
                  Réserver une Session
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
      </main>

      <Footer />
    </>
  );
};

export default FoilTracte;
