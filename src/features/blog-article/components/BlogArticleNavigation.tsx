import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogArticle } from "@/features/blog";

export const BlogArticleNavigation = ({ relatedArticles }: { relatedArticles: BlogArticle[] }) => (
  <>
    {/* Related Articles */}
    {relatedArticles.length > 0 && (
      <div className="max-w-4xl mx-auto mt-16">
        <h3 className="font-display text-2xl font-bold text-foreground mb-8">
          Articles Similaires
        </h3>
        <div className="grid sm:grid-cols-2 gap-6">
          {relatedArticles.map((related) => (
            <Link
              key={related.slug}
              to={`/blog/${related.slug}`}
              className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={`/src/assets/${related.image}`}
                  alt={`${related.title} - Blog kitesurf Hyères Almanarre école KiteSurf Passion Var`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <h4 className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
                  {related.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )}

    {/* Back to Blog */}
    <div className="max-w-3xl mx-auto mt-12 text-center">
      <Button variant="ghost" asChild>
        <Link to="/blog-kitesurf-hyeres">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au Blog
        </Link>
      </Button>
    </div>
  </>
);
