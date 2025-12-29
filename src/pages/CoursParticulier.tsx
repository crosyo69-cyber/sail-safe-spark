import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Ship, Star, Award, Clock, CheckCircle, Target, Zap, Shield, User } from "lucide-react";
import kitesurfLesson from "@/assets/kitesurf-lesson.jpg";
import heroKitesurf from "@/assets/hero-kitesurf.jpg";

const CoursParticulier = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Cours Particulier Kitesurf",
    "description": "Cours de kitesurf 100% individualisé à Hyères. Progression rapide et sécurisée avec un moniteur diplômé dédié.",
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
    "offers": [
      {
        "@type": "Offer",
        "name": "Cours Particulier 2h - Hors saison",
        "price": "230",
        "priceCurrency": "EUR"
      },
      {
        "@type": "Offer",
        "name": "Cours Particulier 2h - Juillet/Août",
        "price": "380",
        "priceCurrency": "EUR"
      }
    ]
  };

  const advantages = [
    { icon: User, title: "100% Dédié", desc: "Attention exclusive du moniteur" },
    { icon: Target, title: "Progression Rapide", desc: "Objectifs personnalisés" },
    { icon: Ship, title: "Bateau d'Assistance", desc: "Sécurité maximale" },
    { icon: Award, title: "Moniteur Expert", desc: "25 ans d'expérience" },
  ];

  const benefits = [
    {
      title: "Progression 3x plus rapide",
      description: "Avec toute l'attention du moniteur, vous progressez bien plus vite qu'en groupe. Chaque minute est optimisée pour votre apprentissage."
    },
    {
      title: "Programme sur mesure",
      description: "Le contenu de chaque cours est adapté à vos objectifs, votre niveau et votre rythme d'apprentissage."
    },
    {
      title: "Corrections en temps réel",
      description: "Le moniteur vous observe en permanence et peut corriger immédiatement vos gestes pour éviter les mauvaises habitudes."
    },
    {
      title: "Flexibilité totale",
      description: "Choisissez vos créneaux horaires. Les cours sont planifiés selon vos disponibilités et les conditions météo optimales."
    }
  ];

  const forWhom = [
    {
      title: "Débutants pressés",
      description: "Vous voulez apprendre rapidement et efficacement, sans contrainte de groupe."
    },
    {
      title: "Perfectionnement",
      description: "Vous avez les bases et souhaitez travailler des techniques spécifiques avec un expert."
    },
    {
      title: "Appréhensions",
      description: "Vous préférez un cadre rassurant et personnalisé pour débuter en toute confiance."
    },
    {
      title: "Emploi du temps serré",
      description: "Vous avez peu de temps et voulez maximiser chaque minute sur l'eau."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Cours Particulier Kitesurf à Hyères | Leçon Privée Almanarre</title>
        <meta
          name="description"
          content="Cours particulier kitesurf à Hyères. Progression 100% individualisée avec moniteur diplômé. Bateau d'assistance, encadrement premium. À partir de 230€."
        />
        <link rel="canonical" href="https://www.kitesurfpassion.com/cours-particulier-kitesurf-hyeres" />
        <meta property="og:title" content="Cours Particulier Kitesurf | KiteSurf Passion Hyères" />
        <meta property="og:description" content="Leçon privée de kitesurf avec moniteur dédié. Progression rapide et sécurisée sur le spot de l'Almanarre." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Header />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroKitesurf})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/60" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sunset/20 text-sunset border border-sunset/30 text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                Encadrement Premium
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6">
                Cours Particulier <span className="text-sunset">Kitesurf</span> à Hyères
              </h1>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Bénéficiez d'un cours 100% individualisé avec un moniteur diplômé entièrement dédié à votre progression. L'approche la plus efficace pour apprendre le kitesurf.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="sunset" size="lg" asChild>
                  <Link to="/contact-reservation-kitesurf-hyeres">Réserver mon cours</Link>
                </Button>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">Voir les tarifs</Link>
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
                <div key={item.title} className="bg-card rounded-2xl p-6 border border-border/50 text-center hover:border-sunset/50 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-sunset/20 to-sunset/10 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-sunset" />
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
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  Tarifs Cours Particulier
                </h2>
                <p className="text-muted-foreground">
                  Séance de 2 heures avec moniteur diplômé dédié.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-8 hover:border-sunset/50 transition-colors">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                    Hors saison
                  </span>
                  <div className="mb-4">
                    <span className="text-4xl font-display font-bold text-foreground">230€</span>
                    <span className="text-muted-foreground ml-2">/ 2 heures</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Moniteur 100% dédié
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Matériel complet fourni
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Bateau d'assistance
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Assurance incluse
                    </li>
                  </ul>
                  <Button variant="sunset" className="w-full" asChild>
                    <Link to="/contact-reservation-kitesurf-hyeres">Réserver</Link>
                  </Button>
                </div>

                <div className="bg-card border-2 border-sunset rounded-2xl p-8 relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-sunset text-white text-sm font-medium rounded-full">
                    Haute saison
                  </span>
                  <span className="inline-block px-3 py-1 bg-sunset/10 text-sunset text-sm font-medium rounded-full mb-4">
                    Juillet / Août
                  </span>
                  <div className="mb-4">
                    <span className="text-4xl font-display font-bold text-foreground">380€</span>
                    <span className="text-muted-foreground ml-2">/ 2 heures</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-sunset" />
                      Moniteur 100% dédié
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-sunset" />
                      Matériel complet fourni
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-sunset" />
                      Bateau d'assistance
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-sunset" />
                      Assurance incluse
                    </li>
                  </ul>
                  <Button variant="sunset" className="w-full" asChild>
                    <Link to="/contact-reservation-kitesurf-hyeres">Réserver</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <img 
                  src={kitesurfLesson} 
                  alt="Cours particulier kitesurf avec moniteur à Hyères" 
                  className="rounded-2xl shadow-2xl w-full aspect-[4/3] object-cover"
                />
              </div>
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sunset/10 text-sunset text-sm font-medium mb-4">
                  <Zap className="w-4 h-4" />
                  Avantages Premium
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  Pourquoi Choisir un Cours Particulier ?
                </h2>
                <div className="space-y-6">
                  {benefits.map((benefit) => (
                    <div key={benefit.title} className="flex gap-4">
                      <div className="w-8 h-8 bg-sunset/10 rounded-lg flex items-center justify-center shrink-0 mt-1">
                        <CheckCircle className="w-5 h-5 text-sunset" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-1">{benefit.title}</h3>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Whom Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Pour Qui ?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Le cours particulier s'adapte à tous les profils et tous les niveaux.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {forWhom.map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-2xl p-6 hover:border-sunset/50 transition-colors">
                  <div className="w-12 h-12 mb-4 bg-gradient-to-br from-sunset/20 to-sunset/10 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-sunset" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instructor Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-turquoise/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Award className="w-4 h-4" />
                Votre Moniteur
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                Yohan Cros, 25 Ans d'Expérience
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Moniteur diplômé d'État BPJEPS et formateur de moniteurs, Yohan vous transmet sa passion et son expertise. Sa parfaite connaissance du spot de l'Almanarre garantit des conditions d'apprentissage optimales.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">BPJEPS</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                  <Star className="w-5 h-5 text-sunset" />
                  <span className="text-sm font-medium">Formateur de moniteurs</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">25+ ans</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-navy via-navy to-sunset/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
              Prêt pour Votre Cours Privé ?
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
              Offrez-vous une expérience d'apprentissage premium avec un moniteur dédié à 100% à votre progression.
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

export default CoursParticulier;
