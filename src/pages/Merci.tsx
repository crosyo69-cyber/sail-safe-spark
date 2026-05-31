import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle, Phone } from "lucide-react";
import { trackGoogleAdsConversion, trackPhoneClick } from "@/lib/analytics";
import { pushMerciConversion } from "@/lib/gtm";
import { trackMetaLead } from "@/lib/meta-pixel";
import { verifyGtagId } from "@/lib/gtag-id-check";
import { ConversionStatusIndicator } from "@/components/debug/ConversionStatusIndicator";
import { GoogleAdsConversionLog } from "@/components/debug/GoogleAdsConversionLog";

const Merci = () => {
  useEffect(() => {
    // Direct, unconditional Google Ads conversion call.
    // Fires at mount without any consent gate — RGPD is handled by
    // Google Consent Mode v2 (ad_storage / ad_user_data signals).
    try {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      if (typeof w.gtag === 'function') {
        w.gtag('event', 'conversion', {
          send_to: 'AW-974052357/s2n0CL3puI4cEIW4u9AD',
        });
      }
    } catch {
      /* never let analytics break the page */
    }

    // GTM-driven trigger (preferred): fires even on direct navigation, and
    // works independently of GA4/Ads init order. GTM must have a Custom
    // Event trigger on `merci_conversion` wired to the Ads conversion tag.
    pushMerciConversion('s2n0CL3puI4cEIW4u9AD');
    // Legacy direct gtag fallback (kept for parity until GTM is fully live).
    trackGoogleAdsConversion('s2n0CL3puI4cEIW4u9AD');
    // Meta Pixel Lead — fired on the server-validated landing page so direct
    // navigation to /merci (deep link, reload) also reports the conversion.
    // Dedup contract (meta-pixel.ts): 10s sliding window on
    // sessionStorage['__meta_pixel_lead'] + localStorage['conversion_fired_meta_lead'].
    // → Reload < 10s: skipped (no double Lead).
    // → Reload > 10s: fires once more (window expired by design).
    trackMetaLead({ content_name: 'conversion_merci', content_category: 'merci_page' });
    // Telemetry: confirm gtag.js loaded with the expected Google Ads ID.
    // Logs ✓ on success, console.error if a wrong/missing id is detected so
    // future regressions (stray VITE_GA_MEASUREMENT_ID secret, blocker, CSP)
    // surface immediately instead of silently dropping conversions.
    verifyGtagId();
  }, []);

  // Show debug indicator in dev/preview, on lovable.app hosts, or when ?debug=1
  const showDebug =
    typeof window !== "undefined" &&
    (import.meta.env.DEV ||
      window.location.hostname.includes("lovable") ||
      new URLSearchParams(window.location.search).get("debug") === "1");

  return (
    <>
      <Helmet>
        <title>Merci pour votre demande | KiteSurf Passion</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="min-h-screen flex items-center justify-center py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            {/* Logo */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-turquoise rounded-2xl flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-2xl">KP</span>
            </div>

            <div className="w-16 h-16 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
              Merci pour votre demande !
            </h1>

            <div className="bg-card border border-border rounded-2xl p-8 mb-8 space-y-4">
              <p className="text-foreground text-lg">
                Nous vous contactons sous <strong>24h</strong> pour confirmer votre réservation.
              </p>
              <p className="text-xl font-display font-semibold text-primary">
                À très vite sur l'eau ! 🪁
              </p>

              <div className="border-t border-border pt-4 mt-4">
                <p className="text-muted-foreground">
                  Besoin d'une réponse rapide ?
                </p>
                <a
                  href="tel:0672716905"
                  className="inline-flex items-center gap-2 mt-2 text-primary font-bold text-xl hover:underline"
                 onClick={() => trackPhoneClick("merci")}>
                  <Phone className="w-5 h-5" />
                  06 72 71 69 05
                </a>
              </div>
            </div>

            <Button variant="sunset" size="lg" asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />

      {showDebug && <ConversionStatusIndicator />}
      {showDebug && <GoogleAdsConversionLog />}
    </>
  );
};

export default Merci;
