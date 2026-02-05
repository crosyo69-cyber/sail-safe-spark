import { memo, lazy, Suspense } from "react";
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
import { MeetingPointsSection } from "@/components/sections/MeetingPointsSection";
import { productAggregateRating, productReviews } from "@/lib/seo-ratings";

// Seller/Provider info for structured data
const sellerInfo = {
  "@type": "LocalBusiness",
  "@id": "https://www.kitesurfpassion.fr/#organization",
  name: "KiteSurf Passion",
  url: "https://www.kitesurfpassion.fr",
};

// Price validity date (end of current season)
const priceValidUntil = "2025-11-30";
const Index = () => {
  // SportsSchool structured data with extended offers
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "SportsActivityLocation"],
    "@id": "https://www.kitesurfpassion.fr/#organization",
    name: "KiteSurf Passion",
    alternateName: "École Kitesurf Hyères",
    description: "École de kitesurf, wingfoil, pumpfoil et foil tracté à Hyères Almanarre depuis 1999. Plus de 2 500 élèves formés. Bateau d'assistance, moniteur diplômé d'État BPJEPS, matériel Duotone récent.",
    url: "https://www.kitesurfpassion.fr",
    telephone: "+33672716905",
    email: "crosyo69@gmail.com",
    foundingDate: "1999",
    founder: {
      "@type": "Person",
      name: "Yoanne Cros",
      jobTitle: "Moniteur diplômé d'État BPJEPS et formateur de moniteurs",
    },
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      value: 1,
    },
    slogan: "Apprenez le kitesurf, wingfoil et pumpfoil en toute sécurité à Hyères",
    knowsAbout: ["Kitesurf", "Wingfoil", "Pumpfoil", "Foil tracté", "Wakeboard", "Dock Start"],
    hasCredential: [
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "BPJEPS",
        name: "Brevet Professionnel de la Jeunesse, de l'Éducation Populaire et du Sport",
      },
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "Formateur FFVL",
        name: "Formateur de moniteurs kitesurf",
      }
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "52 Avenue Général de Gaulle",
      addressLocality: "Carqueiranne",
      postalCode: "83320",
      addressRegion: "Var",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "43.0817",
      longitude: "6.1366",
    },
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: "43.0817",
        longitude: "6.1366",
      },
      geoRadius: "30000",
    },
    aggregateRating: productAggregateRating,
    review: productReviews,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "09:00",
        closes: "19:00",
        validFrom: "2025-03-01",
        validThrough: "2025-11-30"
      }
    ],
    priceRange: "€€",
    currenciesAccepted: "EUR",
    paymentAccepted: "Cash, Credit Card, Bank Transfer",
    image: [
      "https://www.kitesurfpassion.fr/og-image.jpg",
      "https://www.kitesurfpassion.fr/assets/kitesurf-hyeres.jpg",
      "https://www.kitesurfpassion.fr/assets/wingfoil-hyeres.jpg",
      "https://www.kitesurfpassion.fr/assets/pumpfoil-hyeres.jpg"
    ],
    photo: {
      "@type": "ImageObject",
      url: "https://www.kitesurfpassion.fr/og-image.jpg",
      width: 1200,
      height: 630
    },
    sameAs: [
      "https://www.facebook.com/kitesurfpassion",
      "https://www.instagram.com/kitesurfpassion",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Cours et stages de sports nautiques à Hyères",
      numberOfItems: 7,
      itemListElement: [
        {
          "@type": "Offer",
          name: "Stage Kitesurf 100% Glisse",
          description: "5 jours consécutifs pour devenir autonome en kitesurf à l'Almanarre",
          url: "https://www.kitesurfpassion.fr/stage-kitesurf-100-glisse-hyeres",
          image: "https://www.kitesurfpassion.fr/assets/kitesurf-hyeres.jpg",
          price: "399",
          priceCurrency: "EUR",
          priceValidUntil: priceValidUntil,
          availability: "https://schema.org/InStock",
          seller: sellerInfo,
          sku: "KSP-STAGE-100-GLISSE",
          itemOffered: {
            "@type": "Course",
            name: "Stage Kitesurf 100% Glisse",
            description: "Formation kitesurf intensive 5 jours avec bateau sécurité",
            image: "https://www.kitesurfpassion.fr/assets/kitesurf-hyeres.jpg",
            provider: sellerInfo,
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "onsite",
              duration: "P5D",
              instructor: {
                "@type": "Person",
                name: "Yoanne Cros",
                jobTitle: "Moniteur BPJEPS",
              },
            },
          },
        },
        {
          "@type": "Offer",
          name: "Session Kitesurf à la Carte",
          description: "Cours kitesurf flexibles selon vos disponibilités",
          url: "https://www.kitesurfpassion.fr/session-kitesurf-carte-hyeres",
          image: "https://www.kitesurfpassion.fr/assets/kitesurf-action-hyeres.jpg",
          price: "120",
          priceCurrency: "EUR",
          priceValidUntil: priceValidUntil,
          availability: "https://schema.org/InStock",
          seller: sellerInfo,
          sku: "KSP-SESSION-CARTE",
          itemOffered: {
            "@type": "Course",
            name: "Cours Kitesurf à la Carte",
            image: "https://www.kitesurfpassion.fr/assets/kitesurf-action-hyeres.jpg",
            provider: sellerInfo,
          },
        },
        {
          "@type": "Offer",
          name: "Cours Particulier Kitesurf",
          description: "Leçon privée 100% individualisée avec moniteur dédié",
          url: "https://www.kitesurfpassion.fr/cours-particulier-kitesurf-hyeres",
          image: "https://www.kitesurfpassion.fr/assets/kitesurf-cours-hyeres.jpg",
          price: "230",
          priceCurrency: "EUR",
          priceValidUntil: priceValidUntil,
          availability: "https://schema.org/InStock",
          seller: sellerInfo,
          sku: "KSP-COURS-PARTICULIER",
          itemOffered: {
            "@type": "Course",
            name: "Cours Particulier Kitesurf",
            image: "https://www.kitesurfpassion.fr/assets/kitesurf-cours-hyeres.jpg",
            provider: sellerInfo,
          },
        },
        {
          "@type": "Offer",
          name: "Stage Wingfoil Initiation",
          description: "Stage wingfoil 5 jours avec foil tracté inclus à l'Almanarre",
          url: "https://www.kitesurfpassion.fr/stage-wingfoil-hyeres-almanarre",
          image: "https://www.kitesurfpassion.fr/assets/wingfoil-hyeres.jpg",
          price: "440",
          priceCurrency: "EUR",
          priceValidUntil: priceValidUntil,
          availability: "https://schema.org/InStock",
          seller: sellerInfo,
          sku: "KSP-STAGE-WINGFOIL",
          itemOffered: {
            "@type": "Course",
            name: "Stage Wingfoil Initiation",
            image: "https://www.kitesurfpassion.fr/assets/wingfoil-hyeres.jpg",
            provider: sellerInfo,
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "onsite",
              duration: "P5D",
            },
          },
        },
        {
          "@type": "Offer",
          name: "Cours Pumpfoil & Dock Start",
          description: "Volez sur l'eau sans vent avec la technique dock start",
          url: "https://www.kitesurfpassion.fr/cours-pumpfoil-dock-start-hyeres",
          image: "https://www.kitesurfpassion.fr/assets/pumpfoil-hyeres.jpg",
          price: "50",
          priceCurrency: "EUR",
          priceValidUntil: priceValidUntil,
          availability: "https://schema.org/InStock",
          seller: sellerInfo,
          sku: "KSP-PUMPFOIL-DOCKSTART",
          itemOffered: {
            "@type": "Course",
            name: "Initiation Pumpfoil Dock Start",
            image: "https://www.kitesurfpassion.fr/assets/pumpfoil-hyeres.jpg",
            provider: sellerInfo,
          },
        },
        {
          "@type": "Offer",
          name: "Foil Tracté",
          description: "Découvrez le vol sur l'eau en toute sécurité tracté par bateau",
          url: "https://www.kitesurfpassion.fr/foil-tracte-hyeres",
          image: "https://www.kitesurfpassion.fr/assets/foil-tracte-hyeres.jpg",
          price: "50",
          priceCurrency: "EUR",
          priceValidUntil: priceValidUntil,
          availability: "https://schema.org/InStock",
          seller: sellerInfo,
          sku: "KSP-FOIL-TRACTE",
          itemOffered: {
            "@type": "Course",
            name: "Initiation Foil Tracté",
            image: "https://www.kitesurfpassion.fr/assets/foil-tracte-hyeres.jpg",
            provider: sellerInfo,
          },
        },
        {
          "@type": "Offer",
          name: "Wakeboard",
          description: "Session wakeboard tractée de 15 min sur la baie d'Hyères",
          url: "https://www.kitesurfpassion.fr/wakeboard-hyeres",
          image: "https://www.kitesurfpassion.fr/assets/wakeboard-hyeres.jpg",
          price: "40",
          priceCurrency: "EUR",
          priceValidUntil: priceValidUntil,
          availability: "https://schema.org/InStock",
          seller: sellerInfo,
          sku: "KSP-WAKEBOARD",
          itemOffered: {
            "@type": "Course",
            name: "Session Wakeboard",
            image: "https://www.kitesurfpassion.fr/assets/wakeboard-hyeres.jpg",
            provider: sellerInfo,
          },
        },
      ],
    },
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: "Bateau d'assistance",
        value: true
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Communication radio",
        value: true
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Matériel Duotone récent",
        value: true
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Petits groupes (4 max)",
        value: true
      }
    ]
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

  const imageGalleryStructuredData = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Galerie photos KiteSurf Passion Hyères",
    description: "Photos de cours de kitesurf, wingfoil et pumpfoil à Hyères sur le spot de l'Almanarre",
    image: [
      {
        "@type": "ImageObject",
        name: "Cours kitesurf Hyères Almanarre",
        description: "Session de kitesurf sur le spot de l'Almanarre à Hyères avec l'école KiteSurf Passion",
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
      },
      {
        "@type": "ImageObject",
        name: "Stage wingfoil Hyères Var",
        description: "Cours de wingfoil sur la plage de l'Almanarre à Hyères - école KiteSurf Passion",
        contentUrl: "https://www.kitesurfpassion.fr/assets/wingfoil-hyeres.jpg",
        thumbnailUrl: "https://www.kitesurfpassion.fr/assets/wingfoil-hyeres.jpg",
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
        },
      },
      {
        "@type": "ImageObject",
        name: "Pumpfoil dock start Hyères",
        description: "Initiation au pumpfoil avec dock start à Hyères - école KiteSurf Passion",
        contentUrl: "https://www.kitesurfpassion.fr/assets/pumpfoil-hyeres.jpg",
        thumbnailUrl: "https://www.kitesurfpassion.fr/assets/pumpfoil-hyeres.jpg",
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
          name: "Presqu'île de Giens, Hyères",
        },
      },
      {
        "@type": "ImageObject",
        name: "Bateau assistance kitesurf Hyères",
        description: "Bateau d'assistance pour les cours de kitesurf à Hyères - sécurité maximale",
        contentUrl: "https://www.kitesurfpassion.fr/assets/bateau-assistance-kitesurf.jpg",
        thumbnailUrl: "https://www.kitesurfpassion.fr/assets/bateau-assistance-kitesurf.jpg",
        creditText: "KiteSurf Passion",
        copyrightNotice: "© KiteSurf Passion",
        creator: {
          "@type": "Organization",
          name: "KiteSurf Passion",
          url: "https://www.kitesurfpassion.fr",
        },
        license: "https://www.kitesurfpassion.fr/mentions-legales",
        acquireLicensePage: "https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres",
      },
      {
        "@type": "ImageObject",
        name: "Coucher de soleil Almanarre Hyères",
        description: "Vue du spot de kitesurf de l'Almanarre au coucher du soleil à Hyères",
        contentUrl: "https://www.kitesurfpassion.fr/assets/almanarre-sunset.jpg",
        thumbnailUrl: "https://www.kitesurfpassion.fr/assets/almanarre-sunset.jpg",
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
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Kitesurf Passion – École de kitesurf, wingfoil, pumpfoil & foil tracté à Hyères</title>
        <meta
          name="description"
          content="Découvrez Kitesurf Passion à Hyères (Almanarre). Cours et stages de kitesurf, wingfoil, pumpfoil et foil tracté avec bateau sécurité, petits groupes, radios et Duotone récent. Réservez votre session dès maintenant."
        />
        <meta
          name="keywords"
          content="école kitesurf hyères, cours kitesurf almanarre, stage wingfoil var, pumpfoil hyères, foil tracté hyères, école kitesurf bateau assistance, kitesurf débutant hyères"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/" />
        <link rel="alternate" hrefLang="fr" href="https://www.kitesurfpassion.fr/" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Kitesurf Passion – École de kitesurf, wingfoil, pumpfoil & foil tracté à Hyères" />
        <meta property="og:description" content="Découvrez Kitesurf Passion à Hyères (Almanarre). Cours et stages de kitesurf, wingfoil, pumpfoil et foil tracté avec bateau sécurité, petits groupes et matériel Duotone récent." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="École Kitesurf Passion Hyères Almanarre - Cours kitesurf wingfoil pumpfoil foil tracté" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kitesurf Passion – École kitesurf, wingfoil, pumpfoil à Hyères" />
        <meta name="twitter:description" content="Cours et stages à l'Almanarre avec bateau sécurité, petits groupes et matériel Duotone récent. Réservez maintenant !" />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="École Kitesurf Passion Hyères Almanarre" />
        
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(reviewsStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(imageGalleryStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" }
          ]
        })}</script>
        
        {/* WebSite with SearchAction for sitelinks search box */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://www.kitesurfpassion.fr/#website",
          "name": "KiteSurf Passion",
          "alternateName": "École Kitesurf Hyères",
          "url": "https://www.kitesurfpassion.fr",
          "description": "École de kitesurf, wingfoil et pumpfoil à Hyères depuis 1999. Cours avec bateau d'assistance sur le spot de l'Almanarre.",
          "inLanguage": "fr-FR",
          "publisher": {
            "@id": "https://www.kitesurfpassion.fr/#organization"
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://www.kitesurfpassion.fr/blog-kitesurf-hyeres?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        })}</script>
      </Helmet>

      <Header />
      
      <main>
        {/* Above-fold content - No content-visibility delay */}
        <HeroSection />
        <WhyUsSection />
        
        {/* Below-fold content - Optimized with content-visibility */}
        <ActivitiesSection />
        <div 
          className="content-visibility-gallery contain-layout"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}
        >
          <GallerySection />
        </div>
        <div 
          className="content-visibility-testimonials contain-layout"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
        >
          <TestimonialsSection />
        </div>
        <div 
          className="content-visibility-faq contain-layout"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 700px' }}
        >
          <FAQSection />
        </div>
        <MeetingPointsSection />
        <CTASection />
      </main>

      <Footer />
    </>
  );
};

export default Index;
