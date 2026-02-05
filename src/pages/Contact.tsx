import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const breadcrumbItems = [
  { label: "Contact & Réservation" }
];

const activityLabels: Record<string, string> = {
  "kitesurf": "Kitesurf débutant",
  "kitesurf-perf": "Kitesurf perfectionnement",
  "wingfoil": "Wing Foil",
  "pumpfoil": "Pump Foil",
  "downwind": "Downwind",
  "autre": "Autre",
};

// Rate limiting constants
const RATE_LIMIT_COOLDOWN_MS = 60000; // 1 minute between submissions

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    activity: "kitesurf",
    dates: "",
    people: "1",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Anti-bot measures
  const [honeypot, setHoneypot] = useState("");
  const [formTimestamp] = useState(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check - if filled, silently reject (bots fill all fields)
    if (honeypot) {
      console.log("Bot detected");
      toast({
        title: "Demande envoyée !",
        description: "Nous vous recontacterons sous 24h pour confirmer votre réservation.",
      });
      return;
    }
    
    // Time-based check - form should take at least 3 seconds to fill
    if (Date.now() - formTimestamp < 3000) {
      toast({
        title: "Erreur",
        description: "Veuillez prendre le temps de remplir le formulaire.",
        variant: "destructive",
      });
      return;
    }
    
    // Client-side rate limiting using localStorage
    const lastSubmit = localStorage.getItem('lastContactSubmit');
    if (lastSubmit && Date.now() - parseInt(lastSubmit) < RATE_LIMIT_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_COOLDOWN_MS - (Date.now() - parseInt(lastSubmit))) / 1000);
      toast({
        title: "Veuillez patienter",
        description: `Vous pourrez soumettre à nouveau dans ${remainingSeconds} secondes.`,
        variant: "destructive",
      });
      return;
    }
    
    // Client-side validation
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    
    if (firstName.length < 2 || firstName.length > 50) {
      toast({
        title: "Erreur",
        description: "Le prénom doit contenir entre 2 et 50 caractères.",
        variant: "destructive",
      });
      return;
    }
    
    if (lastName.length < 2 || lastName.length > 50) {
      toast({
        title: "Erreur",
        description: "Le nom doit contenir entre 2 et 50 caractères.",
        variant: "destructive",
      });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      toast({
        title: "Erreur",
        description: "Adresse email invalide.",
        variant: "destructive",
      });
      return;
    }
    
    if (phone && !/^[\d\s\+\-\(\)\.]+$/.test(phone)) {
      toast({
        title: "Erreur",
        description: "Numéro de téléphone invalide.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: `${firstName} ${lastName}`,
          email: email,
          phone: phone || undefined,
          activity: activityLabels[formData.activity] || formData.activity,
          startDate: formData.dates.trim() || undefined,
          participants: formData.people,
          message: formData.message.trim() || undefined,
          honeypot: honeypot,
          formTimestamp: formTimestamp,
        },
      });

      if (error) throw error;

      // Record submission time for rate limiting
      localStorage.setItem('lastContactSubmit', Date.now().toString());

      toast({
        title: "Demande envoyée !",
        description: "Nous vous recontacterons sous 24h pour confirmer votre réservation.",
      });

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        activity: "kitesurf",
        dates: "",
        people: "1",
        message: "",
      });
    } catch (error: any) {
      console.error("Error sending contact form:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer ou nous appeler directement.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Kitesurf Hyères | Réservation Almanarre</title>
        <meta
          name="description"
          content="Réservez votre cours de kitesurf, wingfoil ou pumpfoil à Hyères"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres" />
        <link rel="alternate" hrefLang="fr" href="https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Contact & Réservation Kitesurf Hyères | KiteSurf Passion" />
        <meta property="og:description" content="Réservez votre cours de kitesurf, wingfoil ou pumpfoil à Hyères. Réponse garantie sous 24h. ☎ 06 72 71 69 05" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Réservation cours kitesurf Hyères - École KiteSurf Passion" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Réservation Kitesurf Hyères" />
        <meta name="twitter:description" content="Réservez votre cours de kitesurf à Hyères. Réponse sous 24h !" />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Contact kitesurf Hyères" />
        
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Contact & Réservation", "item": "https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres" }
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": "https://www.kitesurfpassion.fr/#contact",
          "name": "KiteSurf Passion",
          "description": "École de kitesurf, wingfoil et pumpfoil à Hyères depuis 1999",
          "url": "https://www.kitesurfpassion.fr",
          "image": "https://www.kitesurfpassion.fr/og-image.jpg",
          "priceRange": "€€",
          "telephone": "+33672716905",
          "email": "crosyo69@gmail.com",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "52 Avenue Général de Gaulle",
            "addressLocality": "Carqueiranne",
            "postalCode": "83320",
            "addressRegion": "Var",
            "addressCountry": "FR"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "43.0817",
            "longitude": "6.1366"
          },
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "09:00",
            "closes": "19:00"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+33672716905",
            "contactType": "reservations",
            "availableLanguage": "French"
          }
        })}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
              Contact & Réservation
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Réservez votre cours de kitesurf, wingfoil ou pumpfoil. Réponse garantie sous 24h.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Form */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Formulaire de Réservation
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot field - hidden from users, bots will fill it */}
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        maxLength={50}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        maxLength={50}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        maxLength={255}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        maxLength={20}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Activité souhaitée *
                      </label>
                      <select
                        value={formData.activity}
                        onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="kitesurf">Kitesurf débutant</option>
                        <option value="kitesurf-perf">Kitesurf perfectionnement</option>
                        <option value="wingfoil">Wing Foil</option>
                        <option value="pumpfoil">Pump Foil</option>
                        <option value="downwind">Downwind</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nombre de personnes
                      </label>
                      <select
                        value={formData.people}
                        onChange={(e) => setFormData({ ...formData, people: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="1">1 personne</option>
                        <option value="2">2 personnes</option>
                        <option value="3">3 personnes</option>
                        <option value="4">4 personnes</option>
                        <option value="5+">5+ personnes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Dates souhaitées
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: du 15 au 20 juillet"
                      value={formData.dates}
                      onChange={(e) => setFormData({ ...formData, dates: e.target.value })}
                      maxLength={100}
                      className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Précisez votre niveau, vos attentes, ou toute question..."
                      maxLength={2000}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="sunset"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Envoi en cours..." : (
                      <>
                        Envoyer ma demande
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </Button>

                  <p className="text-muted-foreground text-sm text-center">
                    En soumettant ce formulaire, vous acceptez notre{" "}
                    <a href="/politique-confidentialite" className="text-primary hover:underline">
                      politique de confidentialité
                    </a>.
                  </p>
                </form>
              </div>

              {/* Contact Info */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Nos Coordonnées
                </h2>

                <div className="space-y-6">
                  <a
                    href="tel:0672716905"
                    className="flex items-start gap-4 p-6 bg-card rounded-2xl border border-border/50 hover:border-primary transition-colors"
                  >
                    <div className="w-12 h-12 bg-sunset/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-sunset" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground mb-1">Téléphone</h3>
                      <p className="text-primary font-semibold text-lg">06 72 71 69 05</p>
                      <p className="text-muted-foreground text-sm">Réponse rapide garantie</p>
                    </div>
                  </a>

                  <a
                    href="mailto:crosyo69@gmail.com"
                    className="flex items-start gap-4 p-6 bg-card rounded-2xl border border-border/50 hover:border-primary transition-colors"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground mb-1">Email</h3>
                      <p className="text-primary font-semibold">crosyo69@gmail.com</p>
                      <p className="text-muted-foreground text-sm">Réponse sous 24h</p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4 p-6 bg-card rounded-2xl border border-border/50">
                    <div className="w-12 h-12 bg-turquoise/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-turquoise" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground mb-1">Adresse</h3>
                      <p className="text-foreground">52 Avenue Général de Gaulle</p>
                      <p className="text-foreground">83320 Carqueiranne</p>
                      <p className="text-muted-foreground text-sm mt-1">Spot de l'Almanarre, Hyères</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-card rounded-2xl border border-border/50">
                    <div className="w-12 h-12 bg-ocean-light/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-ocean-light" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground mb-1">Horaires</h3>
                      <p className="text-foreground">Mars à Novembre</p>
                      <p className="text-foreground">9h - 19h tous les jours</p>
                      <p className="text-muted-foreground text-sm mt-1">Selon conditions météo</p>
                    </div>
                  </div>
                </div>

                {/* Google Maps */}
                <div className="mt-8 rounded-2xl overflow-hidden border border-border/50">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2904.8!2d6.13!3d43.08!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDPCsDA0JzU0LjAiTiA2wrAwNyczMy4wIkU!5e0!3m2!1sfr!2sfr!4v1600000000000!5m2!1sfr!2sfr"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localisation KiteSurf Passion - Hyères"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Contact;