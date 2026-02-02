import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { CookieConsent } from "@/components/CookieConsent";
import { WebVitalsDashboard } from "@/components/WebVitalsDashboard";
import { PageTracker } from "@/components/PageTracker";
import { initGA4 } from "@/lib/analytics";

// Critical path - loaded immediately
import Index from "./pages/Index";

// Lazy loaded pages for better initial load performance
const CoursKitesurf = lazy(() => import("./pages/CoursKitesurf"));
const Stage100Glisse = lazy(() => import("./pages/Stage100Glisse"));
const SessionCarte = lazy(() => import("./pages/SessionCarte"));
const CoursParticulier = lazy(() => import("./pages/CoursParticulier"));
const StageWingfoil = lazy(() => import("./pages/StageWingfoil"));
const CoursPumpfoil = lazy(() => import("./pages/CoursPumpfoil"));
const SpotAlmanarre = lazy(() => import("./pages/SpotAlmanarre"));
const LocationMateriel = lazy(() => import("./pages/LocationMateriel"));
const DeposesMer = lazy(() => import("./pages/DeposesMer"));
const FoilTracte = lazy(() => import("./pages/FoilTracte"));
const Wakeboard = lazy(() => import("./pages/Wakeboard"));
const Tarifs = lazy(() => import("./pages/Tarifs"));
const Contact = lazy(() => import("./pages/Contact"));
const APropos = lazy(() => import("./pages/APropos"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const Auth = lazy(() => import("./pages/Auth"));
const UnsubscribeAlerts = lazy(() => import("./pages/UnsubscribeAlerts"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    },
  },
});

// Minimal loading fallback for route transitions
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => {
  // Initialize GA4 after React has mounted to avoid DOM conflicts
  useEffect(() => {
    initGA4();
  }, []);

  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallBanner />
        <CookieConsent />
        <WebVitalsDashboard />
        <BrowserRouter>
          <PageTracker />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cours-kitesurf-hyeres-debutant" element={<CoursKitesurf />} />
              <Route path="/stage-kitesurf-100-glisse-hyeres" element={<Stage100Glisse />} />
              <Route path="/session-kitesurf-carte-hyeres" element={<SessionCarte />} />
              <Route path="/cours-particulier-kitesurf-hyeres" element={<CoursParticulier />} />
              <Route path="/stage-wingfoil-hyeres-almanarre" element={<StageWingfoil />} />
              <Route path="/cours-pumpfoil-dock-start-hyeres" element={<CoursPumpfoil />} />
              <Route path="/spot-kitesurf-almanarre-hyeres-var" element={<SpotAlmanarre />} />
              <Route path="/location-materiel-kitesurf-hyeres" element={<LocationMateriel />} />
              <Route path="/deposes-mer-kitesurf-hyeres" element={<DeposesMer />} />
              <Route path="/foil-tracte-hyeres" element={<FoilTracte />} />
              <Route path="/wakeboard-hyeres" element={<Wakeboard />} />
              {/* Redirection de l'ancienne URL vers les nouvelles pages */}
              <Route path="/foil-tracte-wakeboard-hyeres" element={<Navigate to="/foil-tracte-hyeres" replace />} />
              <Route path="/tarifs-cours-kitesurf-wingfoil-hyeres" element={<Tarifs />} />
              <Route path="/contact-reservation-kitesurf-hyeres" element={<Contact />} />
              <Route path="/a-propos-ecole-kitesurf-hyeres" element={<APropos />} />
              <Route path="/blog-kitesurf-hyeres" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/desabonnement-alertes" element={<UnsubscribeAlerts />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;