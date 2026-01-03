import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Clock, ArrowRight, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareButtons } from "@/components/ShareButtons";
import heroImage from "@/assets/blog-hero.jpg";
import blogCtaImage from "@/assets/blog-kitesurf-sunset-cta.jpg";
import blogKitesurfDebut from "@/assets/blog-kitesurf-debut.jpg";
import blogWingfoil from "@/assets/blog-wingfoil.jpg";
import blogKitesurfAction from "@/assets/blog-kitesurf-action.jpg";
import blogBateauGroupe from "@/assets/blog-bateau-groupe.jpg";
import blogPumpfoil from "@/assets/blog-pumpfoil.jpg";
import blogKiteDuotone from "@/assets/blog-kite-duotone.jpg";
import blogPumpfoilDock from "@/assets/blog-pumpfoil-dock.jpg";

// Image mapping for dynamic resolution
const imageMap: Record<string, string> = {
  "blog-kitesurf-debut.jpg": blogKitesurfDebut,
  "blog-wingfoil.jpg": blogWingfoil,
  "blog-kitesurf-action.jpg": blogKitesurfAction,
  "blog-bateau-groupe.jpg": blogBateauGroupe,
  "blog-pumpfoil.jpg": blogPumpfoil,
  "blog-kite-duotone.jpg": blogKiteDuotone,
  "blog-pumpfoil-dock.jpg": blogPumpfoilDock,
};

const getArticleImage = (imageName: string): string => {
  return imageMap[imageName] || blogKitesurfAction;
};

const breadcrumbItems = [
  { label: "Blog & Actualités" }
];

export const blogArticles = [
  {
    slug: "debuter-kitesurf-hyeres-guide-complet",
    title: "Débuter le Kitesurf à Hyères : Guide Complet 2024",
    excerpt: "Tout ce que vous devez savoir pour commencer le kitesurf à Hyères. Quel matériel choisir, comment se préparer, et pourquoi l'Almanarre est le spot idéal pour les débutants.",
    category: "Kitesurf",
    date: "2024-12-15",
    readTime: "8 min",
    image: "blog-kitesurf-debut.jpg",
    alt: "Débuter kitesurf Hyères Almanarre - Guide débutant école KiteSurf Passion Var",
    featured: true,
  },
  {
    slug: "wingfoil-sport-tendance-2024",
    title: "Wing Foil : Le Sport de Glisse Tendance en 2024",
    excerpt: "Découvrez pourquoi le wingfoil conquiert la Méditerranée. Plus accessible que le kitesurf, le wingfoil offre des sensations uniques de vol sur l'eau.",
    category: "Wing Foil",
    date: "2024-12-10",
    readTime: "6 min",
    image: "blog-wingfoil.jpg",
    alt: "Wingfoil Hyères tendance 2024 - Stage wing foil école KiteSurf Passion Almanarre",
    featured: true,
  },
  {
    slug: "conditions-meteo-almanarre-guide",
    title: "Comprendre les Conditions Météo à l'Almanarre",
    excerpt: "Mistral ou Levant ? Apprenez à décrypter les conditions météo du spot de l'Almanarre pour naviguer dans les meilleures conditions possibles.",
    category: "Le Spot",
    date: "2024-12-05",
    readTime: "5 min",
    image: "blog-kitesurf-action.jpg",
    alt: "Conditions météo kitesurf Almanarre Hyères - Vent Mistral spot Var",
  },
  {
    slug: "pourquoi-bateau-assistance-essentiel",
    title: "Pourquoi un Bateau d'Assistance est Essentiel pour Apprendre",
    excerpt: "L'importance du bateau d'assistance dans l'apprentissage du kitesurf. Sécurité, progression rapide et gain de temps : découvrez tous les avantages.",
    category: "Sécurité",
    date: "2024-11-28",
    readTime: "4 min",
    image: "blog-bateau-groupe.jpg",
    alt: "Bateau assistance kitesurf Hyères - Sécurité école KiteSurf Passion Var",
  },
  {
    slug: "pumpfoil-dock-start-initiation",
    title: "Pumpfoil & Dock Start : L'Initiation au Foil Sans Vent",
    excerpt: "Pas de vent ? Pas de problème ! Le pumpfoil permet de voler sur l'eau par tous les temps. Découvrez cette discipline accessible à tous.",
    category: "Pump Foil",
    date: "2024-11-20",
    readTime: "5 min",
    image: "blog-pumpfoil.jpg",
    alt: "Pumpfoil dock start Hyères Giens - Initiation foil école KiteSurf Passion Var",
  },
  {
    slug: "meilleure-periode-kitesurf-var",
    title: "Quelle est la Meilleure Période pour le Kitesurf dans le Var ?",
    excerpt: "De mars à novembre, le Var offre des conditions exceptionnelles. Analyse mois par mois des meilleures périodes pour pratiquer le kitesurf et le wingfoil.",
    category: "Le Spot",
    date: "2024-11-15",
    readTime: "7 min",
    image: "blog-kite-duotone.jpg",
    alt: "Meilleure période kitesurf Var Hyères - Saison spot Almanarre",
  },
  {
    slug: "choisir-aile-wingfoil-debutant",
    title: "Comment Choisir son Aile de Wingfoil : Guide Débutant",
    excerpt: "Taille, forme, nombre de fenêtres... Tous les critères pour bien choisir votre première aile de wingfoil et progresser rapidement.",
    category: "Wing Foil",
    date: "2024-11-10",
    readTime: "6 min",
    image: "blog-wingfoil.jpg",
    alt: "Choisir aile wingfoil débutant - Conseil matériel école KiteSurf Passion Hyères",
  },
  {
    slug: "wingfoil-vs-kitesurf-differences",
    title: "Wingfoil vs Kitesurf : Quelles Différences et Lequel Choisir ?",
    excerpt: "Deux disciplines, deux sensations différentes. Comparatif complet pour vous aider à choisir entre le wingfoil et le kitesurf selon votre profil.",
    category: "Wing Foil",
    date: "2024-10-25",
    readTime: "7 min",
    image: "blog-kitesurf-action.jpg",
    alt: "Wingfoil vs kitesurf comparatif - Différences glisse école Hyères Var",
  },
  {
    slug: "technique-pumping-foil-progresser",
    title: "Maîtriser la Technique du Pumping en Foil",
    excerpt: "Le pumping est la clé pour voler sans traction. Découvrez les exercices et conseils pour perfectionner votre technique et gagner en endurance.",
    category: "Pump Foil",
    date: "2024-10-15",
    readTime: "5 min",
    image: "blog-pumpfoil.jpg",
    alt: "Technique pumping foil Hyères - Progresser pumpfoil école KiteSurf Passion Var",
  },
  {
    slug: "premiers-vols-wingfoil-conseils",
    title: "Vos Premiers Vols en Wingfoil : 5 Conseils Essentiels",
    excerpt: "Réussir ses premiers décollages en wingfoil demande technique et patience. Voici les 5 conseils clés pour décoller en toute confiance.",
    category: "Wing Foil",
    date: "2024-10-05",
    readTime: "4 min",
    image: "blog-wingfoil.jpg",
    alt: "Premiers vols wingfoil conseils - Apprendre wing foil Hyères Almanarre Var",
  },
  {
    slug: "pumpfoil-entrainement-sans-vent",
    title: "Pumpfoil : L'Entraînement Idéal les Jours Sans Vent",
    excerpt: "Transformez les jours sans vent en sessions productives. Le pumpfoil développe votre équilibre et votre cardio tout en vous faisant progresser en foil.",
    category: "Pump Foil",
    date: "2024-09-28",
    readTime: "4 min",
    image: "blog-pumpfoil-dock.jpg",
  },
];

const categories = ["Tous", "Kitesurf", "Wing Foil", "Pump Foil", "Le Spot", "Sécurité"];

// Map URL-friendly slugs to display names
const categorySlugMap: Record<string, string> = {
  "kitesurf": "Kitesurf",
  "wingfoil": "Wing Foil", 
  "pumpfoil": "Pump Foil",
  "le-spot": "Le Spot",
  "securite": "Sécurité",
};

const getCategorySlug = (category: string): string => {
  return category.toLowerCase().replace(/ /g, "").replace("é", "e");
};

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const categoryParam = searchParams.get("categorie");
  
  // Get selected category from URL or default to "Tous"
  const selectedCategory = categoryParam 
    ? (categorySlugMap[categoryParam] || "Tous")
    : "Tous";

  const handleCategoryChange = (category: string) => {
    setSearchQuery(""); // Reset search when changing category
    setIsLoading(true);
    if (category === "Tous") {
      setSearchParams({});
    } else {
      setSearchParams({ categorie: getCategorySlug(category) });
    }
  };

  // Simulate loading effect
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, selectedCategory, searchQuery]);

  // Filter articles based on selected category and search query
  const filteredArticles = blogArticles.filter(article => {
    const matchesCategory = selectedCategory === "Tous" || article.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = searchLower === "" || 
      article.title.toLowerCase().includes(searchLower) ||
      article.excerpt.toLowerCase().includes(searchLower) ||
      article.category.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = filteredArticles.filter(article => article.featured);

  // Pagination
  const ARTICLES_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  // Reset page when filters change
  const handleCategoryChangeWithReset = (category: string) => {
    setCurrentPage(1);
    handleCategoryChange(category);
  };

  // Count articles per category
  const getCategoryCount = (category: string): number => {
    if (category === "Tous") return blogArticles.length;
    return blogArticles.filter(article => article.category === category).length;
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog KiteSurf Passion",
    description: "Actualités, conseils et guides sur le kitesurf, wingfoil et sports de glisse à Hyères",
    url: "https://www.kitesurfpassion.com/blog-kitesurf-hyeres",
    publisher: {
      "@type": "Organization",
      name: "KiteSurf Passion",
      logo: {
        "@type": "ImageObject",
        url: "https://www.kitesurfpassion.com/logo.png",
      },
    },
    blogPost: blogArticles.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      datePublished: article.date,
      url: `https://www.kitesurfpassion.com/blog/${article.slug}`,
    })),
  };

  return (
    <>
      <Helmet>
        <title>Blog Kitesurf Hyères | Conseils, Guides & Actualités | KiteSurf Passion</title>
        <meta
          name="description"
          content="Conseils d'experts, guides pratiques et actualités sur le kitesurf, wingfoil et sports de glisse à Hyères. Apprenez avec KiteSurf Passion depuis 1999."
        />
        <meta
          name="keywords"
          content="blog kitesurf hyères, conseils wingfoil, guide débutant kitesurf, conditions almanarre, météo kitesurf var"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.com/blog-kitesurf-hyeres" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Blog kitesurf wingfoil pumpfoil - Presqu'île de Giens"
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-navy/20" />
          </div>

          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-2xl">
              <span className="inline-block text-sunset font-semibold mb-4">Blog & Actualités</span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
                Conseils d'Experts & Guides Pratiques
              </h1>
              <p className="text-primary-foreground/80 text-lg mb-8">
                25 ans d'expérience partagée : conseils pour débuter, guides des spots, conditions météo et actualités du kitesurf à Hyères.
              </p>
            </div>
          </div>
        </section>

        {/* Search & Categories Filter */}
        <section className="py-8 bg-muted/30 border-b border-border/50">
          <div className="container mx-auto px-4">
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); setIsLoading(true); }}
                  className="pl-10 pr-10 py-2 rounded-full border-border/50 focus:border-primary"
                  maxLength={100}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChangeWithReset(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    category === selectedCategory
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/50"
                  }`}
                >
                  {category}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    category === selectedCategory
                      ? "bg-primary-foreground/20"
                      : "bg-muted"
                  }`}>
                    {getCategoryCount(category)}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Results Info */}
            {searchQuery && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {filteredArticles.length} résultat{filteredArticles.length !== 1 ? 's' : ''} pour "{searchQuery}"
              </p>
            )}
          </div>
        </section>

        {/* Featured Articles */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            {featuredArticles.length > 0 && (
              <>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-10">
                  Articles à la Une
                </h2>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                  {featuredArticles.map((article) => (
                  <Link
                    key={article.slug}
                    to={`/blog/${article.slug}`}
                    className="group bg-card rounded-3xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={getArticleImage(article.image)}
                        alt={article.alt || article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
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
                      <p className="text-muted-foreground line-clamp-2 mb-4">
                        {article.excerpt}
                      </p>
                      <span className="inline-flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                        Lire l'article
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
            )}

            {/* All Articles */}
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-10">
              {selectedCategory === "Tous" ? "Tous les Articles" : `Articles ${selectedCategory}`}
            </h2>

            {isLoading ? (
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
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-2xl">
                <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Aucun article trouvé</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery 
                    ? `Aucun résultat pour "${searchQuery}"${selectedCategory !== "Tous" ? ` dans la catégorie ${selectedCategory}` : ""}.`
                    : `Aucun article dans la catégorie ${selectedCategory} pour le moment.`
                  }
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchQuery(""); handleCategoryChangeWithReset("Tous"); }}
                >
                  Voir tous les articles
                </Button>
              </div>
            ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedArticles.map((article) => (
                <div
                  key={article.slug}
                  className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-md relative"
                >
                  <Link to={`/blog/${article.slug}`}>
                    <div className="aspect-video overflow-hidden relative">
                      <img
                        src={getArticleImage(article.image)}
                        alt={article.alt || article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ShareButtons 
                          url={`https://www.kitesurfpassion.com/blog/${article.slug}`}
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
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Page suivante"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <NewsletterForm />
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={blogCtaImage} 
              alt="Kitesurf au coucher de soleil à Hyères" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-navy/60" />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="font-display text-3xl font-bold text-white mb-4">
              Prêt à Vous Lancer ?
            </h2>
            <p className="text-white/90 mb-8 max-w-xl mx-auto">
              Passez de la théorie à la pratique avec nos stages encadrés par des professionnels.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  Réserver un Stage
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">Voir les Tarifs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Blog;
