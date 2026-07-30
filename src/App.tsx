import { useEffect, Suspense } from "react";
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
import { StickyMobileCTA } from "@/components/StickyMobileCTA";
import { initGA4 } from "@/lib/analytics";
import { initMetaPixel } from "@/lib/meta-pixel";
import { SEORedirect } from "@/components/SEORedirect";
import { LegacyRedirectHandler } from "@/components/LegacyRedirectHandler";
import { ChunkErrorBoundary, lazyWithChunkRecovery } from "@/lib/chunk-recovery";

// Only homepage loaded eagerly — all other pages lazy loaded
import Index from "./pages/Index";

// All other pages lazy loaded to prevent dev server overload
const CoursKitesurf = lazyWithChunkRecovery(() => import("./pages/CoursKitesurf"));
const Tarifs = lazyWithChunkRecovery(() => import("./pages/Tarifs"));
const Contact = lazyWithChunkRecovery(() => import("./pages/Contact"));
const Stage100Glisse = lazyWithChunkRecovery(() => import("./pages/Stage100Glisse"));
const SessionCarte = lazyWithChunkRecovery(() => import("./pages/SessionCarte"));
const CoursParticulier = lazyWithChunkRecovery(() => import("./pages/CoursParticulier"));
const StageWingfoil = lazyWithChunkRecovery(() => import("./pages/StageWingfoil"));
const CoursPumpfoil = lazyWithChunkRecovery(() => import("./pages/CoursPumpfoil"));
const SpotAlmanarre = lazyWithChunkRecovery(() => import("./pages/SpotAlmanarre"));
const LocationMateriel = lazyWithChunkRecovery(() => import("./pages/LocationMateriel"));
const DeposesMer = lazyWithChunkRecovery(() => import("./pages/DeposesMer"));
const EfoilAssistFoil = lazyWithChunkRecovery(() => import("./pages/EfoilAssistFoil"));
const FoilTracte = lazyWithChunkRecovery(() => import("./pages/FoilTracte"));
const Wakeboard = lazyWithChunkRecovery(() => import("./pages/Wakeboard"));
const APropos = lazyWithChunkRecovery(() => import("./pages/APropos"));
const Blog = lazyWithChunkRecovery(() => import("./pages/Blog"));
const BlogArticle = lazyWithChunkRecovery(() => import("./pages/BlogArticle"));
const Auth = lazyWithChunkRecovery(() => import("./pages/Auth"));
const UnsubscribeAlerts = lazyWithChunkRecovery(() => import("./pages/UnsubscribeAlerts"));
const MentionsLegales = lazyWithChunkRecovery(() => import("./pages/MentionsLegales"));
const PolitiqueConfidentialite = lazyWithChunkRecovery(() => import("./pages/PolitiqueConfidentialite"));
const ReservationConfirmee = lazyWithChunkRecovery(() => import("./pages/ReservationConfirmee"));
const Merci = lazyWithChunkRecovery(() => import("./pages/Merci"));
const Admin = lazyWithChunkRecovery(() => import("./pages/Admin"));
const MonEspace = lazyWithChunkRecovery(() => import("./pages/MonEspace"));
const Reserver = lazyWithChunkRecovery(() => import("./pages/Reserver"));
const OAuthConsent = lazyWithChunkRecovery(() => import("./pages/OAuthConsent"));
const AdminJournees = lazyWithChunkRecovery(() => import("./pages/AdminJournees"));
const AdminCredits = lazyWithChunkRecovery(() => import("./pages/AdminCredits"));
const WaitlistConfirm = lazyWithChunkRecovery(() => import("./pages/WaitlistConfirm"));
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
    initMetaPixel();
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
          <StickyMobileCTA />
           <ChunkErrorBoundary>
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
               <Route path="/efoil-assist-foil-hyeres" element={<EfoilAssistFoil />} />
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
                {/* Legacy blog slug from old site → new article */}
                <Route path="/blog/wingfoil-vs-kitesurf-quel-sport-choisir" element={<SEORedirect to="/blog/pumpfoil-vs-wingfoil-lequel-choisir-hyeres" statusCode={301} />} />
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
                <Route path="/merci" element={<Merci />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/journees" element={<AdminJournees />} />
                <Route path="/admin/credits" element={<AdminCredits />} />
                <Route path="/liste-attente/:token" element={<WaitlistConfirm />} />
                <Route path="/mon-espace" element={<MonEspace />} />
                <Route path="/mon-espace/:code" element={<MonEspace />} />
                <Route path="/reserver" element={<Reserver />} />
                 <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                {/* Legacy "Dernière Minute" routes redirect to the unified booking calendar */}
                <Route path="/dernieres-minutes" element={<SEORedirect to="/reserver" statusCode={301} />} />
                <Route path="/alerte-derniere-minute" element={<SEORedirect to="/reserver" statusCode={301} />} />
                {/* Legacy URL redirections (old .com site → new .fr routes) */}
               <Route path="*" element={<LegacyRedirectHandler />} />
             </Routes>
           </Suspense>
           </ChunkErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;