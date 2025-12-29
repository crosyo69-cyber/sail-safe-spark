import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Ship, Users, Clock, Award } from "lucide-react";
import { Link } from "react-router-dom";
import kitesurfImage from "@/assets/kitesurf-lesson.jpg";

const stages = [
  {
    name: "Stage 100% Glisse",
    sessions: "5 jours consécutifs",
    duration: "Groupe 3-4 personnes",
    price: "399€",
    priceNote: "Hors saison (499€ juil./août)",
    description: "Le stage complet pour devenir autonome. En cas de jours sans vent : planche tractée et foil tracté inclus.",
    features: [
      "5 jours consécutifs de formation",
      "Pilotage aile + waterstart + navigation",
      "Foil tracté inclus (jours sans vent)",
      "Bateau d'assistance permanent",
      "Autonomie garantie",
    ],
    popular: true,
  },
  {
    name: "Stage Semi-Privé",
    sessions: "5 jours",
    duration: "2 personnes / 1 moniteur",
    price: "599€",
    priceNote: "Hors saison (699€ juil./août)",
    description: "Progression accélérée avec seulement 2 élèves par moniteur.",
    features: [
      "2 élèves maximum par moniteur",
      "Attention personnalisée",
      "Progression rapide",
      "Horaires flexibles",
    ],
  },
  {
    name: "Cours Particulier",
    sessions: "2 heures",
    duration: "1 personne / 1 moniteur",
    price: "230€",
    priceNote: "Hors saison (380€ juil./août)",
    description: "Progression maximale avec un moniteur dédié et radios interactives.",
    features: [
      "1 moniteur pour 1 élève",
      "Radios interactives incluses",
      "Programme personnalisé",
      "Horaires au choix",
    ],
  },
];

const programSteps = [
  {
    day: "Jour 1",
    title: "Découverte & Sécurité",
    content: "Présentation du matériel, règles de sécurité, fenêtre de vent. Pilotage de l'aile sur la plage.",
  },
  {
    day: "Jour 2",
    title: "Premiers Pas dans l'Eau",
    content: "Bodydrag, nage tractée par l'aile, gestion de la puissance dans l'eau.",
  },
  {
    day: "Jour 3",
    title: "Waterstart",
    content: "Mise en place de la planche, premiers waterstarts, gestion de l'équilibre.",
  },
  {
    day: "Jour 4",
    title: "Navigation",
    content: "Premiers bords, maintien de la trajectoire, arrêts contrôlés.",
  },
  {
    day: "Jour 5",
    title: "Autonomie",
    content: "Remonter au vent, virages, validation de l'autonomie. Vous êtes prêt à naviguer seul !",
  },
];

const CoursKitesurf = () => {
  return (
    <>
      <Helmet>
        <title>Cours Kitesurf Débutant Hyères | Stage 5 Séances | Bateau Assistance</title>
        <meta
          name="description"
          content="Apprenez le kitesurf à Hyères avec notre stage débutant 5 séances. Bateau d'assistance, moniteur expert, spot Almanarre idéal. Autonomie garantie !"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.com/cours-kitesurf-hyeres-debutant" />
      </Helmet>

      <Header />

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={kitesurfImage}
              alt="Cours de kitesurf à Hyères - élèves en formation"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/90 to-navy/60" />
          </div>

          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-2xl">
              <span className="inline-block text-sunset font-semibold mb-4">Cours Kitesurf</span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
                Apprenez le Kitesurf à Hyères
              </h1>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Stage 100% Glisse sur 5 jours consécutifs avec bateau d'assistance pour une progression rapide et sécurisée sur le spot de l'Almanarre.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="sunset" size="lg" asChild>
                  <a href="#tarifs">
                    Voir les Tarifs
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </Button>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/contact-reservation-kitesurf-hyeres">Réserver</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Avantages */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Ship, title: "Bateau d'Assistance", desc: "Sécurité maximale" },
                { icon: Users, title: "Petits Groupes", desc: "3-4 élèves / moniteur" },
                { icon: Clock, title: "5 Jours Consécutifs", desc: "Stage intensif" },
                { icon: Award, title: "Moniteur Diplômé", desc: "25 ans d'expérience" },
              ].map((item) => (
                <div key={item.title} className="bg-card rounded-2xl p-6 border border-border/50 text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Programme */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Programme du Stage Kitesurf
              </h2>
              <p className="text-muted-foreground text-lg">
                5 séances progressives pour passer de débutant à rider autonome
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {programSteps.map((step, index) => (
                  <div key={step.day} className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      {index < programSteps.length - 1 && (
                        <div className="w-0.5 h-full bg-primary/20 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 bg-card rounded-2xl p-6 border border-border/50">
                      <span className="text-primary font-semibold text-sm">{step.day}</span>
                      <h3 className="font-display font-bold text-foreground text-xl mt-1 mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tarifs */}
        <section id="tarifs" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Tarifs Stage Kitesurf
              </h2>
              <p className="text-muted-foreground text-lg">
                Choisissez la formule adaptée à vos objectifs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {stages.map((stage) => (
                <div
                  key={stage.name}
                  className={`relative bg-card rounded-3xl p-8 border ${
                    stage.popular
                      ? "border-primary shadow-glow"
                      : "border-border/50"
                  }`}
                >
                  {stage.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                      Populaire
                    </div>
                  )}

                  <h3 className="font-display font-bold text-xl text-foreground mb-2">{stage.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{stage.description}</p>

                  <div className="mb-6">
                    <span className="font-display text-4xl font-bold text-foreground">{stage.price}</span>
                    <span className="text-muted-foreground"> / {stage.sessions}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {stage.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-foreground">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={stage.popular ? "sunset" : "outline"}
                    className="w-full"
                    asChild
                  >
                    <Link to="/contact-reservation-kitesurf-hyeres">Réserver</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default CoursKitesurf;
