import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { getArticleImage, type BlogArticle } from "@/features/blog";

export const FeaturedArticleCard = ({ article }: { article: BlogArticle }) => (
  <Link
    to={`/blog/${article.slug}`}
    className="group bg-card rounded-3xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg"
  >
    <div className="aspect-video overflow-hidden">
      <img
        src={getArticleImage(article.image)}
        alt={article.alt || article.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        decoding="async"
      />
    </div>
    <div className="p-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
          {article.category}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {new Date(article.date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {article.readTime}
        </span>
      </div>
      <h3 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
        {article.title}
      </h3>
      <p className="text-muted-foreground line-clamp-2 mb-4">{article.excerpt}</p>
      <span className="inline-flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
        Lire l'article
        <ArrowRight className="w-4 h-4" />
      </span>
    </div>
  </Link>
);
