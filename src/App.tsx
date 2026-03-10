import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { CookieConsent } from "@/components/CookieConsent";
import { ChatBot } from "@/components/ChatBot";
import { WebVitalsDashboard } from "@/components/WebVitalsDashboard";
import { PageTracker } from "@/components/PageTracker";
import { initGA4 } from "@/lib/analytics";
import { SEORedirect } from "@/components/SEORedirect";
import { LegacyRedirectHandler } from "@/components/LegacyRedirectHandler";

// Only homepage loaded eagerly — all other pages lazy loaded
import Index from "./pages/Index";

// All other pages lazy loaded to prevent dev server overload
const CoursKitesurf = lazy(() => import("./pages/CoursKitesurf"));
const Tarifs = lazy(() => import("./pages/Tarifs"));
const Contact = lazy(() => import("./pages/Contact"));
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
const APropos = lazy(() => import("./pages/APropos"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const Auth = lazy(() => import("./pages/Auth"));
const UnsubscribeAlerts = lazy(() => import("./pages/UnsubscribeAlerts"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const ReservationConfirmee = lazy(() => import("./pages/ReservationConfirmee"));
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
        <ChatBot />
        <WebVitalsDashboard />
        <BrowserRouter>
          <PageTracker />
           <Suspense fallback={null}>
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
                {/* Short URL redirections to prevent Soft 404 in GSC */}
                <Route path="/foil-tracte" element={<SEORedirect to="/foil-tracte-hyeres" statusCode={301} />} />
                <Route path="/deposes-mer" element={<SEORedirect to="/deposes-mer-kitesurf-hyeres" statusCode={301} />} />
                <Route path="/spot-almanarre" element={<SEORedirect to="/spot-kitesurf-almanarre-hyeres-var" statusCode={301} />} />
                <Route path="/a-propos" element={<SEORedirect to="/a-propos-ecole-kitesurf-hyeres" statusCode={301} />} />
                <Route path="/stage-wingfoil" element={<SEORedirect to="/stage-wingfoil-hyeres-almanarre" statusCode={301} />} />
                <Route path="/cours-pumpfoil" element={<SEORedirect to="/cours-pumpfoil-dock-start-hyeres" statusCode={301} />} />
                <Route path="/blog" element={<SEORedirect to="/blog-kitesurf-hyeres" statusCode={301} />} />
                <Route path="/cours-kitesurf" element={<SEORedirect to="/cours-kitesurf-hyeres-debutant" statusCode={301} />} />
                <Route path="/location-materiel" element={<SEORedirect to="/location-materiel-kitesurf-hyeres" statusCode={301} />} />
                <Route path="/tarifs" element={<SEORedirect to="/tarifs-cours-kitesurf-wingfoil-hyeres" statusCode={301} />} />
                <Route path="/contact" element={<SEORedirect to="/contact-reservation-kitesurf-hyeres" statusCode={301} />} />
                <Route path="/wakeboard" element={<SEORedirect to="/wakeboard-hyeres" statusCode={301} />} />
               <Route path="/tarifs-cours-kitesurf-wingfoil-hyeres" element={<Tarifs />} />
               <Route path="/contact-reservation-kitesurf-hyeres" element={<Contact />} />
               <Route path="/a-propos-ecole-kitesurf-hyeres" element={<APropos />} />
               <Route path="/blog-kitesurf-hyeres" element={<Blog />} />
               <Route path="/blog/:slug" element={<BlogArticle />} />
               <Route path="/auth" element={<Auth />} />
               <Route path="/desabonnement-alertes" element={<UnsubscribeAlerts />} />
               <Route path="/mentions-legales" element={<MentionsLegales />} />
                <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
                <Route path="/reservation-confirmee" element={<ReservationConfirmee />} />
               {/* Legacy URL redirections (old .com site → new .fr routes) */}
               <Route path="*" element={<LegacyRedirectHandler />} />
             </Routes>
           </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;