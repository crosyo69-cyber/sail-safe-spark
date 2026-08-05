import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (updater: (page: number) => number) => void;
};

export const BlogPagination = ({ currentPage, totalPages, onPageChange }: Props) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPageChange((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-full border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Page précédente"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(() => page)}
          className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
            page === currentPage
              ? "bg-primary text-primary-foreground"
              : "border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Page suivante"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
