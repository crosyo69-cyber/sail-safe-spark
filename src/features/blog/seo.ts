import { blogArticles } from "./articles";

/** JSON-LD Blog graph — must stay byte-identical to the legacy output. */
export const buildBlogStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Blog KiteSurf Passion",
  description:
    "Actualités, conseils et guides sur le kitesurf, wingfoil et sports de glisse à Hyères",
  url: "https://www.kitesurfpassion.fr/blog-kitesurf-hyeres",
  publisher: {
    "@type": "Organization",
    name: "KiteSurf Passion",
    logo: {
      "@type": "ImageObject",
      url: "https://www.kitesurfpassion.fr/logo.png",
      creditText: "KiteSurf Passion",
      copyrightNotice: "© KiteSurf Passion",
      creator: {
        "@type": "Organization",
        name: "KiteSurf Passion",
        url: "https://www.kitesurfpassion.fr",
      },
      license: "https://www.kitesurfpassion.fr/mentions-legales",
      acquireLicensePage:
        "https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres",
    },
  },
  blogPost: blogArticles.map((article) => ({
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    datePublished: `${article.date}T08:00:00+01:00`,
    dateModified: `${article.date}T08:00:00+01:00`,
    url: `https://www.kitesurfpassion.fr/blog/${article.slug}`,
    image: `https://www.kitesurfpassion.fr/images/${article.image}`,
    author: {
      "@type": "Person",
      name: "Yoanne Cros",
      url: "https://www.kitesurfpassion.fr/a-propos-ecole-kitesurf-hyeres",
    },
  })),
});

export const blogBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
    { "@type": "ListItem", "position": 2, "name": "Blog & Actualités", "item": "https://www.kitesurfpassion.fr/blog-kitesurf-hyeres" },
  ],
};
