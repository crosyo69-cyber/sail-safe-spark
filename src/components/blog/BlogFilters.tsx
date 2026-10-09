import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BLOG_CATEGORIES } from "@/features/blog";

type Props = {
  searchQuery: string;
  onSearch: (value: string) => void;
  onClearSearch: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  getCategoryCount: (category: string) => number;
  resultCount: number;
};

export const BlogFilters = ({
  searchQuery,
  onSearch,
  onClearSearch,
  selectedCategory,
  onSelectCategory,
  getCategoryCount,
  resultCount,
}: Props) => (
  <section className="py-8 bg-muted/30 border-b border-border/50">
    <div className="container mx-auto px-4">
      <div className="max-w-md mx-auto mb-6">
        <div className="relative">
          <label htmlFor="blog-search-input" className="sr-only">
            Rechercher un article du blog
          </label>
          <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="blog-search-input"
            name="blogSearch"
            type="search"
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 pr-10 py-2 rounded-full border-border/50 focus:border-primary"
            maxLength={100}
          />
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {BLOG_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              category === selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/50"
            }`}
          >
            {category}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                category === selectedCategory ? "bg-primary-foreground/20" : "bg-muted text-foreground"
              }`}
            >
              {getCategoryCount(category)}
            </span>
          </button>
        ))}
      </div>

      {searchQuery && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          {resultCount} résultat{resultCount !== 1 ? "s" : ""} pour "{searchQuery}"
        </p>
      )}
    </div>
  </section>
);
