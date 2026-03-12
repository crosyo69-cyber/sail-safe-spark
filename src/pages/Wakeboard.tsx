import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { InternalLinking, disciplineLinks, pillarLinks } from "@/components/sections/InternalLinking";
import { Check, Anchor, Shield, Waves, Heart, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { getProductRatingData } from "@/lib/seo-ratings";
import wakeboardHero from "@/assets/wakeboard-hyeres.jpg?webp";
import { FoilWakeboardTestimonials } from "@/components/sections/FoilWakeboardTestimonials";
import { ActivityFAQ } from "@/components/sections/ActivityFAQ";

const breadcrumbItems = [
  { label: "Kitesurf", href: "/cours-kitesurf-hyeres-debutant" },
  { label: "Wakeboard" }
];

const wakeboardPrices = [
  { 
    name: "Session 15 min", 
    description: "Session wakeboard tractée",
    price: "40€",
    features: ["Sensations garanties", "Tous niveaux", "Matériel inclus"]
  },
];

const wakeboardBenefits = [
  {
    icon: Heart,
    title: "Activité ludique",
    description: "Fun et accessible, parfait pour tous les âges dès 8 ans"
  },
  {
    icon: Waves,
    title: "Sensations de glisse",
    description: "Profitez de la baie d'Hyères en toute liberté"
  },
  {
    icon: Shield,
    title: "Encadrement pro",
    description: "Moniteur expérimenté pour votre sécurité et progression"
  },
];

const Wakeboard = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Wakeboard Hyères - Session Glisse Tractée",
    "description": "Sessions de wakeboard sur la baie d'Hyères. Activité ludique et accessible à tous, encadrée par notre moniteur diplômé avec bateau sécurisé.",
    "url": "https://www.kitesurfpassion.fr/wakeboard-hyeres",
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
    "offers": {
      "@type": "Offer",
      "price": "40",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock"
    }
  };

  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Wakeboard Session Tractée - Hyères",
    description: "Session de wakeboard de 15 min sur la baie d'Hyères. Activité fun et accessible à tous les âges dès 8 ans, encadrée par moniteur diplômé.",
    image: "https://www.kitesurfpassion.fr/images/wakeboard-hyeres.jpg",
    brand: {
      "@type": "Brand",
      name: "KiteSurf Passion"
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "40",
      highPrice: "40",
      priceCurrency: "EUR",
      offerCount: 1,
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
    name: "Wakeboard Hyères baie de Giens",
    description: "Session de wakeboard tractée par bateau sur la baie d'Hyères - école KiteSurf Passion Var",
    contentUrl: "https://www.kitesurfpassion.fr/images/wakeboard-hyeres.jpg",
    thumbnailUrl: "https://www.kitesurfpassion.fr/images/wakeboard-hyeres.jpg",
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
        name: "Le wakeboard est-il accessible aux débutants à Hyères ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, le wakeboard est une activité idéale pour les débutants ! Notre moniteur diplômé adapte la vitesse du bateau et vous guide pas à pas. La baie d'Hyères offre des conditions parfaites avec son eau calme et protégée."
        }
      },
      {
        "@type": "Question",
        name: "À partir de quel âge peut-on faire du wakeboard ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le wakeboard est accessible dès 8 ans. Les enfants utilisent du matériel adapté à leur taille et leur poids. Notre moniteur veille à leur sécurité et ajuste la session selon leur niveau. Une activité familiale parfaite !"
        }
      },
      {
        "@type": "Question",
        name: "Que comprend une session de wakeboard de 15 minutes ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La session inclut tout le matériel (planche, gilet, combinaison si besoin), l'encadrement par notre moniteur diplômé et bien sûr le temps de glisse tractée par notre bateau sur la baie d'Hyères. 15 minutes suffisent pour ressentir de vraies sensations !"
        }
      },
      {
        "@type": "Question",
        name: "Faut-il une condition physique particulière pour le wakeboard ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le wakeboard demande un minimum de tonus musculaire au niveau des bras et des jambes, mais reste accessible à tous. Savoir nager est obligatoire. Notre moniteur adapte l'intensité à chaque participant pour que tout le monde profite."
        }
      },
      {
        "@type": "Question",
        name: "Quelle différence entre wakeboard et ski nautique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le wakeboard se pratique avec une seule planche, pieds fixés, position latérale (comme en snowboard). Le ski nautique utilise deux skis, position face au bateau. Le wakeboard offre plus de possibilités de figures et une sensation de glisse différente."
        }
      },
      {
        "@type": "Question",
        name: "Où se déroulent les sessions de wakeboard à Hyères ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Les sessions ont lieu sur la baie d'Hyères, un plan d'eau exceptionnel bordé par la presqu'île de Giens et les îles d'Or. Les conditions sont idéales toute l'année : eau calme, températures agréables et cadre naturel préservé."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Wakeboard Hyères Almanarre | Session Glisse Bateau</title>
        <meta 
          name="description" 
          content="Wakeboard Hyères Almanarre : glisse tractée fun près de Giens. 15 min de sensations avec bateau et moniteur diplômé. 40€ la session !" 
        />
        <meta name="keywords" content="wakeboard Hyères, wakeboard baie d'Hyères, wakeboard bateau Hyères, glisse tractée Var, activité nautique Hyères" />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/wakeboard-hyeres" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/wakeboard-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/wakeboard-hyeres" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Wakeboard Hyères | Glisse Tractée Baie de Giens" />
        <meta property="og:description" content="Sessions wakeboard dès 40€ sur la baie d'Hyères. Fun et accessible dès 8 ans avec moniteur diplômé." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/wakeboard-hyeres" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Wakeboard Hyères - Session bateau école KiteSurf Passion" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Wakeboard Hyères | Sensations Glisse" />
        <meta name="twitter:description" content="Sessions wakeboard dès 40€ sur la baie d'Hyères !" />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Wakeboard Hyères baie Giens" />
        <link rel="alternate" hrefLang="fr" href="https://www.kitesurfpassion.fr/wakeboard-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/wakeboard-hyeres" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Kitesurf", "item": "https://www.kitesurfpassion.fr/cours-kitesurf-hyeres-debutant" },
            { "@type": "ListItem", "position": 3, "name": "Wakeboard", "item": "https://www.kitesurfpassion.fr/wakeboard-hyeres" }
          ]
        })}</script>
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
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={wakeboardHero}
              alt="Wakeboard Hyères baie de Giens - Session glisse tractée école KiteSurf Passion Var"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/25 to-background" />
          </div>

          <div className="container mx-auto px-4 text-center relative z-10 pt-32 pb-16">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6 drop-shadow-lg">
              Wakeboard{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-primary-foreground">
                Hyères
              </span>
            </h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8 drop-shadow-md">
              Découvrez les sensations de la glisse tractée sur la baie d'Hyères. 
              Une activité fun et accessible à tous, encadrée par notre moniteur diplômé.
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

        {/* Wakeboard Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-sunset/10 text-sunset rounded-full text-sm font-medium mb-4">
                Glisse Tractée
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Fun et Sensations Garanties
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Le wakeboard est une activité ludique et accessible à tous. 
                Profitez de la magnifique baie d'Hyères pour des sessions de glisse inoubliables.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {wakeboardBenefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="bg-card p-6 rounded-2xl border border-border hover:border-sunset/30 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-sunset/10 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-sunset" />
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

            {/* Price */}
            <div className="max-w-sm mx-auto">
              {wakeboardPrices.map((item, index) => (
                <div 
                  key={index}
                  className="bg-card p-6 rounded-2xl border border-sunset/30 transition-all duration-300 hover:shadow-xl shadow-lg"
                >
                  <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                  <div className="text-3xl font-bold text-sunset mb-4">{item.price}</div>
                  <ul className="space-y-2">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-sunset flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contenu SEO descriptif enrichi */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-8 text-center">
                Le Wakeboard à Hyères : Une Expérience de Glisse{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">Inoubliable</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed mb-12">
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-foreground">Pourquoi choisir le wakeboard à Hyères ?</h3>
                  <p>
                    Le wakeboard est l'une des activités nautiques les plus accessibles et les plus fun de la côte varoise. Pratiqué sur la <strong>baie d'Hyères</strong>, entre la presqu'île de Giens et les célèbres îles d'Or (Porquerolles, Port-Cros, Le Levant), le wakeboard offre un cadre exceptionnel pour découvrir les sensations de la glisse tractée.
                  </p>
                  <p>
                    Contrairement au kitesurf ou au wingfoil, le wakeboard ne nécessite aucune connaissance du vent ni de pilotage d'aile. Vous êtes simplement tracté par notre bateau, ce qui rend l'activité <strong>accessible dès 8 ans</strong> et à tous les niveaux de condition physique. C'est l'activité idéale pour une sortie en famille, entre amis, ou pour les vacanciers qui souhaitent s'initier aux sports de glisse sans engagement.
                  </p>
                  <p>
                    Notre moniteur diplômé d'État (BPJEPS) ajuste la vitesse du bateau en temps réel selon votre niveau. Les débutants commencent à vitesse réduite pour maîtriser la position de base, tandis que les riders confirmés peuvent monter en puissance pour travailler leurs figures et sauts.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-foreground">Un spot privilégié dans le Var</h3>
                  <p>
                    La <strong>baie d'Hyères</strong> est un plan d'eau naturellement protégé, offrant des conditions idéales pour le wakeboard : eau calme, faible houle et températures agréables de mars à novembre. Vous naviguez dans un cadre naturel préservé, loin des zones de baignade, avec une vue imprenable sur les îles d'Hyères.
                  </p>
                  <p>
                    Chaque session de <strong>15 minutes de wakeboard</strong> est suffisante pour ressentir les premières sensations de glisse. C'est un format court mais intense, parfait pour découvrir l'activité ou se faire plaisir entre deux cours de <Link to="/cours-kitesurf-hyeres-debutant" className="text-primary hover:underline">kitesurf</Link> ou de <Link to="/stage-wingfoil-hyeres-almanarre" className="text-primary hover:underline">wingfoil</Link>.
                  </p>
                  <p>
                    Le matériel est entièrement fourni : planche de wakeboard adaptée à votre gabarit, gilet de flottaison homologué, et combinaison néoprène si les conditions le nécessitent. Vous n'avez rien à apporter, si ce n'est votre envie de glisser !
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed">
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-foreground">Le wakeboard : une porte d'entrée vers la glisse</h3>
                  <p>
                    Le wakeboard est souvent le <strong>premier contact avec les sports nautiques</strong> pour de nombreuses familles en vacances à Hyères. Sa simplicité d'accès — il suffit de se lever sur la planche et de se laisser tracter — en fait l'activité parfaite pour tester son appétit pour la glisse avant de se lancer dans des disciplines plus techniques.
                  </p>
                  <p>
                    Beaucoup de nos élèves en kitesurf ont commencé par une session de wakeboard qui leur a donné le goût de la glisse. Le wakeboard développe l'<strong>équilibre latéral</strong> (position sideways), le gainage et la confiance dans l'eau — des compétences directement transférables au kitesurf et au wingfoil.
                  </p>
                  <p>
                    Pour les enfants de 8 à 12 ans qui ne peuvent pas encore pratiquer le kitesurf (poids minimum 35 kg), le wakeboard est l'<strong>alternative idéale</strong>. Ils découvrent les sensations de glisse en toute sécurité, encadrés par notre moniteur expérimenté et équipés de matériel adapté à leur morphologie.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-foreground">Combiner wakeboard et autres activités</h3>
                  <p>
                    Le wakeboard s'intègre naturellement dans notre offre multi-activités. En complément d'un <Link to="/stage-kitesurf-100-glisse-hyeres" className="text-primary hover:underline">stage de kitesurf</Link>, une session de wakeboard permet de varier les plaisirs et de profiter des jours où les conditions de vent ne sont pas optimales pour le kite.
                  </p>
                  <p>
                    Nous proposons également le <Link to="/foil-tracte-hyeres" className="text-primary hover:underline">foil tracté</Link>, une activité tractée similaire mais avec un foil sous la planche qui vous fait décoller au-dessus de l'eau. Pour ceux qui veulent des sensations plus intenses, c'est l'étape suivante après le wakeboard.
                  </p>
                  <p>
                    Depuis <strong>1999</strong>, notre école <Link to="/a-propos-ecole-kitesurf-hyeres" className="text-primary hover:underline">KiteSurf Passion</Link> accompagne les amateurs de sports nautiques sur les spots d'Hyères. Le wakeboard, le <Link to="/cours-pumpfoil-dock-start-hyeres" className="text-primary hover:underline">pumpfoil</Link> et le foil tracté complètent notre offre pour une expérience de glisse complète. Consultez nos <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres" className="text-primary hover:underline">tarifs</Link> ou <Link to="/contact-reservation-kitesurf-hyeres" className="text-primary hover:underline">réservez directement</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Témoignages Wakeboard */}
        <FoilWakeboardTestimonials 
          variant="wakeboard" 
          title="Ils Ont Testé le Wakeboard" 
        />

        {/* Passerelle vers Kitesurf */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-sunset/5 to-primary/5 rounded-3xl p-8 md:p-12 border border-sunset/10">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Envie de Plus de Sensations ?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Le wakeboard vous a donné le goût de la glisse ? 
                  Découvrez le kitesurf et ses sensations incomparables avec nos stages adaptés à tous les niveaux !
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/stage-kitesurf-100-glisse-hyeres">
                    <Button variant="sunset" size="lg">
                      Stage Kitesurf 100% Glisse
                    </Button>
                  </Link>
                  <Link to="/cours-kitesurf-hyeres-debutant">
                    <Button variant="outline" size="lg">
                      Tous les Cours Kitesurf
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
          subtitle="Tout savoir sur le wakeboard à Hyères et dans la baie de Giens"
          accentColor="sunset"
          faqs={[
            {
              question: "Le wakeboard est-il accessible aux débutants à Hyères ?",
              answer: "Oui, le wakeboard est une activité idéale pour les débutants ! Notre moniteur diplômé adapte la vitesse du bateau et vous guide pas à pas. La baie d'Hyères offre des conditions parfaites avec son eau calme et protégée."
            },
            {
              question: "À partir de quel âge peut-on faire du wakeboard ?",
              answer: "Le wakeboard est accessible dès 8 ans. Les enfants utilisent du matériel adapté à leur taille et leur poids. Notre moniteur veille à leur sécurité et ajuste la session selon leur niveau. Une activité familiale parfaite !"
            },
            {
              question: "Que comprend une session de wakeboard de 15 minutes ?",
              answer: "La session inclut tout le matériel (planche, gilet, combinaison si besoin), l'encadrement par notre moniteur diplômé et bien sûr le temps de glisse tractée par notre bateau sur la baie d'Hyères. 15 minutes suffisent pour ressentir de vraies sensations !"
            },
            {
              question: "Faut-il une condition physique particulière pour le wakeboard ?",
              answer: "Le wakeboard demande un minimum de tonus musculaire au niveau des bras et des jambes, mais reste accessible à tous. Savoir nager est obligatoire. Notre moniteur adapte l'intensité à chaque participant pour que tout le monde profite."
            },
            {
              question: "Quelle différence entre wakeboard et ski nautique ?",
              answer: "Le wakeboard se pratique avec une seule planche, pieds fixés, position latérale (comme en snowboard). Le ski nautique utilise deux skis, position face au bateau. Le wakeboard offre plus de possibilités de figures et une sensation de glisse différente."
            },
            {
              question: "Où se déroulent les sessions de wakeboard à Hyères ?",
              answer: "Les sessions ont lieu sur la baie d'Hyères, un plan d'eau exceptionnel bordé par la presqu'île de Giens et les îles d'Or. Les conditions sont idéales toute l'année : eau calme, températures agréables et cadre naturel préservé."
            }
          ]}
        />

        {/* Maillage interne - Vers pages piliers et complémentaires */}
        <InternalLinking
          title="Découvrez Nos Autres Activités"
          subtitle="Continuez l'aventure glisse à Hyères"
          links={[
            disciplineLinks.stage100,
            disciplineLinks.foilTracte,
            disciplineLinks.wingfoil,
            { ...pillarLinks.tarifs, description: "Tous nos tarifs" },
          ]}
          accentColor="sunset"
        />

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-sunset via-sunset/90 to-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Prêt pour la Glisse ?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Réservez votre session de wakeboard et vivez des sensations inoubliables 
              sur la magnifique baie d'Hyères !
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

export default Wakeboard;
