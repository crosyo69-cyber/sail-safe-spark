import { Button } from "@/components/ui/button";
import { Phone, Send } from "lucide-react";
import { forwardRef, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trackFormSubmit, trackPhoneClick, trackGoogleAdsConversion } from "@/lib/analytics";
import { trackMetaLead, trackMetaContact } from "@/lib/meta-pixel";
import sunsetImage from "@/assets/almanarre-sunset.jpg?webp";

export const CTASection = forwardRef<HTMLElement, object>(function CTASection(_, ref) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    phone: "",
    activity: "kitesurf",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formTimestamp] = useState(Date.now());
  const submitLockRef = useRef(false);

  const activityLabels: Record<string, string> = {
    kitesurf: "Kitesurf débutant",
    wingfoil: "Wing Foil",
    pumpfoil: "Pump Foil",
    perfectionnement: "Perfectionnement",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Synchronous guard against double-clicks (setState is async, button disabled lags one render)
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    // Honeypot check
    if (honeypot) {
      navigate("/merci");
      return;
    }

    // Time-based check — form should take at least 3 seconds
    if (Date.now() - formTimestamp < 3000) {
      toast.error("Erreur", {
        description: "Veuillez prendre le temps de remplir le formulaire.",
      });
      submitLockRef.current = false;
      return;
    }

    setIsSubmitting(true);
    try {
      trackFormSubmit("cta_reservation", "homepage_cta", { activity: formData.activity });
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[CTA] trackFormSubmit threw", err);
    }
    try {
      trackMetaLead({ content_name: "cta_reservation", content_category: formData.activity });
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[CTA] trackMetaLead threw", err);
    }

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: formData.firstName,
          email: formData.email,
          phone: formData.phone,
          activity: activityLabels[formData.activity] || formData.activity,
          honeypot,
          formTimestamp,
        },
      });

      if (error) throw error;

      setFormData({ firstName: "", email: "", phone: "", activity: "kitesurf" });
      // Fire Google Ads conversion immediately before redirect to avoid loss if navigation is interrupted.
      // Wrapped so any throw (rare: e.g. analytics blocker) cannot prevent the /merci redirect.
      try {
        trackGoogleAdsConversion('s2n0CL3puI4cEIW4u9AD');
      } catch (err) {
        if (import.meta.env.DEV) console.warn("[CTA] trackGoogleAdsConversion threw", err);
      }
      navigate("/merci");
    } catch (error) {
      console.error("CTA form error:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue. Veuillez réessayer ou nous appeler directement.",
      });
      submitLockRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneClick = () => {
    trackPhoneClick("homepage_cta");
    trackMetaContact({ content_name: "phone_click", content_category: "homepage_cta" });
  };

  return (
    <section 
      ref={ref}
      id="contact" 
      className="relative py-24 overflow-hidden"
      style={{ contain: 'layout style' }}
    >
      {/* Background Image - Optimized with explicit dimensions */}
      <div className="absolute inset-0" style={{ contain: 'strict' }}>
        <img
          src={sunsetImage}
          alt="Coucher de soleil kitesurf Almanarre Hyères - École KiteSurf Passion Var"
          width={1920}
          height={1080}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          style={{ aspectRatio: '16 / 9' }}
        />
        <div className="absolute inset-0 bg-navy/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Prêt à Vivre Votre{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">
              Aventure Kitesurf
            </span>{" "}
            ?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-12 max-w-2xl mx-auto">
            Réservez dès maintenant votre stage à Hyères et rejoignez les 2 500 élèves formés depuis 1999
          </p>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            data-testid="lead-form"
            aria-label="Formulaire de réservation kitesurf"
            className="bg-primary-foreground/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-primary-foreground/20 max-w-2xl mx-auto mb-8"
          >
            {/* Honeypot - hidden from humans */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="absolute -left-[9999px] opacity-0 h-0 w-0"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <input
                  type="text"
                  placeholder="Votre prénom"
                  data-testid="lead-firstname"
                  aria-label="Votre prénom"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full h-14 px-5 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-sunset transition-colors"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Votre email"
                  data-testid="lead-email"
                  aria-label="Votre email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full h-14 px-5 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-sunset transition-colors"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Votre téléphone"
                  data-testid="lead-phone"
                  aria-label="Votre téléphone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full h-14 px-5 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-sunset transition-colors"
                />
              </div>
              <div>
                <select
                  value={formData.activity}
                  data-testid="lead-activity"
                  aria-label="Activité"
                  onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                  className="w-full h-14 px-5 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground focus:outline-none focus:border-sunset transition-colors"
                >
                  <option value="kitesurf" className="bg-navy">Kitesurf débutant</option>
                  <option value="wingfoil" className="bg-navy">Wing Foil</option>
                  <option value="pumpfoil" className="bg-navy">Pump Foil</option>
                  <option value="perfectionnement" className="bg-navy">Perfectionnement</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              variant="sunset"
              size="xl"
              data-testid="lead-submit"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Envoi en cours..."
              ) : (
                <>
                  Envoyer ma demande
                  <Send className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Phone Alternative */}
          <div className="flex items-center justify-center gap-3 text-primary-foreground/80">
            <span>ou appelez-nous directement :</span>
            <a
              href="tel:0672716905"
              onClick={handlePhoneClick}
              className="inline-flex items-center gap-2 text-sunset hover:text-sunset-light font-bold transition-colors"
            >
              <Phone className="w-5 h-5" />
              06 72 71 69 05
            </a>
          </div>
        </div>
      </div>
    </section>
  );
});
