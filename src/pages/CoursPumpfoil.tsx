import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { CTASection } from "@/components/sections/CTASection";
import { ActivityFAQ } from "@/components/sections/ActivityFAQ";
import { RelatedBlogArticles } from "@/components/sections/RelatedBlogArticles";
import { InternalLinking, disciplineLinks, pillarLinks } from "@/components/sections/InternalLinking";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Waves, Zap, Target, Clock, Calendar, MapPin } from "lucide-react";
import { getProductRatingData } from "@/lib/seo-ratings";
import pumpfoilImage from "@/assets/pumpfoil-hyeres-cours.jpg?webp";
import pumpfoilInitiation from "@/assets/pumpfoil-initiation.jpg?webp";
import festivalAffiche from "@/assets/pump-foil-festival-affiche.jpg?webp";

const pumpfoilBlogArticles = [
  {
    slug: "pumpfoil-sport-nautique-sans-vent",
    title: "Pumpfoil : Le Sport Nautique qui Révolutionne la Glisse",
    excerpt: "Découvrez le pumpfoil, cette discipline innovante qui permet de voler sur l'eau sans vent ni vagues.",
  },
  {
    slug: "dock-start-technique-pumpfoil-debutant",
    title: "Dock Start : La Technique Clé pour Débuter en Pumpfoil",
    excerpt: "Maîtrisez le dock start, la technique de départ depuis un ponton pour apprendre le pumpfoil facilement.",
  },
  {
    slug: "pumpfoil-entrainement-foil-wingfoil",
    title: "Pumpfoil : L'Entraînement Parfait pour Progresser en Wingfoil",
    excerpt: "Comment le pumpfoil peut accélérer votre progression en wingfoil et améliorer votre équilibre sur le foil.",
  },
];

const pumpfoilFaqs = [
  {
    question: "Qu'est-ce que le pumpfoil et comment ça fonctionne ?",
    answer: "Le pumpfoil est un sport nautique où vous volez au-dessus de l'eau grâce à un mouvement de pompage des jambes, sans vent ni vagues. C'est un excellent workout qui combine cardio et renforcement musculaire tout en offrant des sensations de glisse uniques.",
  },
  {
    question: "Le pumpfoil est-il accessible aux débutants à Hyères ?",
    answer: "Oui ! Avec notre méthode dock start sur le spot de l'Almanarre, vous apprenez à décoller facilement depuis un ponton. La technique est accessible et vous volerez dès les premières séances avec l'encadrement de notre moniteur diplômé.",
  },
  {
    question: "Combien coûte une séance de pumpfoil à l'Almanarre ?",
    answer: "La séance de pumpfoil avec dock start dure 1h30 et coûte 50€. Elle se fait en petit groupe de 3 personnes maximum, avec tout le matériel fourni et un bateau d'assistance à proximité.",
  },
  {
    question: "Faut-il du vent pour faire du pumpfoil ?",
    answer: "Non, c'est justement l'avantage du pumpfoil ! Vous pouvez pratiquer même par jour sans vent. C'est l'activité idéale quand les conditions ne permettent pas le kitesurf ou le wingfoil à Hyères.",
  },
  {
    question: "Le pumpfoil aide-t-il pour progresser en wingfoil ?",
    answer: "Absolument ! Le pumpfoil développe l'équilibre sur le foil et la sensation de vol. C'est un excellent complément pour progresser plus rapidement en wingfoil, car vous apprenez à maîtriser le foil sans gérer l'aile en même temps.",
  },
];

const breadcrumbItems = [
  { label: "Initiation Pump Foil" }
];

const features = [
  {
    icon: Waves,
    title: "Sans Vent, Sans Vagues",
    description: "Le pumpfoil fonctionne par simple mouvement de pompage, idéal quand il n'y a pas de vent."
  },
  {
    icon: Zap,
    title: "Cardio & Renforcement",
    description: "Un excellent workout qui combine cardio et renforcement musculaire tout en s'amusant."
  },
  {
    icon: Target,
    title: "Dock Start Inclus",
    description: "Apprenez la technique du dock start pour décoller facilement depuis un ponton."
  },
  {
    icon: Clock,
    title: "Progression Rapide",
    description: "Technique accessible, vous volerez sur l'eau dès les premières séances."
  }
];

const includes = [
  "Foil et planche adaptés à votre niveau",
  "Gilet de sauvetage et casque",
  "Encadrement par moniteur diplômé",
  "Bateau d'assistance à proximité",
  "Briefing sécurité complet",
  "Débriefing et conseils personnalisés"
];

const pricing = [
  {
    name: "Cours Pump Foil / Dock Start",
    duration: "1h30",
    price: "50€",
    description: "3 personnes maximum, tout matériel inclus",
    popular: true
  }
];

export default function CoursPumpfoil() {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pumpfoilFaqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer }
    }))
  };

  return (
    <>
      <Helmet>
        <title>Cours Pumpfoil & Dock Start – Hyères Almanarre | Volez Sans Vent</title>
        <meta name="description" content="Cours de pumpfoil et dock start à Hyères Almanarre. Apprenez à voler sur l'eau sans vent avec moniteur diplômé. Progression rapide, accessible à tous dès 50€." />
        <meta name="keywords" content="pumpfoil hyères, cours pumpfoil almanarre, dock start hyères, foil sans vent, école pumpfoil var" />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/cours-pumpfoil-dock-start-hyeres" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/cours-pumpfoil-dock-start-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/cours-pumpfoil-dock-start-hyeres" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Cours Pumpfoil Hyères | Dock Start à l'Almanarre" />
        <meta property="og:description" content="Volez sur l'eau sans vent ! Cours pumpfoil dès 50€ à Hyères. Dock start, progression rapide, moniteur diplômé." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/cours-pumpfoil-dock-start-hyeres" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Cours pumpfoil dock start Hyères - École KiteSurf Passion" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cours Pumpfoil Hyères | Dock Start" />
        <meta name="twitter:description" content="Volez sur l'eau sans vent ! Pumpfoil dès 50€ à Hyères." />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Pumpfoil dock start Hyères" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Initiation Pump Foil",
            "description": "Cours de pumpfoil à Hyères - Apprenez à voler sur l'eau sans vent",
            "provider": {
              "@type": "Organization",
              "name": "KiteSurf Passion",
              "url": "https://www.kitesurfpassion.fr",
              "priceRange": "€€",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "52 Avenue Général de Gaulle",
                "addressLocality": "Carqueiranne",
                "postalCode": "83320",
                "addressCountry": "FR"
              }
            },
            "offers": {
              "@type": "Offer",
              "price": "50",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock"
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Initiation Pumpfoil Dock Start - Hyères",
            "description": "Cours de pumpfoil à Hyères - Apprenez à voler sur l'eau sans vent avec la technique dock start. Séance de 1h30, 3 personnes maximum.",
             "image": "https://www.kitesurfpassion.fr/images/pumpfoil-hyeres-cours.jpg",
            "brand": {
              "@type": "Brand",
              "name": "KiteSurf Passion"
            },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "50",
              "highPrice": "50",
              "priceCurrency": "EUR",
              "offerCount": 1,
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "KiteSurf Passion"
              }
            },
            ...getProductRatingData()
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageObject",
            "name": "Cours pumpfoil dock start Hyères",
            "description": "Initiation au pumpfoil avec technique dock start sur la presqu'île de Giens à Hyères - école KiteSurf Passion",
             "contentUrl": "https://www.kitesurfpassion.fr/images/pumpfoil-hyeres-cours.jpg",
             "thumbnailUrl": "https://www.kitesurfpassion.fr/images/pumpfoil-hyeres-cours.jpg",
            "creditText": "KiteSurf Passion",
            "copyrightNotice": "© KiteSurf Passion",
            "creator": {
              "@type": "Organization",
              "name": "KiteSurf Passion",
              "url": "https://www.kitesurfpassion.fr"
            },
            "license": "https://www.kitesurfpassion.fr/mentions-legales",
            "acquireLicensePage": "https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres",
            "contentLocation": {
              "@type": "Place",
              "name": "Presqu'île de Giens, Hyères",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Hyères",
                "addressRegion": "Var",
                "addressCountry": "FR"
              }
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqStructuredData)}
        </script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Initiation Pump Foil", "item": "https://www.kitesurfpassion.fr/cours-pumpfoil-dock-start-hyeres" }
          ]
        })}</script>
        
        {/* HowTo schema for pumpfoil dock start learning */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "Comment apprendre le pumpfoil avec la technique dock start",
          "description": "Guide pour maîtriser le pumpfoil en partant d'un ponton. Apprenez à voler sur l'eau sans vent ni vagues à Hyères.",
          "image": "https://www.kitesurfpassion.fr/images/pumpfoil-hyeres-cours.jpg",
          "totalTime": "PT1H30M",
          "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "EUR",
            "value": "50"
          },
          "supply": [
            { "@type": "HowToSupply", "name": "Planche de pumpfoil avec foil" },
            { "@type": "HowToSupply", "name": "Gilet de sauvetage" },
            { "@type": "HowToSupply", "name": "Casque de protection" }
          ],
          "tool": [
            { "@type": "HowToTool", "name": "Ponton de départ (dock)" },
            { "@type": "HowToTool", "name": "Bateau d'assistance" }
          ],
          "step": [
            {
              "@type": "HowToStep",
              "position": 1,
              "name": "Briefing et position de base",
              "text": "Explication de la technique, position sur la planche, placement des pieds et posture du corps pour le pumping."
            },
            {
              "@type": "HowToStep",
              "position": 2,
              "name": "Départ du ponton (dock start)",
              "text": "Apprentissage du saut depuis le ponton, timing du décollage et génération de la vitesse initiale."
            },
            {
              "@type": "HowToStep",
              "position": 3,
              "name": "Technique de pompage",
              "text": "Maîtrise du mouvement de pompage avec les jambes pour maintenir le vol au-dessus de l'eau."
            },
            {
              "@type": "HowToStep",
              "position": 4,
              "name": "Vol et distance",
              "text": "Augmentation progressive de la distance parcourue en maintenant un rythme de pompage efficace."
            }
          ]
        })}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center pt-20">
          <div className="absolute inset-0">
            <img
              src={pumpfoilImage}
              alt="Cours Pumpfoil Hyères - Dock Start Pump Foil école KiteSurf Passion Var"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-transparent" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              <span className="inline-block text-sunset font-semibold mb-4">Nouveau Sport</span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
                Cours{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean to-turquoise">
                  Pumpfoil
                </span>{" "}
                Hyères Almanarre
              </h1>
              <p className="text-primary-foreground/90 text-lg sm:text-xl mb-8 max-w-xl">
                Volez sur l'eau sans vent ni vagues ! Découvrez le pumpfoil, le sport nautique fitness par excellence, avec notre méthode dock start.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" variant="sunset">
                  <Link to="/contact-reservation-kitesurf-hyeres">
                    Réserver une Séance
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="hero">
                  <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">
                    Voir les Tarifs
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Pourquoi Choisir le{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">
                  Pump Foil
                </span>{" "}
                ?
              </h2>
              <p className="text-muted-foreground text-lg">
                Le pumpfoil combine sensations de glisse et workout complet, accessible à tous les niveaux.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-card p-6 rounded-2xl border border-border hover:border-ocean/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-ocean/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-ocean" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Nos Formules Pump Foil
              </h2>
              <p className="text-muted-foreground text-lg">
                Des formules adaptées à votre niveau et vos objectifs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricing.map((plan, index) => (
                <div
                  key={index}
                  className={`bg-card p-8 rounded-3xl border-2 transition-all duration-300 hover:-translate-y-2 ${
                    plan.popular
                      ? "border-sunset shadow-xl shadow-sunset/10"
                      : "border-border hover:border-ocean/30"
                  }`}
                >
                  {plan.popular && (
                    <span className="inline-block bg-sunset text-accent-foreground text-sm font-bold px-3 py-1 rounded-full mb-4">
                      Populaire
                    </span>
                  )}
                  <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground mb-4">{plan.duration}</p>
                  <p className="font-display text-4xl font-bold text-sunset mb-4">
                    {plan.price}
                  </p>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  <Button asChild className="w-full" variant={plan.popular ? "sunset" : "outline"}>
                    <Link to="/contact-reservation-kitesurf-hyeres">
                      Réserver
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Ce Qui Est Inclus
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Tout le matériel et l'encadrement nécessaires pour une séance réussie et en toute sécurité.
                </p>
                <ul className="space-y-4">
                  {includes.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-ocean/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-ocean" />
                      </div>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <img
                  src={pumpfoilInitiation}
                  alt="Séance initiation pumpfoil dock start Hyères Almanarre Var - Moniteur école KiteSurf Passion"
                  className="rounded-3xl shadow-2xl"
                />
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
                to="/stage-kitesurf-100-glisse-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-ocean/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-ocean transition-colors">Stage Kitesurf</h3>
                <p className="text-muted-foreground text-sm mb-3">5 jours pour l'autonomie</p>
                <span className="text-ocean text-sm font-medium">Dès 399€ →</span>
              </Link>
              <Link 
                to="/stage-wingfoil-hyeres-almanarre"
                className="bg-card border border-border rounded-2xl p-6 hover:border-ocean/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-ocean transition-colors">Stage Wing Foil</h3>
                <p className="text-muted-foreground text-sm mb-3">Volez sur l'eau</p>
                <span className="text-ocean text-sm font-medium">Dès 90€ →</span>
              </Link>
              <Link 
                to="/foil-tracte-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-ocean/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-ocean transition-colors">Foil Tracté</h3>
                <p className="text-muted-foreground text-sm mb-3">Apprenez à voler</p>
                <span className="text-ocean text-sm font-medium">Dès 50€ →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Expert Content Section - SEO 1500+ mots */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Le Guide Complet du{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean to-turquoise">Pumpfoil à Hyères</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                  Découvrez cette discipline révolutionnaire qui vous permet de voler sur l'eau sans vent, et pourquoi Hyères est l'endroit idéal pour l'apprendre.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-16">
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Qu'est-ce que le pumpfoil ?</h3>
                  <p>
                    Le <strong>pumpfoil</strong> est un sport nautique innovant qui consiste à se propulser au-dessus de l'eau en effectuant un <strong>mouvement de pompage avec les jambes</strong>, sans aucune aide extérieure — pas de vent, pas de vagues, pas de moteur. La planche est équipée d'un hydrofoil (une aile immergée) qui génère une portance hydrodynamique grâce au mouvement.
                  </p>
                  <p>
                    C'est l'une des sensations les plus pures et addictives des sports nautiques : <strong>voler sur l'eau par sa seule énergie musculaire</strong>. Le pumpfoil combine le plaisir de la glisse avec un workout physique complet qui sollicite les jambes, le core et l'équilibre. C'est à la fois un sport, un entraînement et une méditation en mouvement.
                  </p>
                  <p>
                    Le pumpfoil est né de la communauté du foil (wingfoil, kitefoil, surf foil) comme une discipline complémentaire permettant de s'entraîner <strong>les jours sans vent</strong>. Rapidement, il est devenu un sport à part entière, pratiqué pour le plaisir pur de voler et pour ses bienfaits physiques remarquables.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">La technique du dock start expliquée</h3>
                  <p>
                    Le <strong>dock start</strong> (départ du ponton) est la méthode la plus efficace pour débuter en pumpfoil. Plutôt que de devoir générer de la vitesse dans l'eau (ce qui est très difficile pour un débutant), vous partez directement depuis un ponton ou une structure surélevée.
                  </p>
                  <p>
                    <strong>La technique :</strong> debout sur votre planche posée au bord du ponton, vous sautez dans l'eau avec un mouvement contrôlé. L'élan de la chute génère la <strong>vitesse initiale</strong> nécessaire pour que le foil commence à porter. À ce moment, vous enchaînez immédiatement avec le mouvement de pompage pour maintenir et augmenter votre vitesse.
                  </p>
                  <p>
                    Le pompage est un mouvement de <strong>flexion-extension coordonné</strong> des genoux et des hanches, comparable au mouvement d'une balançoire. Chaque pompage génère de la portance sur le foil, vous maintenant en vol. Avec de la pratique, certains riders parviennent à parcourir des distances considérables — jusqu'à plusieurs centaines de mètres — en enchaînant les pompages.
                  </p>
                  <p>
                    Notre moniteur diplômé vous accompagne dans chaque étape : placement des pieds, timing du saut, rythme de pompage, et gestion de l'altitude du foil. En général, nos élèves réussissent leurs <strong>premiers vols dès la première séance</strong>.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-16">
                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Le pumpfoil comme complément au wingfoil</h3>
                  <p>
                    Le pumpfoil est le <strong>complément parfait du wingfoil</strong>. En pratiquant le pumpfoil, vous développez des compétences directement transférables : l'équilibre sur le foil, la gestion de l'altitude, le placement des pieds, et la sensation de vol. Tout cela sans avoir à gérer la wing en même temps.
                  </p>
                  <p>
                    De nombreux pratiquants de <Link to="/stage-wingfoil-hyeres-almanarre" className="text-primary hover:underline">wingfoil</Link> utilisent le pumpfoil comme <strong>outil d'entraînement</strong> les jours sans vent. Le pompage renforce les muscles stabilisateurs des jambes et du tronc, améliorant significativement votre endurance et votre contrôle sur le foil.
                  </p>
                  <p>
                    Chez KiteSurf Passion, nous recommandons souvent d'intégrer une séance de pumpfoil dans un stage de wingfoil pour <strong>accélérer la progression</strong>. L'expérience du foil acquise en pumpfoil se traduit directement en confiance et en aisance lorsque vous repassez au wingfoil.
                  </p>
                </div>

                <div className="space-y-5">
                  <h3 className="font-display text-2xl font-bold text-foreground">Conditions et lieu de pratique à Hyères</h3>
                  <p>
                    L'avantage majeur du pumpfoil est qu'il ne dépend <strong>d'aucune condition météo</strong>. Pas besoin de vent, pas besoin de vagues. Un plan d'eau calme suffit. C'est l'activité idéale les jours où le kitesurf et le wingfoil ne sont pas possibles.
                  </p>
                  <p>
                    À Hyères, nos sessions de pumpfoil se déroulent sur des <strong>plans d'eau protégés</strong> de la presqu'île de Giens, offrant des conditions d'eau plate parfaites pour le dock start. La faible profondeur et l'absence de courant garantissent un environnement sécurisé pour l'apprentissage.
                  </p>
                  <p>
                    Nos séances durent <strong>1h30</strong> en petit groupe de <strong>3 personnes maximum</strong>, ce qui assure un encadrement personnalisé et un temps de pratique optimal pour chaque participant. Le matériel complet est fourni : planche de pumpfoil adaptée, gilet de sauvetage et casque. Un <Link to="/blog/pourquoi-bateau-assistance-essentiel" className="text-primary hover:underline">bateau d'assistance</Link> reste à proximité pour votre sécurité.
                  </p>
                  <p>
                    Le pumpfoil est accessible <strong>dès 14 ans</strong> et ne nécessite aucune expérience préalable en sports de glisse. Une condition physique correcte est suffisante — le sport est intense mais progressif. Consultez nos <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="text-primary hover:underline">tarifs</Link> ou <Link to="/contact-reservation-kitesurf-hyeres" className="text-primary hover:underline">contactez-nous</Link> pour réserver votre séance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <ActivityFAQ
          title="Questions Fréquentes Pumpfoil"
          subtitle="Tout savoir sur nos cours de pumpfoil à Hyères Almanarre"
          faqs={pumpfoilFaqs}
          accentColor="ocean"
        />

        {/* Blog Articles Section */}
        <RelatedBlogArticles
          title="Nos Articles Pumpfoil"
          subtitle="Guides et conseils pour découvrir le pumpfoil"
          articles={pumpfoilBlogArticles}
          accentColor="ocean"
        />

        {/* Pump Foil Festival Banner */}
        <section className="py-20 bg-gradient-to-br from-ocean/10 via-background to-turquoise/10">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-ocean/20">
                <img
                  src={festivalAffiche}
                  alt="Affiche Pump Foil Festival Hyères - 4 octobre 2025 - Village exposants, épreuves, challenges et musique live"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-sunset/10 text-sunset rounded-full text-sm font-bold mb-4">
                  <Calendar className="w-4 h-4" />
                  Événement 2025
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Pump Foil{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean to-turquoise">
                    Festival
                  </span>
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Rendez-vous le <strong className="text-foreground">samedi 4 octobre 2025</strong> à Hyères pour le Pump Foil Festival ! 
                  Village exposants, tests matériel, épreuves &amp; challenges, DJ et musique live.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-foreground">
                    <Calendar className="w-5 h-5 text-ocean" />
                    <span>Samedi 4 octobre 2025</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <MapPin className="w-5 h-5 text-ocean" />
                    <span>Hyères Kite Association – Almanarre</span>
                  </div>
                </div>
                <Button asChild size="lg" variant="sunset">
                  <Link to="/contact-reservation-kitesurf-hyeres">
                    En savoir plus
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <CTASection />
      </main>

      <Footer />
    </>
  );
}
