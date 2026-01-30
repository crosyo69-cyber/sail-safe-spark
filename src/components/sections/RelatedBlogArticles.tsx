import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
}

interface RelatedBlogArticlesProps {
  title?: string;
  subtitle?: string;
  articles: BlogArticle[];
  accentColor?: "primary" | "ocean" | "sunset";
}

export const RelatedBlogArticles = ({
  title = "Articles du Blog",
  subtitle = "Approfondir vos connaissances",
  articles,
  accentColor = "primary",
}: RelatedBlogArticlesProps) => {
  const accentClasses = {
    primary: {
      icon: "text-primary",
      iconBg: "bg-primary/10",
      hover: "hover:border-primary/50 group-hover:text-primary",
      link: "text-primary",
    },
    ocean: {
      icon: "text-ocean",
      iconBg: "bg-ocean/10",
      hover: "hover:border-ocean/50 group-hover:text-ocean",
      link: "text-ocean",
    },
    sunset: {
      icon: "text-sunset",
      iconBg: "bg-sunset/10",
      hover: "hover:border-sunset/50 group-hover:text-sunset",
      link: "text-sunset",
    },
  };

  const colors = accentClasses[accentColor];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className={`inline-flex items-center gap-2 ${colors.iconBg} ${colors.icon} px-4 py-2 rounded-full text-sm font-medium mb-4`}>
            <BookOpen className="w-4 h-4" />
            Blog
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
            {title}
          </h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {articles.map((article) => (
            <Link
              key={article.slug}
              to={`/blog/${article.slug}`}
              className={`bg-card border border-border rounded-2xl p-6 transition-all duration-300 group ${colors.hover} hover:shadow-lg hover:-translate-y-1`}
            >
              <h3 className={`font-bold text-foreground mb-3 line-clamp-2 transition-colors ${colors.hover}`}>
                {article.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                {article.excerpt}
              </p>
              <span className={`inline-flex items-center gap-1 text-sm font-medium ${colors.link}`}>
                Lire l'article
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
