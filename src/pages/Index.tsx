import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { WhyUsSection } from "@/components/sections/WhyUsSection";
import { ActivitiesSection } from "@/components/sections/ActivitiesSection";
import { TestimonialsSection, reviewsStructuredData } from "@/components/sections/TestimonialsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { GallerySection } from "@/components/sections/GallerySection";

const Index = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "KiteSurf Passion",
    description: "École de kitesurf, wingfoil et pumpfoil à Hyères depuis 1999. Bateau d'assistance, moniteur diplômé d'État, spot de l'Almanarre.",
    url: "https://www.kitesurfpassion.com",
    telephone: "+33672716905",
    email: "contact@kitesurfpassion.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "52 Avenue Général de Gaulle",
      addressLocality: "Carqueiranne",
      postalCode: "83320",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "43.0817",
      longitude: "6.1366",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "19:00",
    },
    priceRange: "€€",
    image: "https://www.kitesurfpassion.com/og-image.jpg",
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Combien de temps pour apprendre le kitesurf à Hyères ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "En moyenne, 5 séances de 3 heures suffisent pour devenir autonome. Notre pédagogie avec bateau d'assistance accélère la progression.",
        },
      },
      {
        "@type": "Question",
        name: "Quel est le prix d'un stage de kitesurf débutant ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Notre stage 100% Glisse (5 jours consécutifs) est à 399€ hors saison (499€ en juillet/août), tout inclus : matériel, combinaison, bateau d'assistance et foil tracté.",
        },
      },
      {
        "@type": "Question",
        name: "Le kitesurf est-il dangereux ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bien encadré, le kitesurf est un sport sûr. Notre école dispose d'un bateau d'assistance permanent, de matériel sécurisé et d'un moniteur diplômé d'État.",
        },
      },
      {
        "@type": "Question",
        name: "Faut-il savoir nager pour faire du kitesurf ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, il est nécessaire de savoir nager pour pratiquer le kitesurf en toute sécurité. Vous devez être à l'aise dans l'eau et capable de nager 50 mètres.",
        },
      },
      {
        "@type": "Question",
        name: "À partir de quel âge peut-on apprendre le kitesurf ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nous acceptons les enfants à partir de 10 ans pour le kitesurf, à condition qu'ils pèsent au moins 35 kg. Le wingfoil est accessible dès 8 ans.",
        },
      },
      {
        "@type": "Question",
        name: "Pourquoi un bateau d'assistance est-il important ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le bateau permet de vous récupérer rapidement si vous dérivez, de vous ramener au point de départ, et d'intervenir en cas de problème. C'est un gain de temps énorme pour votre apprentissage.",
        },
      },
      {
        "@type": "Question",
        name: "Quelle est la meilleure période pour apprendre à l'Almanarre ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "L'Almanarre bénéficie de vents réguliers de mars à novembre. Le Mistral et le Levant offrent d'excellentes conditions. L'été combine eau chaude et vent régulier.",
        },
      },
      {
        "@type": "Question",
        name: "Quelle différence entre kitesurf et wingfoil ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le kitesurf utilise une aile tractée par des lignes (25m), offrant puissance et sauts. Le wingfoil se pratique avec une aile tenue à la main sur un foil, plus accessible et avec une sensation unique de vol.",
        },
      },
      {
        "@type": "Question",
        name: "Le matériel est-il fourni pendant les cours ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, tout le matériel est inclus : aile, planche, harnais, combinaison, casque et gilet de flottaison. Nous utilisons du matériel récent et adapté à votre niveau.",
        },
      },
      {
        "@type": "Question",
        name: "Comment se passe une séance type de kitesurf ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Une séance dure 3 heures : briefing sécurité et théorie (30 min), échauffement et manipulation de l'aile au sol (30 min), puis pratique dans l'eau avec le bateau d'assistance (2h).",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>École Kitesurf Hyères | Cours avec Bateau d'Assistance | KiteSurf Passion</title>
        <meta
          name="description"
          content="Apprenez le kitesurf à Hyères depuis 1999. École itinérante avec bateau d'assistance, moniteur expert. Spot Almanarre idéal. ☎ 06 72 71 69 05"
        />
        <meta
          name="keywords"
          content="cours kitesurf hyères, école kitesurf almanarre, stage wingfoil var, école kitesurf bateau assistance, kitesurf débutant hyères"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.com/" />
        
        {/* Open Graph */}
        <meta property="og:title" content="École Kitesurf Hyères | Cours avec Bateau d'Assistance | KiteSurf Passion" />
        <meta property="og:description" content="Apprenez le kitesurf à Hyères depuis 1999. École itinérante avec bateau d'assistance, moniteur expert." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.com/" />
        <meta property="og:image" content="https://www.kitesurfpassion.com/og-image.jpg" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="École Kitesurf Hyères | KiteSurf Passion" />
        <meta name="twitter:description" content="Apprenez le kitesurf à Hyères depuis 1999. Bateau d'assistance, moniteur expert." />
        
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(reviewsStructuredData)}</script>
      </Helmet>

      <Header />
      
      <main>
        <HeroSection />
        <WhyUsSection />
        <ActivitiesSection />
        <GallerySection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </>
  );
};

export default Index;
