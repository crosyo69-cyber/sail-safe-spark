import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const ArticleSkeletonGrid = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border/50">
        <Skeleton className="aspect-video w-full" />
        <div className="p-5 space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

type EmptyProps = {
  searchQuery: string;
  selectedCategory: string;
  onReset: () => void;
};

export const ArticleEmptyState = ({ searchQuery, selectedCategory, onReset }: EmptyProps) => (
  <div className="text-center py-16 bg-muted/30 rounded-2xl">
    <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-foreground mb-2">Aucun article trouvé</h3>
    <p className="text-muted-foreground mb-6">
      {searchQuery
        ? `Aucun résultat pour "${searchQuery}"${selectedCategory !== "Tous" ? ` dans la catégorie ${selectedCategory}` : ""}.`
        : `Aucun article dans la catégorie ${selectedCategory} pour le moment.`}
    </p>
    <Button variant="outline" onClick={onReset}>
      Voir tous les articles
    </Button>
  </div>
);
