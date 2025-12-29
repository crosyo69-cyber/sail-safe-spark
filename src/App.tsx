import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import CoursKitesurf from "./pages/CoursKitesurf";
import StageWingfoil from "./pages/StageWingfoil";
import CoursPumpfoil from "./pages/CoursPumpfoil";
import Tarifs from "./pages/Tarifs";
import Contact from "./pages/Contact";
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
            <Route path="/stage-wingfoil-hyeres-almanarre" element={<StageWingfoil />} />
            <Route path="/cours-pumpfoil-dock-start-hyeres" element={<CoursPumpfoil />} />
            <Route path="/tarifs-cours-kitesurf-wingfoil-hyeres" element={<Tarifs />} />
            <Route path="/contact-reservation-kitesurf-hyeres" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
