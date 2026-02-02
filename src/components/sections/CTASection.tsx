import { Button } from "@/components/ui/button";
import { Phone, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import sunsetImage from "@/assets/almanarre-sunset.jpg?webp";

export function CTASection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    phone: "",
    activity: "kitesurf",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Demande envoyée !",
      description: "Nous vous recontacterons sous 24h.",
    });

    setFormData({ firstName: "", email: "", phone: "", activity: "kitesurf" });
    setIsSubmitting(false);
  };

  return (
    <section 
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
            className="bg-primary-foreground/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-primary-foreground/20 max-w-2xl mx-auto mb-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <input
                  type="text"
                  placeholder="Votre prénom"
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
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full h-14 px-5 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-sunset transition-colors"
                />
              </div>
              <div>
                <select
                  value={formData.activity}
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
}
