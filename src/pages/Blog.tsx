import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { NewsletterForm } from "@/components/NewsletterForm";
import { BlogSeoHead } from "@/components/blog/BlogSeoHead";
import { BlogHero } from "@/components/blog/BlogHero";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { FeaturedArticleCard } from "@/components/blog/FeaturedArticleCard";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { ArticleEmptyState, ArticleSkeletonGrid } from "@/components/blog/BlogListStates";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { BlogCtaSection } from "@/components/blog/BlogCtaSection";
import { blogBreadcrumbItems } from "@/features/blog";
import { useBlogList } from "@/hooks/client/useBlogList";

const Blog = () => {
  const blog = useBlogList();

  return (
    <>
      <BlogSeoHead />

      <Header />
      <PageBreadcrumb items={blogBreadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        <BlogHero />

        <BlogFilters
          searchQuery={blog.searchQuery}
          onSearch={blog.search}
          onClearSearch={blog.clearSearch}
          selectedCategory={blog.selectedCategory}
          onSelectCategory={blog.selectCategory}
          getCategoryCount={blog.getCategoryCount}
          resultCount={blog.filteredArticles.length}
        />

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            {blog.featuredArticles.length > 0 && (
              <>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-10">
                  Articles à la Une
                </h2>
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                  {blog.featuredArticles.map((article) => (
                    <FeaturedArticleCard key={article.slug} article={article} />
                  ))}
                </div>
              </>
            )}

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-10">
              {blog.selectedCategory === "Tous"
                ? "Tous les Articles"
                : `Articles ${blog.selectedCategory}`}
            </h2>

            {blog.isLoading ? (
              <ArticleSkeletonGrid />
            ) : blog.filteredArticles.length === 0 ? (
              <ArticleEmptyState
                searchQuery={blog.searchQuery}
                selectedCategory={blog.selectedCategory}
                onReset={blog.resetFilters}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {blog.paginatedArticles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            )}

            <BlogPagination
              currentPage={blog.currentPage}
              totalPages={blog.totalPages}
              onPageChange={blog.setCurrentPage}
            />
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <NewsletterForm />
          </div>
        </section>

        <BlogCtaSection />
      </main>

      <Footer />
    </>
  );
};

export default Blog;
