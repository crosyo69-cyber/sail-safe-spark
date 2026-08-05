/** Domain constants & pure helpers for the blog category filter. */
export const BLOG_CATEGORIES = [
  "Tous",
  "Kitesurf",
  "Wing Foil",
  "Pump Foil",
  "Wakeboard",
  "Le Spot",
  "Sécurité",
];

/** Map URL-friendly slugs to display names. */
export const categorySlugMap: Record<string, string> = {
  "kitesurf": "Kitesurf",
  "wingfoil": "Wing Foil",
  "pumpfoil": "Pump Foil",
  "wakeboard": "Wakeboard",
  "le-spot": "Le Spot",
  "securite": "Sécurité",
};

export const getCategorySlug = (category: string): string =>
  category.toLowerCase().replace(/ /g, "").replace("é", "e");

export const ARTICLES_PER_PAGE = 6;

export const blogBreadcrumbItems = [{ label: "Blog & Actualités" }];
