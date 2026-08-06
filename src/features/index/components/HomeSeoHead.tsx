import { Helmet } from "react-helmet-async";
import {
  homeStructuredData,
  homeFaqStructuredData,
  homeImageGalleryStructuredData,
  homeBreadcrumbJsonLd,
  homeWebsiteJsonLd,
  homeNavigationJsonLd,
  homeItemListJsonLd,
  homeOrganizationJsonLd,
} from "../seo";

/** Head tags for the homepage. Output is byte-identical to the legacy page. */
export function HomeSeoHead() {
  return (
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
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/" />
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
      <script type="application/ld+json">{JSON.stringify(homeStructuredData)}</script>
      <script type="application/ld+json">{JSON.stringify(homeFaqStructuredData)}</script>
      {/* Note: reviewsStructuredData removed to avoid "multiple aggregate ratings" GSC error - ratings are centralized in structuredData */}
      <script type="application/ld+json">{JSON.stringify(homeImageGalleryStructuredData)}</script>
      <script type="application/ld+json">{JSON.stringify(homeBreadcrumbJsonLd)}</script>

      {/* WebSite with SearchAction for sitelinks search box */}
      <script type="application/ld+json">{JSON.stringify(homeWebsiteJsonLd)}</script>

      {/* SiteNavigationElement for sitelinks */}
      <script type="application/ld+json">{JSON.stringify(homeNavigationJsonLd)}</script>

      {/* ItemList for key pages - helps Google understand site structure */}
      <script type="application/ld+json">{JSON.stringify(homeItemListJsonLd)}</script>

      {/* Organization schema with logo for Knowledge Panel */}
      <script type="application/ld+json">{JSON.stringify(homeOrganizationJsonLd)}</script>
    </Helmet>
  );
}
