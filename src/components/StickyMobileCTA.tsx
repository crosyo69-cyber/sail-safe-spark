import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";
import { trackCTAClick, trackPhoneClick } from "@/lib/analytics";

const HIDDEN_PATHS = [
  "/admin",
  "/auth",
  "/merci",
  "/reservation-confirmee",
  "/mon-espace",
  "/desabonnement-alertes",
];

export function StickyMobileCTA() {
  const location = useLocation();

  const shouldHide = HIDDEN_PATHS.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(path + "/")
  );

  if (shouldHide) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-navy/95 backdrop-blur-lg border-t border-sunset/30 shadow-2xl px-3 py-2.5 flex gap-2 items-center safe-area-pb"
      role="region"
      aria-label="Réservation rapide"
    >
      <Button
        variant="default"
        size="default"
        className="flex-1 bg-gradient-to-r from-sunset to-sunset-light text-accent-foreground font-bold shadow-sunset touch-target h-12"
        asChild
        onClick={() =>
          trackCTAClick(
            "reserver_cours",
            "sticky_mobile_global",
            "/contact-reservation-kitesurf-hyeres"
          )
        }
      >
        <Link
          to="/contact-reservation-kitesurf-hyeres"
          aria-label="Réserver un cours — acompte 50 €"
        >
          Réserver — dès 50 €
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
      <Button
        variant="outline"
        size="icon"
        asChild
        onClick={() =>
          trackCTAClick("appeler", "sticky_mobile_global", "tel:0672716905")
        }
        className="touch-target shrink-0 h-12 w-12 bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
      >
        <a
          href="tel:+33672716905"
          aria-label="Appeler l'école"
          onClick={() => trackPhoneClick("sticky_mobile_global")}
        >
          <Phone className="w-5 h-5" />
        </a>
      </Button>
    </div>
  );
}
