import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Home, Search, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = useLocation();

  // Paths techniques légitimes (sondés par crawlers/OS) — à exclure du logging 404
  // pour ne pas polluer page_404_logs et fausser le monitoring.
  const EXCLUDED_404_PATHS = [
    "/apple-app-site-association",
    "/.well-known/apple-app-site-association",
    "/.well-known/assetlinks.json",
    "/assetlinks.json",
    "/favicon.ico",
    "/sw.js",
    "/manifest.json",
    "/robots.txt",
    "/sitemap.xml",
  ];

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);

    // Skip logging for known legitimate technical paths
    if (EXCLUDED_404_PATHS.includes(location.pathname)) {
      return;
    }

    // Log 404 hit to database for monitoring.
    // EXCEPTION E-3-D : accès Supabase direct assumé ici (instrumentation 404 anonyme
    // autorisée par le lot E-1). Ne pas router via la couche service (pas de retry,
    // pas de toast, échec silencieux obligatoire).
    const log404 = async () => {
      try {
        await supabase.from("page_404_logs" as any).insert({
          path: location.pathname + location.search,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent || null,
        });
      } catch (e) {
        // Silent fail — monitoring should never break UX
      }
    };
    log404();
  }, [location.pathname, location.search]);

  // Liste des pages populaires pour aider l'utilisateur
  const popularPages = [
    { title: "Cours Kitesurf Débutant", path: "/cours-kitesurf-hyeres-debutant" },
    { title: "Stage Wingfoil", path: "/stage-wingfoil-hyeres-almanarre" },
    { title: "Tarifs", path: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
    { title: "Le Spot Almanarre", path: "/spot-kitesurf-almanarre-hyeres-var" },
    { title: "Contact & Réservation", path: "/contact-reservation-kitesurf-hyeres" },
  ];

  return (
    <>
      <Helmet>
        <title>Page Non Trouvée (404) | KiteSurf Passion Hyères</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Cette page n'existe pas ou a été déplacée. Retrouvez nos cours de kitesurf et wingfoil à Hyères." />
        <meta name="prerender-status-code" content="404" />
      </Helmet>
      
      <Header />
      
      <main className="min-h-screen bg-gradient-to-b from-muted/50 to-background pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* Illustration 404 */}
            <div className="mb-8">
              <div className="relative inline-block">
                <span className="text-[150px] md:text-[200px] font-black text-primary/10 leading-none select-none">
                  404
                </span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary/10 rounded-full p-6">
                    <Search className="w-16 h-16 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Message principal */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Page Non Trouvée
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
              <br />
              <span className="text-sm">URL demandée : <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code></span>
            </p>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="gap-2">
                <Link to="/">
                  <Home className="w-5 h-5" />
                  Retour à l'accueil
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/contact-reservation-kitesurf-hyeres">
                  <Phone className="w-5 h-5" />
                  Nous contacter
                </Link>
              </Button>
            </div>

            {/* Pages populaires */}
            <div className="bg-card border rounded-lg p-6 text-left">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowLeft className="w-5 h-5 text-primary" />
                Pages populaires
              </h2>
              <ul className="space-y-2">
                {popularPages.map((page) => (
                  <li key={page.path}>
                    <Link 
                      to={page.path}
                      className="text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default NotFound;
