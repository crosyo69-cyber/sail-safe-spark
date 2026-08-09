import type { BlogArticle } from "@/features/blog";
import type { FAQItem } from "@/features/blog-article/types";

/** JSON-LD spécifiques à certains articles — structure inchangée. */
export const customArticleStructuredData: Record<string, object> = {
  "week-end-kitesurf-hyeres-guide-complet": {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.kitesurfpassion.fr/blog/week-end-kitesurf-hyeres-guide-complet#article",
        mainEntityOfPage: "https://www.kitesurfpassion.fr/blog/week-end-kitesurf-hyeres-guide-complet",
        headline: "Week-end kitesurf à Hyères : le guide complet pour un séjour réussi",
        description: "Tout pour organiser votre week-end kitesurf à Hyères : le spot de l'Almanarre, les conditions de vent, les cours avec KiteSurf Passion et les bons plans du Var.",
        inLanguage: "fr-FR",
        url: "https://www.kitesurfpassion.fr/blog/week-end-kitesurf-hyeres-guide-complet",
        datePublished: "2026-06-03T09:00:00+02:00",
        dateModified: "2026-06-03T09:00:00+02:00",
        author: {
          "@type": "Person",
          name: "Yoanne Cros",
          jobTitle: "Moniteur Diplômé d'État",
          url: "https://www.kitesurfpassion.fr/ecole-kitesurf-hyeres-almanarre",
        },
        publisher: {
          "@type": "Organization",
          name: "Kitesurf Passion",
          url: "https://www.kitesurfpassion.fr/",
        },
        articleSection: "Le Spot",
        keywords: [
          "week-end kitesurf Hyères",
          "séjour kitesurf Almanarre",
          "kitesurf Hyères week-end",
          "wingfoil Hyères week-end",
          "stage kitesurf 2 jours Hyères",
          "presqu'île de Giens kitesurf",
          "spot Almanarre",
          "vent Hyères kitesurf",
          "cours kitesurf Hyères",
          "école kitesurf Hyères",
        ],
        about: [
          "Kitesurf",
          "Wingfoil",
          "Hyères",
          "Almanarre",
          "Presqu'île de Giens",
        ],
      },
    ],
  },
  "pumpfoil-vs-wingfoil-lequel-choisir-hyeres": {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.kitesurfpassion.fr/blog/pumpfoil-vs-wingfoil-lequel-choisir-hyeres#article",
        mainEntityOfPage: "https://www.kitesurfpassion.fr/blog/pumpfoil-vs-wingfoil-lequel-choisir-hyeres",
        headline: "Pumpfoil vs Wingfoil : Lequel Choisir pour Débuter à Hyères ?",
        description: "Guide comparatif complet entre pumpfoil et wingfoil à l'Almanarre. Avantages, inconvénients, tarifs et conseils d'un moniteur diplômé d'État.",
        inLanguage: "fr-FR",
        url: "https://www.kitesurfpassion.fr/blog/pumpfoil-vs-wingfoil-lequel-choisir-hyeres",
        author: {
          "@type": "Organization",
          name: "Kitesurf Passion",
          url: "https://www.kitesurfpassion.fr/",
        },
        publisher: {
          "@type": "Organization",
          name: "Kitesurf Passion",
          url: "https://www.kitesurfpassion.fr/",
        },
        articleSection: "Wing Foil",
        keywords: [
          "pumpfoil vs wingfoil",
          "wingfoil débutant Hyères",
          "pumpfoil Hyères",
          "stage wingfoil Almanarre",
          "cours pumpfoil dock start",
          "foil débutant Var",
          "wingfoil sans vent",
          "pumpfoil prix",
          "wingfoil prix Hyères",
          "Almanarre wingfoil",
        ],
        about: [
          "Wingfoil",
          "Pumpfoil",
          "Hyères",
          "Almanarre",
        ],
      },
    ],
  },
  "apprendre-kitesurf-40-50-60-ans": {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.kitesurfpassion.fr/blog/apprendre-kitesurf-40-50-60-ans#article",
        mainEntityOfPage: "https://www.kitesurfpassion.fr/blog/apprendre-kitesurf-40-50-60-ans",
        headline: "Apprendre le kitesurf à 40, 50 ou 60 ans à Hyères",
        description: "Oui, il est possible d'apprendre le kitesurf à 40, 50 ou 60 ans à Hyères. Découvrez pourquoi l'Almanarre est un spot idéal, quelle formule choisir et comment progresser en confiance.",
        inLanguage: "fr-FR",
        url: "https://www.kitesurfpassion.fr/blog/apprendre-kitesurf-40-50-60-ans",
        author: {
          "@type": "Organization",
          name: "Kitesurf Passion",
          url: "https://www.kitesurfpassion.fr/",
        },
        publisher: {
          "@type": "Organization",
          name: "Kitesurf Passion",
          url: "https://www.kitesurfpassion.fr/",
        },
        articleSection: "Kitesurf",
        keywords: [
          "apprendre le kitesurf adulte Hyères",
          "apprendre le kitesurf à 40 ans",
          "apprendre le kitesurf à 50 ans",
          "apprendre le kitesurf à 60 ans",
          "débuter le kitesurf adulte",
          "stage kitesurf adulte Hyères",
          "kitesurf senior débutant",
          "spot Almanarre débutant",
          "cours kitesurf adulte Hyères",
          "stage 5 jours kitesurf Hyères",
        ],
        about: [
          "Kitesurf adulte débutant",
          "Hyères",
          "Almanarre",
        ],
      },
    ],
  },
  "regles-securite-kitesurf-wingfoil": {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.kitesurfpassion.fr/blog/regles-securite-kitesurf-wingfoil#article",
        mainEntityOfPage: "https://www.kitesurfpassion.fr/blog/regles-securite-kitesurf-wingfoil",
        headline: "Règles de Sécurité Kitesurf et Wingfoil à Hyères : Le Guide Complet",
        description: "Règles de sécurité kitesurf et wingfoil à Hyères : matériel, largage rapide, priorités, distances. Le guide complet par l'école Kitesurf Passion.",
        inLanguage: "fr-FR",
        url: "https://www.kitesurfpassion.fr/blog/regles-securite-kitesurf-wingfoil",
        image: "https://www.kitesurfpassion.fr/og-image.jpg",
        datePublished: "2025-01-08T09:00:00+01:00",
        dateModified: "2026-06-18T09:00:00+02:00",
        author: {
          "@type": "Person",
          name: "Yoanne Cros",
          jobTitle: "Moniteur Diplômé d'État",
          url: "https://www.kitesurfpassion.fr/ecole-kitesurf-hyeres-almanarre",
        },
        publisher: {
          "@type": "Organization",
          name: "Kitesurf Passion",
          url: "https://www.kitesurfpassion.fr/",
        },
        articleSection: "Sécurité",
        keywords: [
          "règles de sécurité kitesurf",
          "sécurité kitesurf Hyères",
          "sécurité wingfoil Hyères",
          "quick release kitesurf",
          "largage rapide kitesurf",
          "priorités kitesurf navigation",
          "leash sécurité kitesurf",
          "distances de sécurité kitesurf",
          "kitesurf Almanarre sécurité",
          "école kitesurf Hyères",
        ],
        about: [
          "Sécurité kitesurf",
          "Sécurité wingfoil",
          "Hyères",
          "Almanarre",
        ],
      },
    ],
  },
  "efoil-hyeres-voler-sur-eau-sans-vent": {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.kitesurfpassion.fr/blog/efoil-hyeres-voler-sur-eau-sans-vent#article",
        mainEntityOfPage: "https://www.kitesurfpassion.fr/blog/efoil-hyeres-voler-sur-eau-sans-vent",
        headline: "E-Foil à Hyères : volez au-dessus de l'eau même sans vent",
        description: "Découvrez l'e-foil à Hyères sur la Presqu'île de Giens : sensations de vol au-dessus de l'eau, accessible à tous, même les jours sans vent. KiteSurf Passion depuis 1999.",
        inLanguage: "fr-FR",
        url: "https://www.kitesurfpassion.fr/blog/efoil-hyeres-voler-sur-eau-sans-vent",
        image: "https://www.kitesurfpassion.fr/__l5e/assets-v1/688a69a7-dcbc-4ff9-95a3-471e884ce2ee/efoil-duotone-midfish-hyeres-hero.jpg",
        datePublished: "2026-07-07T09:00:00+02:00",
        dateModified: "2026-07-07T09:00:00+02:00",
        author: {
          "@type": "Person",
          name: "Yoanne Cros",
          jobTitle: "Moniteur Diplômé d'État",
          url: "https://www.kitesurfpassion.fr/ecole-kitesurf-hyeres-almanarre",
        },
        publisher: {
          "@type": "Organization",
          name: "Kitesurf Passion",
          url: "https://www.kitesurfpassion.fr/",
        },
        articleSection: "Location",
        keywords: [
          "e-foil Hyères",
          "efoil Hyères",
          "e-foil Almanarre",
          "foil électrique Hyères",
          "voler sans vent Hyères",
          "e-foil presqu'île de Giens",
          "session e-foil Var",
          "location e-foil Hyères",
          "initiation e-foil",
          "e-foil sunset Hyères",
        ],
        about: [
          "E-Foil",
          "Foil électrique",
          "Hyères",
          "Almanarre",
          "Presqu'île de Giens",
        ],
      },
      // FAQPage volontairement absent du @graph : il est émis comme bloc
      // JSON-LD standalone depuis articleFAQData (évite le doublon FAQPage).
    ],
  },
};
/** Détecte un FAQPage déjà présent (y compris dans un @graph). */
export const structuredDataContainsFAQPage = (data: object | null): boolean => {
  if (!data) return false;
  const nodes: Record<string, unknown>[] = [];
  const walk = (node: unknown) => {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(walk);
    const record = node as Record<string, unknown>;
    nodes.push(record);
    if (record["@graph"]) walk(record["@graph"]);
  };
  walk(data);
  return nodes.some((n) => n?.["@type"] === "FAQPage");
};

/** FAQPage standalone (null si un FAQPage existe déjà dans le JSON-LD custom). */
export const buildFaqStructuredData = (
  faqData: FAQItem[] | null | undefined,
  slug: string | undefined,
) =>
  faqData && !structuredDataContainsFAQPage(slug && customArticleStructuredData[slug] ? customArticleStructuredData[slug] : null)
    ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqData.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer,
        },
      })),
    }
    : null;

/** Article / BlogPosting JSON-LD — custom si défini, sinon BlogPosting générique. */
export const buildArticleStructuredData = (
  article: BlogArticle,
  slug: string | undefined,
  content: { content: string; tags: string[] },
): object =>
  slug && customArticleStructuredData[slug]
    ? customArticleStructuredData[slug]
    : {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    image: `https://www.kitesurfpassion.fr/src/assets/${article.image}`,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      "@type": "Person",
      name: "Yoanne Cros",
      jobTitle: "Moniteur Diplômé d'État",
      url: "https://www.kitesurfpassion.fr/ecole-kitesurf-hyeres-almanarre",
    },
    publisher: {
      "@type": "Organization",
      name: "KiteSurf Passion",
      url: "https://www.kitesurfpassion.fr",
      telephone: "+33672716905",
      address: {
        "@type": "PostalAddress",
        streetAddress: "52 Avenue Général de Gaulle",
        addressLocality: "Carqueiranne",
        postalCode: "83320",
        addressRegion: "Var",
        addressCountry: "FR",
      },
      logo: {
        "@type": "ImageObject",
        url: "https://www.kitesurfpassion.fr/og-image.jpg",
        width: 1200,
        height: 630,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.kitesurfpassion.fr/blog/${slug}`,
    },
    keywords: content.tags.join(", "),
    articleSection: article.category,
    wordCount: content.content.split(/\s+/).length,
    inLanguage: "fr-FR",
  };

/** BreadcrumbList JSON-LD de l'article. */
export const buildArticleBreadcrumbJsonLd = (article: BlogArticle, slug: string | undefined) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
    { "@type": "ListItem", "position": 2, "name": "Blog & Actualités", "item": "https://www.kitesurfpassion.fr/blog-kitesurf-hyeres" },
    { "@type": "ListItem", "position": 3, "name": article.title, "item": `https://www.kitesurfpassion.fr/blog/${slug}` }
  ]
});
