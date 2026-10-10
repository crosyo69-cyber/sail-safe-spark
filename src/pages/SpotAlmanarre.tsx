import { Helmet } from "react-helmet-async";
import { trackPhoneClick } from "@/lib/analytics";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { WindguruWidget } from "@/components/sections/WindguruWidget";
import { WeatherAlertSubscription } from "@/components/WeatherAlertSubscription";
import { MeetingPointsSection } from "@/components/sections/MeetingPointsSection";
import { ActivityFAQ } from "@/components/sections/ActivityFAQ";
import { InternalLinking, disciplineLinks, pillarLinks } from "@/components/sections/InternalLinking";

import { 
  MapPin, 
  Wind, 
  Waves, 
  Sun, 
  ThermometerSun, 
  Compass,
  Shield,
  Users,
  Car,
  Coffee,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import almanarre from "@/assets/almanarre-sunset.jpg?webp";
import spotVueAerienne from "@/assets/spot-almanarre-vue-aerienne.jpg?webp";

const breadcrumbItems = [
  { label: "Spot Almanarre" }
];

const spotFeatures = [
  {
    icon: Wind,
    title: "Vent Thermique Régulier",
    description: "Le Mistral et les vents d'Est influencent les conditions de navigation. Consultez les prévisions et les observations du jour."
  },
  {
    icon: Waves,
    title: "État du Plan d'Eau",
    description: "Le clapot et les vagues dépendent du vent. L'état du plan d'eau est vérifié avant la séance."
  },
  {
    icon: Sun,
    title: "300 Jours de Soleil",
    description: "Le Var bénéficie d'un ensoleillement exceptionnel, rendant la pratique agréable toute l'année."
  },
  {
    icon: Shield,
    title: "Zones de Navigation Réglementées",
    description: "Les zones autorisées et les règles locales doivent être respectées pendant la navigation."
  }
];

const practicalInfo = [
  {
    icon: Car,
    title: "Accès & Parking",
    details: [
      "Parking gratuit sur la plage",
      "Accès facile depuis l'A570",
      "À 10 min de Hyères centre",
      "GPS : 43.0617° N, 6.1455° E"
    ]
  },
  {
    icon: Coffee,
    title: "Commodités",
    details: [
      "Restaurants et bars sur place",
      "Douches et sanitaires",
      "Location de matériel disponible",
      "École de voile à proximité"
    ]
  },
  {
    icon: Users,
    title: "Pour Tous Niveaux",
    details: [
      "Zone débutants protégée",
      "Espace confirmés au large",
      "Cours collectifs et particuliers",
      "Encadrement diplômé d'État"
    ]
  }
];

const conditions = [
  { label: "Période estivale", value: "Avril à Septembre" },
  { label: "Vent dominant", value: "Mistral (N-NO) / Est" },
  { label: "Force moyenne", value: "15-25 nœuds" },
  { label: "Température eau", value: "18-24°C en été" },
  { label: "Type de fond", value: "Sable fin" },
  { label: "Profondeur", value: "1-3m sur 200m" }
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Beach",
  name: "Plage de l'Almanarre - Spot Kitesurf Hyères",
  description: "Spot de kitesurf et wingfoil à Hyères dans le Var. Le lieu de pratique est choisi selon le niveau des élèves, le vent et l'état de la mer.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Plage de l'Almanarre",
    addressLocality: "Hyères",
    postalCode: "83400",
    addressCountry: "FR"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 43.0617,
    longitude: 6.1455
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Parking gratuit" },
    { "@type": "LocationFeatureSpecification", name: "Douches" },
    { "@type": "LocationFeatureSpecification", name: "Restaurants" }
  ]
};

// FAQ data for the spot page
const spotFaqs = [
  {
    question: "Quelles conditions rencontre-t-on sur le spot de l'Almanarre ?",
    answer: "L'Almanarre est exposée notamment au Mistral. La force et la direction du vent, le clapot et la profondeur varient selon la météo et la zone. Le moniteur vérifie ces conditions avant de choisir le lieu de la séance."
  },
  {
    question: "À quelle période pratique-t-on le kitesurf à l'Almanarre ?",
    answer: "Les séances sont organisées en fonction des conditions du jour. Au printemps et en automne, le Mistral peut être présent ; en été, les températures de l'eau sont plus élevées. Aucune saison ne garantit des conditions navigables chaque jour."
  },
  {
    question: "Y a-t-il des zones dédiées aux débutants sur le spot ?",
    answer: "Le moniteur choisit une zone en fonction du niveau des élèves, du vent, de l'état de la mer et de la réglementation. La profondeur varie selon l'endroit : elle doit être vérifiée avant la pratique, notamment avec un foil."
  },
  {
    question: "Quelles sont les commodités disponibles sur le spot de l'Almanarre ?",
    answer: "Le spot dispose d'un parking gratuit, de douches et sanitaires, de restaurants et bars sur place. Notre école propose la location de matériel et des cours avec bateau d'assistance."
  },
  {
    question: "Comment accéder au spot de l'Almanarre depuis Hyères ?",
    answer: "L'Almanarre est à 10 min de Hyères centre, accès facile depuis l'A570. Coordonnées GPS : 43.0617° N, 6.1455° E. Parking gratuit directement sur la plage."
  }
];

const spotFaqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: spotFaqs.map(faq => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer }
  }))
};

// SportsActivityLocation schema for enhanced local SEO
const sportsActivityLocationData = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  "@id": "https://www.kitesurfpassion.fr/spot-kitesurf-almanarre-hyeres-var#sportslocation",
  name: "Spot Kitesurf & Wingfoil de l'Almanarre",
  priceRange: "€€",
  description: "Spot de sports nautiques à Hyères. Kitesurf, wingfoil et pumpfoil se pratiquent selon les conditions météo et la réglementation locale.",
  url: "https://www.kitesurfpassion.fr/spot-kitesurf-almanarre-hyeres-var",
  image: "https://www.kitesurfpassion.fr/images/almanarre-sunset.jpg",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Plage de l'Almanarre",
    addressLocality: "Hyères",
    postalCode: "83400",
    addressRegion: "Var",
    addressCountry: "FR"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 43.0617,
    longitude: 6.1455
  },
  telephone: "+33672716905",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "09:00",
    closes: "19:00",
    validFrom: "2026-03-01",
    validThrough: "2026-11-30"
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Parking gratuit", value: true },
    { "@type": "LocationFeatureSpecification", name: "Douches publiques", value: true },
    { "@type": "LocationFeatureSpecification", name: "Restaurants à proximité", value: true },
    { "@type": "LocationFeatureSpecification", name: "Location matériel", value: true },
    { "@type": "LocationFeatureSpecification", name: "Bateau d'assistance", value: true },
    { "@type": "LocationFeatureSpecification", name: "Zone débutants protégée", value: true }
  ],
  sport: ["Kitesurf", "Wingfoil", "Pumpfoil", "Windsurf"],
  publicAccess: true,
  isAccessibleForFree: true,
  slogan: "Un spot de kitesurf à Hyères, dans le Var",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "127",
    bestRating: "5",
    worstRating: "1"
  }
};

const imageStructuredData = {
  "@context": "https://schema.org",
  "@type": "ImageObject",
  name: "Spot kitesurf Almanarre Hyères coucher de soleil",
  description: "Plage de l'Almanarre à Hyères au coucher de soleil - spot de kitesurf à Hyères dans le Var",
  contentUrl: "https://www.kitesurfpassion.fr/images/almanarre-sunset.jpg",
  thumbnailUrl: "https://www.kitesurfpassion.fr/images/almanarre-sunset.jpg",
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

export default function SpotAlmanarre() {
  return (
    <>
      <Helmet>
        <title>Spot Kitesurf Almanarre Hyères | Kitesurf Passion – Conditions et Accès</title>
        <meta
          name="description"
          content="Découvrez le spot de l'Almanarre à Hyères avec Kitesurf Passion : informations sur le vent, les conditions de navigation, l'accès et les équipements."
        />
        <meta
          name="keywords"
          content="spot kitesurf almanarre, plage almanarre hyères, kitesurf var, wingfoil hyères, conditions vent almanarre, spot débutant kitesurf"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/spot-kitesurf-almanarre-hyeres-var" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/spot-kitesurf-almanarre-hyeres-var" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/spot-kitesurf-almanarre-hyeres-var" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Spot Kitesurf Almanarre Hyères | Kitesurf Passion – Conditions et Accès" />
        <meta property="og:description" content="Découvrez l'Almanarre à Hyères avec Kitesurf Passion : conditions de navigation, accès au spot et cours avec bateau d'assistance." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/spot-kitesurf-almanarre-hyeres-var" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Spot kitesurf Almanarre Hyères - Vue de la plage" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Spot Kitesurf Almanarre Hyères" />
        <meta name="twitter:description" content="L'Almanarre à Hyères : informations sur le vent, les conditions de navigation et l'accès au spot." />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Spot Almanarre Hyères kitesurf" />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(imageStructuredData)}
        </script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Spot Almanarre", "item": "https://www.kitesurfpassion.fr/spot-kitesurf-almanarre-hyeres-var" }
          ]
        })}</script>
        <script type="application/ld+json">
          {JSON.stringify(sportsActivityLocationData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(spotFaqStructuredData)}
        </script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="hero-split-breadcrumb" />
      
      <main>
        {/* Hero Section */}
        <section className="hero-split">
          <div className="hero-split-photo">
            <img
              src={almanarre}
              alt="Spot kitesurf Almanarre Hyères - Coucher de soleil plage de glisse Var"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="hero-split-panel">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 mb-6">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Hyères, Var (83)</span>
            </div>
            
            <h1 className="font-display text-[2.25rem] leading-[1.05] sm:text-5xl xl:text-6xl font-black text-primary-foreground mb-5">
              Le Spot de{" "}
              <span className="bg-gradient-to-r from-primary via-turquoise to-primary bg-clip-text text-transparent">
                l'Almanarre
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Un spot de kitesurf et wingfoil à Hyères, dans le Var.
              Le lieu de la séance est choisi selon le vent, l'état de la mer et votre niveau.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  Réserver un Cours
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <a href="#conditions">Voir les Conditions</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
                Les caractéristiques du{" "}
                <span className="text-primary">Spot de l'Almanarre</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                À l'Almanarre, les conditions de navigation varient avec la direction
                et la force du vent. Les séances sont adaptées au niveau des élèves.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {spotFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-turquoise/20 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Photo du Spot Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
                Vue Panoramique du <span className="text-primary">Spot</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Découvrez l'ambiance unique de l'Almanarre, avec ses dizaines de kites colorés sur la baie.
              </p>
            </div>
            
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-lg">
              <img 
                src={spotVueAerienne}
                alt="Spot kitesurf Presqu'île de Giens - Vue aérienne de la baie de l'Almanarre avec de nombreux kitesurfeurs"
                loading="lazy"
                decoding="async"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>

        {/* Weather Widget Section */}
        <WindguruWidget />

        {/* Weather Alerts Subscription */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-xl">
            <WeatherAlertSubscription />
          </div>
        </section>

        {/* Conditions Section */}
        <section id="conditions" className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-sunset/10 rounded-full px-4 py-2 mb-6">
                  <Compass className="w-4 h-4 text-sunset" />
                  <span className="text-sm font-medium text-sunset">Conditions de Navigation</span>
                </div>
                
                <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-6">
                  Les Conditions{" "}
                  <span className="text-primary">de Navigation</span>{" "}
                  au Fil des Saisons
                </h2>
                
                <p className="text-muted-foreground mb-8">
                  Le Mistral et les vents d'Est modifient les conditions autour de la
                  presqu'île de Giens. La direction du vent, sa force et l'état de
                  la mer sont vérifiés avant chaque séance de kitesurf ou de wingfoil.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {conditions.map((item, index) => (
                    <div key={index} className="bg-muted/50 rounded-xl p-4">
                      <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                      <p className="font-display font-bold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-primary/10 to-turquoise/10 rounded-3xl p-8 border border-primary/20">
                  <div className="flex items-center gap-3 mb-6">
                    <ThermometerSun className="w-8 h-8 text-sunset" />
                    <h3 className="font-display font-bold text-xl text-foreground">
                      Repères Saisonniers
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">Printemps (Avril-Juin)</p>
                        <p className="text-sm text-muted-foreground">Mistral régulier, températures agréables, moins de monde</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">Été (Juillet-Août)</p>
                        <p className="text-sm text-muted-foreground">Thermique d'Est fiable, eau chaude (22-24°C)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">Automne (Sept-Oct)</p>
                        <p className="text-sm text-muted-foreground">Conditions mixtes excellentes, eau encore chaude</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Practical Info Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
                Informations <span className="text-primary">Pratiques</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Tout ce qu'il faut savoir pour organiser votre session à l'Almanarre.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {practicalInfo.map((info, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-2xl p-8 border border-border/50"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-sunset/20 to-primary/20 rounded-xl flex items-center justify-center mb-6">
                    <info.icon className="w-7 h-7 text-sunset" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-4">
                    {info.title}
                  </h3>
                  <ul className="space-y-3">
                    {info.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Points de Rendez-vous */}
        <MeetingPointsSection />

        {/* Map Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
                <span className="text-primary">Localisation</span> du Spot
              </h2>
              <p className="text-muted-foreground">
                Plage de l'Almanarre, 83400 Hyères, Var
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11716.892726067!2d6.130!3d43.062!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12c918f4f5f4b7a3%3A0x9e5c54c47e1a6d1!2sPlage%20de%20l&#39;Almanarre!5e0!3m2!1sfr!2sfr!4v1699000000000!5m2!1sfr!2sfr"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Carte du spot de kitesurf de l'Almanarre à Hyères"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-turquoise/5 to-sunset/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-6">
              Prêt à Découvrir l'Almanarre ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Réservez votre cours de kitesurf ou wingfoil à Hyères avec un moniteur
              diplômé d'État. La séance est adaptée à votre niveau et à la météo.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="heroFilled" size="xl" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  Réserver Maintenant
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="hero" size="xl" asChild>
                <a href="tel:0672716905" onClick={() => trackPhoneClick("spot_almanarre")}>
                  Appeler : 06 72 71 69 05
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Maillage interne - Cours disponibles sur ce spot */}
        <InternalLinking
          title="Nos Cours sur le Spot"
          subtitle="Apprenez à naviguer sur l'Almanarre avec un moniteur diplômé"
          links={[
            disciplineLinks.stage100,
            disciplineLinks.wingfoil,
            disciplineLinks.pumpfoil,
            { ...pillarLinks.tarifs, description: "Tous nos tarifs" },
          ]}
          accentColor="primary"
        />

        {/* FAQ SEO */}
        <ActivityFAQ
          title="Questions Fréquentes"
          subtitle="Tout savoir sur le spot de l'Almanarre à Hyères"
          accentColor="primary"
          faqs={spotFaqs}
        />
      </main>

      <Footer />
    </>
  );
}
