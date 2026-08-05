import { Helmet } from "react-helmet-async";
import { blogBreadcrumbJsonLd, buildBlogStructuredData } from "@/features/blog";

export const BlogSeoHead = () => (
  <Helmet>
    <title>Blog Kitesurf Hyères | Conseils &amp; Guides</title>
    <meta
      name="description"
      content="Conseils d'experts, guides pratiques et actualités sur le kitesurf, wingfoil et sports de glisse à Hyères. Apprenez avec KiteSurf Passion depuis 1999."
    />
    <meta
      name="keywords"
      content="blog kitesurf hyères, conseils wingfoil, guide débutant kitesurf, conditions almanarre, météo kitesurf var"
    />
    <link rel="canonical" href="https://www.kitesurfpassion.fr/blog-kitesurf-hyeres" />
    <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/blog-kitesurf-hyeres" />
    <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/blog-kitesurf-hyeres" />

    {/* Open Graph */}
    <meta property="og:title" content="Blog Kitesurf Hyères | Conseils & Guides d'Experts – Kitesurf Passion" />
    <meta property="og:description" content="25 ans d'expérience partagée : conseils pour débuter, guides des spots, conditions météo et actualités kitesurf à Hyères." />
    <meta property="og:type" content="blog" />
    <meta property="og:url" content="https://www.kitesurfpassion.fr/blog-kitesurf-hyeres" />
    <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Blog kitesurf wingfoil - Conseils et guides pratiques Hyères" />
    <meta property="og:site_name" content="KiteSurf Passion" />
    <meta property="og:locale" content="fr_FR" />

    {/* Twitter */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Blog Kitesurf Hyères | Conseils d'Experts" />
    <meta name="twitter:description" content="Guides pratiques et conseils pour progresser en kitesurf et wingfoil à Hyères." />
    <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
    <meta name="twitter:image:alt" content="Blog kitesurf wingfoil Hyères" />

    <script type="application/ld+json">{JSON.stringify(buildBlogStructuredData())}</script>
    <script type="application/ld+json">{JSON.stringify(blogBreadcrumbJsonLd)}</script>
  </Helmet>
);
