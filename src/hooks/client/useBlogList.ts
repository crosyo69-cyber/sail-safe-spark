import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ARTICLES_PER_PAGE,
  blogArticles,
  categorySlugMap,
  getCategorySlug,
  type BlogArticle,
} from "@/features/blog";

/** Presentation logic of the blog listing: search, category filter, pagination. */
export const useBlogList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const categoryParam = searchParams.get("categorie");
  const selectedCategory = categoryParam ? categorySlugMap[categoryParam] || "Tous" : "Tous";

  const selectCategory = (category: string) => {
    setCurrentPage(1);
    setSearchQuery("");
    setIsLoading(true);
    if (category === "Tous") setSearchParams({});
    else setSearchParams({ categorie: getCategorySlug(category) });
  };

  const search = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    setIsLoading(true);
  };

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, selectedCategory, searchQuery]);

  const filteredArticles: BlogArticle[] = blogArticles.filter((article) => {
    const matchesCategory = selectedCategory === "Tous" || article.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      searchLower === "" ||
      article.title.toLowerCase().includes(searchLower) ||
      article.excerpt.toLowerCase().includes(searchLower) ||
      article.category.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = filteredArticles.filter((article) => article.featured);
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE,
  );

  const getCategoryCount = (category: string): number =>
    category === "Tous"
      ? blogArticles.length
      : blogArticles.filter((article) => article.category === category).length;

  const resetFilters = () => {
    setSearchQuery("");
    selectCategory("Tous");
  };

  return {
    searchQuery,
    search,
    clearSearch: () => setSearchQuery(""),
    isLoading,
    selectedCategory,
    selectCategory,
    filteredArticles,
    featuredArticles,
    paginatedArticles,
    currentPage,
    setCurrentPage,
    totalPages,
    getCategoryCount,
    resetFilters,
  };
};
