import { renderRichMarkdown } from "@/lib/sanitize-html";
import { Tag } from "lucide-react";
import type { BlogArticle } from "@/features/blog";
import type { ArticleContent } from "../types";
import { getArticleImage } from "../images";

interface Props {
  article: BlogArticle;
  content: ArticleContent;
}

export const BlogArticleContent = ({ article, content }: Props) => (
  <>
    {/* Article Image */}
    <div className="max-w-4xl mx-auto mb-12">
      <img
        src={getArticleImage(article.image)}
        alt={article.alt || `${article.title} - École KiteSurf Passion Hyères Almanarre`}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="w-full rounded-2xl"
      />
    </div>

    {/* Article Content */}
    <div className="max-w-3xl mx-auto prose prose-lg prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary prose-strong:text-foreground prose-table:border-collapse prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted prose-td:border prose-td:border-border prose-td:p-2">
      <div dangerouslySetInnerHTML={{ __html: renderRichMarkdown(content.content) }} />
    </div>
  </>
);

export const BlogArticleTags = ({ tags }: { tags: string[] }) => (
  <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-border">
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground"
        >
          <Tag className="w-3 h-3" />
          {tag}
        </span>
      ))}
    </div>
  </div>
);
