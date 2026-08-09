import { Helmet } from "react-helmet-async";
import type { BlogArticle } from "@/features/blog";
import { getArticleOgImage } from "../images";
import { buildArticleBreadcrumbJsonLd } from "../seo";

interface Props {
  article: BlogArticle;
  slug: string | undefined;
  structuredData: object;
  faqStructuredData: object | null;
}

export const BlogArticleSeo = ({ article, slug, structuredData, faqStructuredData }: Props) => (
  <Helmet>
    <title>{article.title} | Blog KiteSurf Passion</title>
    <meta name="description" content={article.excerpt} />
    <link rel="canonical" href={`https://www.kitesurfpassion.fr/blog/${slug}`} />
    <link rel="alternate" hrefLang="fr-FR" href={`https://www.kitesurfpassion.fr/blog/${slug}`} />
    <link rel="alternate" hrefLang="x-default" href={`https://www.kitesurfpassion.fr/blog/${slug}`} />
    <meta property="og:title" content={`${article.title} | Blog KiteSurf Passion`} />
    <meta property="og:description" content={article.excerpt} />
    <meta property="og:type" content="article" />
    <meta property="og:url" content={`https://www.kitesurfpassion.fr/blog/${slug}`} />
    <meta property="og:image" content={getArticleOgImage(article.image)} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content={article.alt || article.title} />
    <meta property="og:site_name" content="KiteSurf Passion" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="article:published_time" content={`${article.date}T08:00:00+01:00`} />
    <meta property="article:author" content="Yoanne Cros" />

    {/* Twitter */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={`${article.title} | KiteSurf Passion`} />
    <meta name="twitter:description" content={article.excerpt} />
    <meta name="twitter:image" content={getArticleOgImage(article.image)} />
    <meta name="twitter:image:alt" content={article.alt || article.title} />
    <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    <script type="application/ld+json">{JSON.stringify(buildArticleBreadcrumbJsonLd(article, slug))}</script>
    {/* FAQPage emitted as its own JSON-LD block (separate from Article/@graph)
        so Google Rich Results Test detects it as a standalone FAQPage entity. */}
    {faqStructuredData && (
      <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
    )}
  </Helmet>
);
