import { useEffect } from "react";
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
import { SEORedirect } from "@/components/SEORedirect";
import { LegacyRedirectHandler } from "@/components/LegacyRedirectHandler";

// All pages loaded eagerly for SEO — ensures Googlebot sees content immediately
import Index from "./pages/Index";
import CoursKitesurf from "./pages/CoursKitesurf";
import Stage100Glisse from "./pages/Stage100Glisse";
import SessionCarte from "./pages/SessionCarte";
import CoursParticulier from "./pages/CoursParticulier";
import StageWingfoil from "./pages/StageWingfoil";
import CoursPumpfoil from "./pages/CoursPumpfoil";
import SpotAlmanarre from "./pages/SpotAlmanarre";
import LocationMateriel from "./pages/LocationMateriel";
import DeposesMer from "./pages/DeposesMer";
import FoilTracte from "./pages/FoilTracte";
import Wakeboard from "./pages/Wakeboard";
import Tarifs from "./pages/Tarifs";
import Contact from "./pages/Contact";
import APropos from "./pages/APropos";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Auth from "./pages/Auth";
import UnsubscribeAlerts from "./pages/UnsubscribeAlerts";
import MentionsLegales from "./pages/MentionsLegales";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
// NotFound is handled inside LegacyRedirectHandler

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    },
  },
});


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
          <>
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
              {/* SEO-friendly redirections with noindex for Google Search Console */}
              <Route path="/foil-tracte-wakeboard-hyeres" element={<SEORedirect to="/foil-tracte-hyeres" statusCode={301} />} />
              <Route path="/tarifs-cours-kitesurf-wingfoil-hyeres" element={<Tarifs />} />
              <Route path="/contact-reservation-kitesurf-hyeres" element={<Contact />} />
              <Route path="/a-propos-ecole-kitesurf-hyeres" element={<APropos />} />
              <Route path="/blog-kitesurf-hyeres" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/desabonnement-alertes" element={<UnsubscribeAlerts />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
              {/* Legacy URL redirections (old .com site → new .fr routes) */}
              <Route path="*" element={<LegacyRedirectHandler />} />
            </Routes>
          </>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;