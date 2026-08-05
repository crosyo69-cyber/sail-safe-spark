import { Link } from "react-router-dom";
import { ShareButtons } from "@/components/ShareButtons";
import { getArticleImage, type BlogArticle } from "@/features/blog";

export const ArticleCard = ({ article }: { article: BlogArticle }) => (
  <div className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-md relative">
    <Link to={`/blog/${article.slug}`}>
      <div className="aspect-video overflow-hidden relative">
        <img
          src={getArticleImage(article.image)}
          alt={article.alt || article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ShareButtons
            url={`https://www.kitesurfpassion.fr/blog/${article.slug}`}
            title={article.title}
          />
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {article.category}
          </span>
          <span>{article.readTime}</span>
        </div>
        <h3 className="font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2">{article.excerpt}</p>
      </div>
    </Link>
  </div>
);
