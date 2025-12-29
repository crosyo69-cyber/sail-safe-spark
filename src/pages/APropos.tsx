import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Award, Ship, Heart, Users, Calendar, MapPin, Shield, Sparkles } from "lucide-react";
import kitesurfLesson from "@/assets/kitesurf-lesson.jpg";
import bateauSecurite from "@/assets/bateau-securite-hyeres.jpg";
import almanarreSunset from "@/assets/almanarre-sunset.jpg";
import { useEffect, useRef, useState } from "react";
import { useParallax } from "@/hooks/use-parallax";

const breadcrumbItems = [
  { label: "À Propos" }
];

const APropos = () => {
  const [visibleMilestones, setVisibleMilestones] = useState<number[]>([]);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const milestoneRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Parallax refs for images
  const founderImageRef = useRef<HTMLDivElement>(null);
  const securityImageRef = useRef<HTMLDivElement>(null);
  const spotImageRef = useRef<HTMLDivElement>(null);
  
  const founderParallax = useParallax(founderImageRef, 0.15);
  const securityParallax = useParallax(securityImageRef, 0.15);
  const spotParallax = useParallax(spotImageRef, 0.15);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -10% 0px',
      threshold: 0.3
    };

    const milestoneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = parseInt(entry.target.getAttribute('data-index') || '0');
        if (entry.isIntersecting) {
          setVisibleMilestones(prev => [...new Set([...prev, index])]);
        }
      });
    }, observerOptions);

    milestoneRefs.current.forEach((ref) => {
      if (ref) milestoneObserver.observe(ref);
    });

    const handleScroll = () => {
      if (!timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const timelineTop = rect.top;
      const timelineHeight = rect.height;
      
      // Calculate progress based on how much of the timeline is above the viewport center
      const scrolledPast = windowHeight / 2 - timelineTop;
      const progress = Math.max(0, Math.min(1, scrolledPast / timelineHeight));
      setTimelineProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      milestoneObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "KiteSurf Passion",
      "description": "École de kitesurf, wingfoil et pumpfoil à Hyères depuis 1999. Fondée par Yohan Cros, moniteur diplômé d'État BPJEPS et formateur de moniteurs.",
      "foundingDate": "1999",
      "founder": {
        "@type": "Person",
        "name": "Yohan Cros",
        "jobTitle": "Moniteur diplômé d'État BPJEPS, Formateur de moniteurs",
        "description": "Plus de 25 ans d'expérience dans l'enseignement des sports de glisse nautiques"
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "52 Avenue Général de Gaulle",
        "addressLocality": "Carqueiranne",
        "postalCode": "83320",
        "addressCountry": "FR"
      },
      "telephone": "+33672716905",
      "email": "contact@kitesurfpassion.com"
    }
  };

  const personStructuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Yohan Cros",
    "jobTitle": "Moniteur diplômé d'État BPJEPS",
    "worksFor": {
      "@type": "LocalBusiness",
      "name": "KiteSurf Passion"
    },
    "description": "Fondateur de KiteSurf Passion, moniteur diplômé d'État et formateur de moniteurs avec plus de 25 ans d'expérience dans l'enseignement du kitesurf, wingfoil et pumpfoil à Hyères.",
    "knowsAbout": ["Kitesurf", "Wing Foil", "Pump Foil", "Sports nautiques", "Sécurité en mer"]
  };

  const values = [
    {
      icon: Shield,
      title: "Sécurité Maximale",
      description: "Bateau d'assistance systématique, matériel vérifié quotidiennement et protocoles de sécurité stricts pour une pratique sereine."
    },
    {
      icon: Award,
      title: "Excellence Pédagogique",
      description: "Méthodes d'enseignement éprouvées depuis 25 ans, adaptées à chaque élève pour une progression optimale."
    },
    {
      icon: Heart,
      title: "Passion Partagée",
      description: "Transmettre notre amour des sports de glisse et faire découvrir les sensations uniques de liberté sur l'eau."
    },
    {
      icon: Users,
      title: "Accompagnement Personnalisé",
      description: "Petits groupes de 3-4 élèves maximum pour un suivi individualisé et une attention particulière à chacun."
    }
  ];

  const milestones = [
    { year: "1999", title: "Création de l'école", description: "Yohan Cros fonde KiteSurf Passion sur le spot de l'Almanarre et acquiert son premier bateau d'assistance." },
    { year: "2001", title: "Reconnaissance professionnelle", description: "Obtention du BPJEPS et développement de l'école avec une clientèle fidèle." },
    { year: "2006", title: "1 000 élèves formés", description: "Cap symbolique franchi, témoignant de la confiance accordée par les passionnés de glisse." },
    { year: "2010", title: "Formateur de moniteurs", description: "Yohan devient formateur officiel pour les futurs moniteurs." },
    { year: "2018", title: "Wingfoil", description: "Introduction du wingfoil, nouvelle discipline en plein essor." },
    { year: "2024", title: "Pumpfoil & 25 ans", description: "Arrivée du pumpfoil et célébration d'un quart de siècle dédié à la passion des sports de glisse. Plus de 2 500 élèves formés." }
  ];

  return (
    <>
      <Helmet>
        <title>À Propos - KiteSurf Passion | École depuis 1999 à Hyères</title>
        <meta 
          name="description" 
          content="Découvrez l'histoire de KiteSurf Passion, fondée en 1999 par Yohan Cros, moniteur diplômé d'État BPJEPS. 25 ans d'expertise en kitesurf, wingfoil et pumpfoil à Hyères." 
        />
        <link rel="canonical" href="https://www.kitesurfpassion.com/a-propos-ecole-kitesurf-hyeres" />
        <meta property="og:title" content="À Propos - KiteSurf Passion | École depuis 1999" />
        <meta property="og:description" content="25 ans d'expérience dans l'enseignement des sports de glisse à Hyères. Découvrez notre histoire et nos valeurs." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(personStructuredData)}
        </script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-navy via-navy/95 to-primary/20 overflow-hidden">
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-medium mb-6">
                <Calendar className="w-4 h-4" />
                Depuis 1999
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6">
                Notre Histoire,<br />
                <span className="bg-gradient-to-r from-primary to-turquoise bg-clip-text text-transparent">
                  Notre Passion
                </span>
              </h1>
              <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto">
                Depuis plus de 25 ans, KiteSurf Passion accompagne les passionnés de glisse sur le magnifique spot de l'Almanarre à Hyères.
              </p>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sunset/10 text-sunset text-sm font-medium mb-4">
                  <Award className="w-4 h-4" />
                  Moniteur Diplômé d'État
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  Yohan Cros
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Passionné de sports nautiques depuis son plus jeune âge, <strong className="text-foreground">Yohan Cros</strong> a découvert le kitesurf dès ses débuts en France à la fin des années 90. Convaincu du potentiel de cette discipline révolutionnaire, il fonde <strong className="text-foreground">KiteSurf Passion</strong> en 1999 sur le spot de l'Almanarre.
                  </p>
                  <p>
                    Titulaire du <strong className="text-foreground">BPJEPS</strong> (Brevet Professionnel de la Jeunesse, de l'Éducation Populaire et du Sport), Yohan est également <strong className="text-foreground">formateur de moniteurs</strong>. Cette double casquette lui confère une expertise pédagogique unique, qu'il met au service de tous ses élèves.
                  </p>
                  <p>
                    Avec plus de <strong className="text-foreground">25 ans d'expérience</strong>, Yohan a formé plus de <strong className="text-foreground">2 500 élèves</strong> et continue de transmettre sa passion avec le même enthousiasme qu'au premier jour. Sa connaissance parfaite du spot de l'Almanarre et des conditions météorologiques locales garantit des sessions optimales en toute sécurité.
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">BPJEPS</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Formateur de moniteurs</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">25+ ans d'expérience</span>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative overflow-hidden rounded-2xl" ref={founderImageRef}>
                  <img 
                    src={kitesurfLesson} 
                    alt="Yohan Cros, moniteur de kitesurf diplômé d'État à Hyères" 
                    className="shadow-2xl w-full aspect-[4/3] object-cover transition-transform duration-100 will-change-transform"
                    style={{ transform: `translateY(${founderParallax}px) scale(1.1)` }}
                  />
                  <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-xl z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-turquoise rounded-full flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">+2 500</p>
                        <p className="text-sm text-muted-foreground">Élèves formés</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* History Timeline */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                25 Ans d'Histoire
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                De la création de l'école aux nouvelles disciplines, découvrez les moments clés de notre aventure.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative" ref={timelineRef}>
                {/* Timeline line background */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border transform md:-translate-x-1/2" />
                
                {/* Timeline line progress */}
                <div 
                  className="absolute left-4 md:left-1/2 top-0 w-0.5 bg-gradient-to-b from-primary via-turquoise to-sunset transform md:-translate-x-1/2 transition-all duration-300 ease-out"
                  style={{ height: `${timelineProgress * 100}%` }}
                />
                
                {milestones.map((milestone, index) => {
                  const isVisible = visibleMilestones.includes(index);
                  
                  return (
                    <div 
                      key={milestone.year}
                      ref={(el) => (milestoneRefs.current[index] = el)}
                      data-index={index}
                      className={`relative flex items-center gap-8 mb-12 ${
                        index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                      }`}
                    >
                      <div className={`hidden md:block flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                        <div 
                          className={`bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-700 ease-out ${
                            isVisible 
                              ? 'opacity-100 translate-x-0' 
                              : index % 2 === 0 
                                ? 'opacity-0 -translate-x-8' 
                                : 'opacity-0 translate-x-8'
                          }`}
                        >
                          <span className="text-2xl font-display font-bold text-primary">{milestone.year}</span>
                          <h3 className="text-lg font-bold text-foreground mt-2">{milestone.title}</h3>
                          <p className="text-muted-foreground mt-1">{milestone.description}</p>
                        </div>
                      </div>
                      
                      {/* Timeline dot */}
                      <div 
                        className={`absolute left-4 md:left-1/2 w-4 h-4 rounded-full transform md:-translate-x-1/2 ring-4 ring-background transition-all duration-500 ${
                          isVisible 
                            ? 'bg-primary scale-100' 
                            : 'bg-border scale-75'
                        }`}
                      />
                      
                      {/* Mobile card */}
                      <div className="md:hidden ml-12 flex-1">
                        <div 
                          className={`bg-card border border-border rounded-xl p-6 shadow-lg transition-all duration-700 ease-out ${
                            isVisible 
                              ? 'opacity-100 translate-x-0' 
                              : 'opacity-0 translate-x-8'
                          }`}
                        >
                          <span className="text-2xl font-display font-bold text-primary">{milestone.year}</span>
                          <h3 className="text-lg font-bold text-foreground mt-2">{milestone.title}</h3>
                          <p className="text-muted-foreground mt-1">{milestone.description}</p>
                        </div>
                      </div>
                      
                      <div className="hidden md:block flex-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Nos Valeurs
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Des principes qui guident notre enseignement depuis 25 ans.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <div 
                  key={value.title}
                  className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-turquoise/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <value.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-turquoise/10">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="overflow-hidden rounded-2xl" ref={securityImageRef}>
                <img 
                  src={bateauSecurite} 
                  alt="Bateau d'assistance sécurité kitesurf Hyères" 
                  className="shadow-2xl w-full aspect-[4/3] object-cover transition-transform duration-100 will-change-transform"
                  style={{ transform: `translateY(${securityParallax}px) scale(1.1)` }}
                />
              </div>
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Ship className="w-4 h-4" />
                  Sécurité Maximale
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  Une École <span className="text-primary">Itinérante</span> avec Bateau d'Assistance
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Notre approche unique d'<strong className="text-foreground">école itinérante</strong> nous permet de nous adapter aux conditions météorologiques en nous déplaçant sur les meilleurs spots de la presqu'île de Giens.
                  </p>
                  <p>
                    Le <strong className="text-foreground">bateau d'assistance</strong> nous accompagne systématiquement sur l'eau, garantissant une intervention rapide en cas de besoin et permettant une récupération efficace des élèves.
                  </p>
                  <p>
                    Cette combinaison mobilité + sécurité assure des conditions d'apprentissage optimales, quelle que soit la direction du vent.
                  </p>
                </div>
                <div className="mt-8">
                  <Button variant="sunset" size="lg" asChild>
                    <Link to="/contact-reservation-kitesurf-hyeres">
                      Réserver votre cours
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-turquoise/10 text-turquoise text-sm font-medium mb-4">
                  <MapPin className="w-4 h-4" />
                  Notre Spot
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                  L'Almanarre, un Spot d'Exception
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Situé sur la <strong className="text-foreground">presqu'île de Giens</strong>, le spot de l'Almanarre est reconnu comme l'un des meilleurs spots de kitesurf du Var et de la Méditerranée.
                  </p>
                  <p>
                    Ses eaux peu profondes et ses conditions de vent régulières (Mistral et vent d'Est) en font un lieu idéal pour l'apprentissage comme pour la pratique confirmée.
                  </p>
                  <p>
                    À quelques minutes d'Hyères, ce spot bénéficie d'un cadre naturel préservé offrant des paysages à couper le souffle.
                  </p>
                </div>
                <div className="mt-8">
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/spot-kitesurf-almanarre-hyeres-var">
                      Découvrir le spot
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="overflow-hidden rounded-2xl" ref={spotImageRef}>
                  <img 
                    src={almanarreSunset} 
                    alt="Coucher de soleil sur le spot de l'Almanarre à Hyères" 
                    className="shadow-2xl w-full aspect-[4/3] object-cover transition-transform duration-100 will-change-transform"
                    style={{ transform: `translateY(${spotParallax}px) scale(1.1)` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-navy via-navy to-primary/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
              Prêt à Vivre l'Aventure ?
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
              Rejoignez KiteSurf Passion et découvrez les sensations uniques des sports de glisse avec un moniteur passionné et expérimenté.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="sunset" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  Réserver un cours
                </Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">
                  Voir les tarifs
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default APropos;
