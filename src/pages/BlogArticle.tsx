import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { BlogComments } from "@/components/BlogComments";
import { blogArticles } from "@/features/blog";
import {
  articleContent,
  articleFAQData,
  buildArticleStructuredData,
  buildFaqStructuredData,
} from "@/features/blog-article";
import {
  BlogArticleCta,
  BlogArticleContent,
  BlogArticleFaq,
  BlogArticleHeader,
  BlogArticleNavigation,
  BlogArticleSeo,
  BlogArticleTags,
} from "@/features/blog-article/components";

import NotFound from "./NotFound";

// Ré-export conservé pour compatibilité (FAQ structured data des articles).
export { articleFAQData } from "@/data/blog-faq";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();

  const article = blogArticles.find((a) => a.slug === slug);
  const content = slug ? articleContent[slug] : null;

  if (!article || !content) {
    // Return proper 404 page instead of redirect to avoid Soft 404 in Google Search Console
    return <NotFound />;
  }

  const breadcrumbItems = [
    { label: "Blog", href: "/blog-kitesurf-hyeres" },
    { label: article.title }
  ];

  const faqData = slug ? articleFAQData[slug] : null;
  const faqStructuredData = buildFaqStructuredData(faqData, slug);
  const structuredData = buildArticleStructuredData(article, slug, content);

  // Find related articles
  const relatedArticles = blogArticles
    .filter((a) => a.slug !== slug && a.category === article.category)
    .slice(0, 2);

  return (
    <>
      <BlogArticleSeo
        article={article}
        slug={slug}
        structuredData={structuredData}
        faqStructuredData={faqStructuredData}
      />

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4">
          <BlogArticleHeader article={article} slug={slug} />
          <BlogArticleContent article={article} content={content} />
          {faqData && <BlogArticleFaq faqData={faqData} />}
          <BlogArticleTags tags={content.tags} />
          <BlogArticleCta slug={slug} />

          {/* Comments Section */}
          <div className="max-w-3xl mx-auto mt-12">
            <BlogComments articleSlug={slug || ""} />
          </div>

          <BlogArticleNavigation relatedArticles={relatedArticles} />
        </article>
      </main>

      <Footer />
    </>
  );
};

export default BlogArticle;
