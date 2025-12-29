import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
