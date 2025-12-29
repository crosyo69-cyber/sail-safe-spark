import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/almanarre-sunset.jpg";

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
    image: "kitesurf-lesson.jpg",
    featured: true,
  },
  {
    slug: "wingfoil-sport-tendance-2024",
    title: "Wing Foil : Le Sport de Glisse Tendance en 2024",
    excerpt: "Découvrez pourquoi le wingfoil conquiert la Méditerranée. Plus accessible que le kitesurf, le wingfoil offre des sensations uniques de vol sur l'eau.",
    category: "Wing Foil",
    date: "2024-12-10",
    readTime: "6 min",
    image: "wingfoil.jpg",
    featured: true,
  },
  {
    slug: "conditions-meteo-almanarre-guide",
    title: "Comprendre les Conditions Météo à l'Almanarre",
    excerpt: "Mistral ou Levant ? Apprenez à décrypter les conditions météo du spot de l'Almanarre pour naviguer dans les meilleures conditions possibles.",
    category: "Le Spot",
    date: "2024-12-05",
    readTime: "5 min",
    image: "almanarre-sunset.jpg",
  },
  {
    slug: "pourquoi-bateau-assistance-essentiel",
    title: "Pourquoi un Bateau d'Assistance est Essentiel pour Apprendre",
    excerpt: "L'importance du bateau d'assistance dans l'apprentissage du kitesurf. Sécurité, progression rapide et gain de temps : découvrez tous les avantages.",
    category: "Sécurité",
    date: "2024-11-28",
    readTime: "4 min",
    image: "bateau-securite-hyeres.jpg",
  },
  {
    slug: "pumpfoil-dock-start-initiation",
    title: "Pumpfoil & Dock Start : L'Initiation au Foil Sans Vent",
    excerpt: "Pas de vent ? Pas de problème ! Le pumpfoil permet de voler sur l'eau par tous les temps. Découvrez cette discipline accessible à tous.",
    category: "Pump Foil",
    date: "2024-11-20",
    readTime: "5 min",
    image: "pumpfoil.jpg",
  },
  {
    slug: "meilleure-periode-kitesurf-var",
    title: "Quelle est la Meilleure Période pour le Kitesurf dans le Var ?",
    excerpt: "De mars à novembre, le Var offre des conditions exceptionnelles. Analyse mois par mois des meilleures périodes pour pratiquer le kitesurf et le wingfoil.",
    category: "Le Spot",
    date: "2024-11-15",
    readTime: "7 min",
    image: "downwind.jpg",
  },
  {
    slug: "choisir-aile-wingfoil-debutant",
    title: "Comment Choisir son Aile de Wingfoil : Guide Débutant",
    excerpt: "Taille, forme, nombre de fenêtres... Tous les critères pour bien choisir votre première aile de wingfoil et progresser rapidement.",
    category: "Wing Foil",
    date: "2024-11-10",
    readTime: "6 min",
    image: "kite-wing.jpg",
  },
  {
    slug: "wingfoil-vs-kitesurf-differences",
    title: "Wingfoil vs Kitesurf : Quelles Différences et Lequel Choisir ?",
    excerpt: "Deux disciplines, deux sensations différentes. Comparatif complet pour vous aider à choisir entre le wingfoil et le kitesurf selon votre profil.",
    category: "Wing Foil",
    date: "2024-10-25",
    readTime: "7 min",
    image: "wingfoil.jpg",
  },
  {
    slug: "technique-pumping-foil-progresser",
    title: "Maîtriser la Technique du Pumping en Foil",
    excerpt: "Le pumping est la clé pour voler sans traction. Découvrez les exercices et conseils pour perfectionner votre technique et gagner en endurance.",
    category: "Pump Foil",
    date: "2024-10-15",
    readTime: "5 min",
    image: "pumpfoil.jpg",
  },
  {
    slug: "premiers-vols-wingfoil-conseils",
    title: "Vos Premiers Vols en Wingfoil : 5 Conseils Essentiels",
    excerpt: "Réussir ses premiers décollages en wingfoil demande technique et patience. Voici les 5 conseils clés pour décoller en toute confiance.",
    category: "Wing Foil",
    date: "2024-10-05",
    readTime: "4 min",
    image: "wingfoil.jpg",
  },
  {
    slug: "pumpfoil-entrainement-sans-vent",
    title: "Pumpfoil : L'Entraînement Idéal les Jours Sans Vent",
    excerpt: "Transformez les jours sans vent en sessions productives. Le pumpfoil développe votre équilibre et votre cardio tout en vous faisant progresser en foil.",
    category: "Pump Foil",
    date: "2024-09-28",
    readTime: "4 min",
    image: "foil-wakeboard-hyeres.jpg",
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
  const categoryParam = searchParams.get("categorie");
  
  // Get selected category from URL or default to "Tous"
  const selectedCategory = categoryParam 
    ? (categorySlugMap[categoryParam] || "Tous")
    : "Tous";

  const handleCategoryChange = (category: string) => {
    if (category === "Tous") {
      setSearchParams({});
    } else {
      setSearchParams({ categorie: getCategorySlug(category) });
    }
  };

  // Filter articles based on selected category
  const filteredArticles = selectedCategory === "Tous" 
    ? blogArticles 
    : blogArticles.filter(article => article.category === selectedCategory);

  const featuredArticles = filteredArticles.filter(article => article.featured);

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
              alt="Blog kitesurf Hyères - actualités et conseils"
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/90 to-navy/60" />
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

        {/* Categories Filter */}
        <section className="py-8 bg-muted/30 border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
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
                        src={`/src/assets/${article.image}`}
                        alt={article.title}
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

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Link
                  key={article.slug}
                  to={`/blog/${article.slug}`}
                  className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-md"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={`/src/assets/${article.image}`}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
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
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <NewsletterForm />
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-primary via-primary to-turquoise">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
              Prêt à Vous Lancer ?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
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
