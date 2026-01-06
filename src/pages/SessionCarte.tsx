import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Ship, Users, Award, Clock, CheckCircle, Calendar, Settings, Repeat } from "lucide-react";
import kitesurfLesson from "@/assets/kitesurf-cours-hyeres.jpg";
import heroSessionCarte from "@/assets/hero-session-carte.jpg";

const breadcrumbItems = [
  { label: "Kitesurf", href: "/cours-kitesurf-hyeres-debutant" },
  { label: "Sessions à la Carte" }
];

const SessionCarte = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Session Kitesurf à la Carte",
    "description": "Sessions de kitesurf personnalisables à Hyères. Flexibilité des créneaux, progression ciblée selon votre niveau.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "KiteSurf Passion",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Hyères",
        "addressRegion": "Var",
        "addressCountry": "FR"
      }
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "120",
      "highPrice": "660",
      "priceCurrency": "EUR",
      "offerCount": 6,
      "availability": "https://schema.org/InStock"
    }
  };

  const sessionFormats = [
    {
      name: "1 Session",
      priceOffSeason: "120€",
      priceHighSeason: "130€",
      description: "Session unique pour découvrir ou progresser ponctuellement."
    },
    {
      name: "3 Sessions",
      priceOffSeason: "330€",
      priceHighSeason: "360€",
      description: "Pack idéal pour consolider les acquis.",
      popular: true
    },
    {
      name: "5 Sessions",
      priceOffSeason: "500€",
      priceHighSeason: "570€",
      description: "Pack complet pour une progression optimale."
    }
  ];

  const advantages = [
    { icon: Settings, title: "Flexibilité", desc: "Choisissez vos créneaux" },
    { icon: Repeat, title: "Progression Ciblée", desc: "Travail sur vos objectifs" },
    { icon: Users, title: "Petits Groupes", desc: "4 élèves maximum" },
    { icon: Ship, title: "Bateau d'Assistance", desc: "Sécurité permanente" },
  ];

  const whyChoose = [
    {
      title: "Emploi du temps flexible",
      description: "Pas de contrainte de jours consécutifs. Réservez selon vos disponibilités et les conditions météo."
    },
    {
      title: "Progression adaptée",
      description: "Chaque session est adaptée à votre niveau et vos objectifs. Travaillez précisément ce dont vous avez besoin."
    },
    {
      title: "Idéal pour les locaux",
      description: "Parfait si vous habitez dans la région et souhaitez progresser à votre rythme sur plusieurs semaines."
    },
    {
      title: "Complément de stage",
      description: "Après un stage, consolidez vos acquis avec des sessions supplémentaires ciblées."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Session Kitesurf à la Carte Hyères | Cours Flexibles Almanarre</title>
        <meta
          name="description"
          content="Sessions kitesurf à la carte à Hyères. Flexibilité totale, progression ciblée selon votre niveau. Séances individuelles ou en pack. Dès 120€."
        />
        <link rel="canonical" href="https://www.kitesurfpassion.com/session-kitesurf-carte-hyeres" />
        <meta property="og:title" content="Session Kitesurf à la Carte | KiteSurf Passion Hyères" />
        <meta property="og:description" content="Cours de kitesurf flexibles à Hyères. Choisissez vos créneaux et progressez selon vos objectifs." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroSessionCarte}
              alt="Session kitesurf à la carte Hyères Almanarre - Perfectionnement école KiteSurf Passion Var"
              loading="eager"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-navy/75 via-navy/45 to-navy/25" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-medium mb-6">
                <Settings className="w-4 h-4" />
                Flexibilité Maximale
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6">
                Session Kitesurf <span className="text-primary">à la Carte</span> à Hyères
              </h1>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Des sessions personnalisables selon votre niveau et vos disponibilités. Progressez à votre rythme avec un encadrement professionnel sur le spot de l'Almanarre.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="sunset" size="lg" asChild>
                  <Link to="/contact-reservation-kitesurf-hyeres">Réserver une session</Link>
                </Button>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">Voir tous les tarifs</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Advantages Grid */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {advantages.map((item) => (
                <div key={item.title} className="bg-card rounded-2xl p-6 border border-border/50 text-center hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-turquoise/20 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  Tarifs Sessions à la Carte
                </h2>
                <p className="text-muted-foreground">
                  Tout le matériel et le bateau d'assistance sont inclus.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {sessionFormats.map((session, index) => (
                  <div 
                    key={session.name}
                    className={`bg-card rounded-2xl p-8 border-2 transition-all ${
                      session.popular 
                        ? 'border-primary shadow-lg shadow-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {session.popular && (
                      <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full mb-4">
                        Populaire
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-foreground mb-2">{session.name}</h3>
                    <p className="text-muted-foreground text-sm mb-6">{session.description}</p>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground text-sm">Hors saison</span>
                        <span className="text-xl font-bold text-foreground">{session.priceOffSeason}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-sunset/10 rounded-lg">
                        <span className="text-sunset text-sm">Juillet/Août</span>
                        <span className="text-xl font-bold text-foreground">{session.priceHighSeason}</span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Matériel fourni
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Bateau d'assistance
                      </li>
                    </ul>

                    <Button variant={session.popular ? "sunset" : "outline"} className="w-full" asChild>
                      <Link to="/contact-reservation-kitesurf-hyeres">Réserver</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  Pourquoi Choisir les Sessions à la Carte ?
                </h2>
                <div className="space-y-6">
                  {whyChoose.map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-1">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <img 
                  src={kitesurfLesson} 
                  alt="Kitesurf session perfectionnement Hyères - Cours individuel école KiteSurf Passion Almanarre" 
                  loading="lazy"
                  decoding="async"
                  className="rounded-2xl shadow-2xl w-full aspect-[4/3] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Who Is It For Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                Pour Qui Sont Ces Sessions ?
              </h2>
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-turquoise/20 rounded-xl flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Emploi du temps chargé</h3>
                  <p className="text-muted-foreground text-sm">
                    Vous ne pouvez pas vous libérer 5 jours consécutifs mais souhaitez apprendre le kite.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-turquoise/20 rounded-xl flex items-center justify-center">
                    <Award className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Perfectionnement</h3>
                  <p className="text-muted-foreground text-sm">
                    Vous avez déjà les bases et souhaitez travailler des points spécifiques.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-turquoise/20 rounded-xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Locaux</h3>
                  <p className="text-muted-foreground text-sm">
                    Vous habitez la région et préférez étaler votre apprentissage sur plusieurs semaines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Offers Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                Autres Formules Kitesurf
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link 
                to="/stage-kitesurf-100-glisse-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stage 100% Glisse</h3>
                <p className="text-muted-foreground text-sm mb-3">5 jours consécutifs pour l'autonomie</p>
                <span className="text-primary text-sm font-medium">Dès 399€ →</span>
              </Link>
              <Link 
                to="/cours-particulier-kitesurf-hyeres"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Cours Particulier</h3>
                <p className="text-muted-foreground text-sm mb-3">Moniteur 100% dédié</p>
                <span className="text-primary text-sm font-medium">Dès 230€ →</span>
              </Link>
              <Link 
                to="/stage-wingfoil-hyeres-almanarre"
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Stage Wing Foil</h3>
                <p className="text-muted-foreground text-sm mb-3">Découvrez le vol sur l'eau</p>
                <span className="text-primary text-sm font-medium">Dès 90€ →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-navy via-navy to-primary/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
              Prêt à Réserver Votre Session ?
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
              Contactez-nous pour planifier vos sessions selon vos disponibilités et les conditions météo.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="sunset" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">Réserver maintenant</Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <a href="tel:0672716905">06 72 71 69 05</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SessionCarte;
