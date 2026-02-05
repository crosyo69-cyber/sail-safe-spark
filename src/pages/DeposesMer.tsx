import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Check, Anchor, Shield, MapPin, Users, Phone } from "lucide-react";
import { ActivityFAQ } from "@/components/sections/ActivityFAQ";
import { InternalLinking, disciplineLinks, pillarLinks } from "@/components/sections/InternalLinking";
import { Link } from "react-router-dom";
import { getProductRatingData } from "@/lib/seo-ratings";
import bateauSecurite from "@/assets/bateau-assistance-kitesurf.jpg?webp";

const breadcrumbItems = [
  { label: "Déposes en Mer" }
];

const dropPrices = [
  { 
    name: "Dépose Mer", 
    description: "Accès bateau pour une session", 
    price: "45€",
    details: "Bateau sécurité inclus"
  },
  { 
    name: "Location + Dépose", 
    description: "Matériel complet + dépose en mer", 
    price: "80€", 
    popular: true,
    details: "Formule complète"
  },
  { 
    name: "Carnet 10 Déposes", 
    description: "10 déposes en mer", 
    price: "300€",
    details: "Économisez 150€"
  },
];

const advantages = [
  {
    icon: Anchor,
    title: "Accès aux Meilleurs Spots",
    description: "Dépose directe sur les zones de navigation optimales de la baie d'Hyères et du spot de l'Almanarre."
  },
  {
    icon: Shield,
    title: "Sécurité Maximale",
    description: "Bateau d'assistance permanent sur zone. Encadrement professionnel pour naviguer en toute sérénité."
  },
  {
    icon: MapPin,
    title: "Flexibilité Totale",
    description: "Nous nous adaptons aux conditions météo pour vous déposer sur le meilleur spot du jour (Almanarre, Giens, baie d'Hyères)."
  },
  {
    icon: Users,
    title: "Pratiquants Autonomes",
    description: "Service réservé aux kitesurfeurs confirmés et autonomes. Niveau minimum requis."
  },
];

const conditions = [
  "Être autonome au waterstart et navigation",
  "Savoir gérer son matériel en toute situation",
  "Maîtriser les règles de priorité et sécurité",
  "Avoir une assurance responsabilité civile",
];

const DeposesMer = () => {
  return (
    <>
      <Helmet>
        <title>Déposes Mer Kitesurf Hyères | Bateau Almanarre</title>
        <meta
          name="description"
          content="Service de déposes en mer pour kitesurf à Hyères. Bateau sécurité sur l'Almanarre et Giens. Accès aux meilleurs spots dès 45€. Réservez votre dépose."
        />
        <meta
          name="keywords"
          content="déposes en mer kitesurf Hyères, bateau sécurité kitesurf Almanarre, dépose en mer kitesurf Giens, downwind kitesurf var"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/deposes-mer-kitesurf-hyeres" />
        <link rel="alternate" hrefLang="fr" href="https://www.kitesurfpassion.fr/deposes-mer-kitesurf-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/deposes-mer-kitesurf-hyeres" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Déposes en Mer Kitesurf Hyères | Bateau Almanarre & Giens" />
        <meta property="og:description" content="Accédez aux meilleurs spots kitesurf de Hyères par bateau. Dépose en mer sécurisée dès 45€. Almanarre, Giens, baie d'Hyères." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/deposes-mer-kitesurf-hyeres" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Dépose en mer kitesurf Hyères - Bateau école KiteSurf Passion" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Déposes Mer Kitesurf Hyères | Bateau Almanarre" />
        <meta name="twitter:description" content="Bateau sécurité pour kitesurf dès 45€ à Hyères." />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Dépose mer kitesurf Hyères" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/deposes-mer-kitesurf-hyeres" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Déposes en Mer Kitesurf",
            "provider": {
              "@type": "LocalBusiness",
              "name": "KiteSurf Passion",
              "url": "https://www.kitesurfpassion.fr",
              "image": "https://www.kitesurfpassion.fr/assets/bateau-assistance-kitesurf.jpg",
              "priceRange": "€€",
              "telephone": "+33672716905",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Hyères",
                "addressRegion": "Var",
                "postalCode": "83400",
                "addressCountry": "FR"
              }
            },
            "areaServed": ["Hyères", "Almanarre", "Giens", "Var"],
            "description": "Service de déposes en mer pour kitesurfeurs autonomes avec bateau de sécurité",
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "45",
              "highPrice": "300",
              "priceCurrency": "EUR",
              "offerCount": 3,
              "availability": "https://schema.org/InStock"
            }
          })}
        </script>
        {/* Product schema for reviews eligibility */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Déposes en Mer Kitesurf - Hyères",
            "description": "Service de déposes en mer pour kitesurfeurs autonomes avec bateau de sécurité sur la baie d'Hyères, l'Almanarre et Giens.",
            "image": "https://www.kitesurfpassion.fr/assets/bateau-assistance-kitesurf.jpg",
            "brand": {
              "@type": "Brand",
              "name": "KiteSurf Passion"
            },
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "45",
              "highPrice": "300",
              "priceCurrency": "EUR",
              "offerCount": 3,
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
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Qu'est-ce qu'une dépose en mer pour le kitesurf ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Une dépose en mer est un service de transport en bateau qui vous emmène directement sur les meilleurs spots de navigation. Vous évitez le départ depuis la plage et accédez à des zones de kitesurf optimales sur la baie d'Hyères, l'Almanarre ou la presqu'île de Giens."
                }
              },
              {
                "@type": "Question",
                name: "Quel niveau de kitesurf faut-il pour les déposes en mer ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Le service est réservé aux kitesurfeurs autonomes. Vous devez maîtriser le waterstart, naviguer de manière indépendante, gérer votre matériel en toutes situations et connaître les règles de priorité. En cas de doute, contactez-nous pour évaluer votre niveau."
                }
              },
              {
                "@type": "Question",
                name: "Le bateau de sécurité reste-t-il sur zone pendant ma session ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Oui, notre bateau d'assistance reste sur zone pendant toute la durée de votre session. Un professionnel veille à votre sécurité et peut intervenir rapidement en cas de besoin. C'est la garantie de naviguer sereinement sur les spots de Hyères."
                }
              },
              {
                "@type": "Question",
                name: "Puis-je combiner location de matériel et dépose en mer ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Absolument ! Notre formule Location + Dépose à 80€ inclut le matériel complet (aile, planche, harnais) et la dépose en mer. C'est la solution idéale pour les riders autonomes en voyage qui n'ont pas apporté leur équipement."
                }
              },
              {
                "@type": "Question",
                name: "Sur quels spots les déposes en mer sont-elles possibles ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Nous proposons des déposes sur l'Almanarre, la presqu'île de Giens et la baie d'Hyères. Le choix du spot dépend des conditions météo du jour. Notre connaissance locale nous permet de vous placer sur la meilleure zone pour votre session."
                }
              },
              {
                "@type": "Question",
                name: "Le carnet de 10 déposes est-il nominatif ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Le carnet de 10 déposes peut être partagé entre plusieurs personnes (famille, groupe d'amis). À 30€ la dépose au lieu de 45€, c'est l'offre idéale pour les pratiquants réguliers sur les spots de Hyères. Validité d'un an."
                }
              }
            ]
          })}
        </script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Déposes en Mer", "item": "https://www.kitesurfpassion.fr/deposes-mer-kitesurf-hyeres" }
          ]
        })}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={bateauSecurite}
              alt="Bateau assistance kitesurf Hyères - Déposes en mer école KiteSurf Passion Almanarre Var"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/25 to-background" />
          </div>

          {/* Content */}
          <div className="container mx-auto px-4 text-center relative z-10 pt-32 pb-16">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6 drop-shadow-lg">
              Déposes en{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-turquoise to-primary-foreground">
                Mer
              </span>
            </h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8 drop-shadow-md">
              Accédez aux meilleurs spots de kitesurf de la baie d'Hyères en toute sécurité. 
              Notre bateau vous dépose directement sur zone pour des sessions inoubliables.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  <Anchor className="w-5 h-5 mr-2" />
                  Réserver une Dépose en Mer
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

        {/* Avantages */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-12 text-center">
              Pourquoi Choisir Nos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">
                Déposes en Mer
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {advantages.map((item) => (
                <div
                  key={item.title}
                  className="bg-card rounded-2xl p-6 border border-border/50 flex gap-4"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tarifs */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              Nos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">
                Tarifs
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {dropPrices.map((item) => (
                <div
                  key={item.name}
                  className={`bg-card rounded-2xl p-6 border ${
                    item.popular ? "border-primary shadow-glow" : "border-border/50"
                  } relative text-center`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                      Populaire
                    </span>
                  )}
                  <h3 className="font-display font-bold text-foreground mb-2">{item.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                  <p className="font-display text-4xl font-bold text-foreground mb-2">{item.price}</p>
                  <p className="text-primary text-sm font-medium">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Conditions */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
                Conditions d'Accès
              </h2>

              <div className="bg-card rounded-3xl p-8 border border-border/50">
                <p className="text-muted-foreground mb-6 text-center">
                  Le service de déposes en mer est réservé aux pratiquants autonomes. 
                  Vous devez :
                </p>
                <ul className="space-y-4">
                  {conditions.map((item) => (
                    <li key={item} className="flex items-center gap-4">
                      <Check className="w-6 h-6 text-primary flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground mt-6 text-sm text-center">
                  En cas de doute sur votre niveau, contactez-nous. Nous évaluerons ensemble 
                  si ce service est adapté à votre pratique.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Spots */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              Nos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-turquoise to-primary">
                Zones de Dépose
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-card rounded-2xl p-6 border border-border/50 text-center">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-display font-bold text-foreground mb-2">L'Almanarre</h3>
                <p className="text-muted-foreground text-sm">
                  Spot mythique de la presqu'île de Giens. Conditions idéales pour le kitesurf.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border/50 text-center">
                <MapPin className="w-8 h-8 text-turquoise mx-auto mb-4" />
                <h3 className="font-display font-bold text-foreground mb-2">Presqu'île de Giens</h3>
                <p className="text-muted-foreground text-sm">
                  Différentes zones selon les conditions météo. Navigation variée.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border/50 text-center">
                <MapPin className="w-8 h-8 text-sunset mx-auto mb-4" />
                <h3 className="font-display font-bold text-foreground mb-2">Baie d'Hyères</h3>
                <p className="text-muted-foreground text-sm">
                  Large plan d'eau protégé. Parfait pour les downwinds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SEO */}
        <ActivityFAQ
          title="Questions Fréquentes"
          subtitle="Tout savoir sur les déposes en mer pour kitesurf à Hyères"
          accentColor="ocean"
          faqs={[
            {
              question: "Qu'est-ce qu'une dépose en mer pour le kitesurf ?",
              answer: "Une dépose en mer est un service de transport en bateau qui vous emmène directement sur les meilleurs spots de navigation. Vous évitez le départ depuis la plage et accédez à des zones de kitesurf optimales sur la baie d'Hyères, l'Almanarre ou la presqu'île de Giens."
            },
            {
              question: "Quel niveau de kitesurf faut-il pour les déposes en mer ?",
              answer: "Le service est réservé aux kitesurfeurs autonomes. Vous devez maîtriser le waterstart, naviguer de manière indépendante, gérer votre matériel en toutes situations et connaître les règles de priorité. En cas de doute, contactez-nous pour évaluer votre niveau."
            },
            {
              question: "Le bateau de sécurité reste-t-il sur zone pendant ma session ?",
              answer: "Oui, notre bateau d'assistance reste sur zone pendant toute la durée de votre session. Un professionnel veille à votre sécurité et peut intervenir rapidement en cas de besoin. C'est la garantie de naviguer sereinement sur les spots de Hyères."
            },
            {
              question: "Puis-je combiner location de matériel et dépose en mer ?",
              answer: "Absolument ! Notre formule Location + Dépose à 80€ inclut le matériel complet (aile, planche, harnais) et la dépose en mer. C'est la solution idéale pour les riders autonomes en voyage qui n'ont pas apporté leur équipement."
            },
            {
              question: "Sur quels spots les déposes en mer sont-elles possibles ?",
              answer: "Nous proposons des déposes sur l'Almanarre, la presqu'île de Giens et la baie d'Hyères. Le choix du spot dépend des conditions météo du jour. Notre connaissance locale nous permet de vous placer sur la meilleure zone pour votre session."
            },
            {
              question: "Le carnet de 10 déposes est-il nominatif ?",
              answer: "Le carnet de 10 déposes peut être partagé entre plusieurs personnes (famille, groupe d'amis). À 30€ la dépose au lieu de 45€, c'est l'offre idéale pour les pratiquants réguliers sur les spots de Hyères. Validité d'un an."
            }
          ]}
        />

        {/* Related Services */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Services Complémentaires
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                to="/location-materiel-kitesurf-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Location Matériel</h3>
                <p className="text-muted-foreground text-sm mb-3">Équipement complet à la journée</p>
                <span className="text-primary text-sm font-medium">Dès 30€ →</span>
              </Link>
              <Link 
                to="/stage-kitesurf-100-glisse-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stage Kitesurf</h3>
                <p className="text-muted-foreground text-sm mb-3">Devenez autonome en 5 jours</p>
                <span className="text-primary text-sm font-medium">Dès 399€ →</span>
              </Link>
              <Link 
                to="/spot-kitesurf-almanarre-hyeres-var"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors text-center group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Le Spot</h3>
                <p className="text-muted-foreground text-sm mb-3">Découvrez l'Almanarre</p>
                <span className="text-primary text-sm font-medium">En savoir plus →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
              Prêt pour Votre Dépose en Mer ?
            </h2>
            <p className="mb-8 text-primary-foreground/80">
              Réservez dès maintenant votre créneau. Nous nous adaptons à la météo pour vous offrir 
              les meilleures conditions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Réserver une Dépose en Mer</Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <a href="tel:0672716905">Appeler : 06 72 71 69 05</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default DeposesMer;
