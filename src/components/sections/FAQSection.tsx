import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Combien de temps pour apprendre le kitesurf à Hyères ?",
    answer: "En moyenne, 5 séances de 3 heures suffisent pour devenir autonome. Notre pédagogie avec bateau d'assistance accélère la progression : vous passez plus de temps à pratiquer qu'à nager pour récupérer votre matériel !",
  },
  {
    question: "Quel est le prix d'un stage de kitesurf débutant ?",
    answer: "Notre stage 100% Glisse (5 jours consécutifs) est à 399€ hors saison (499€ en juillet/août), tout inclus : matériel, combinaison, bateau d'assistance et foil tracté inclus en cas de jour sans vent.",
  },
  {
    question: "Faut-il savoir nager pour faire du kitesurf ?",
    answer: "Oui, il est nécessaire de savoir nager pour pratiquer le kitesurf en toute sécurité. Vous devez être à l'aise dans l'eau et capable de nager 50 mètres. Notre bateau d'assistance vous rassure mais la natation reste indispensable.",
  },
  {
    question: "À partir de quel âge peut-on apprendre ?",
    answer: "Nous acceptons les enfants à partir de 10 ans pour le kitesurf, à condition qu'ils pèsent au moins 35 kg et qu'ils soient motivés. Le wingfoil est accessible dès 8 ans. L'encadrement est adapté à chaque âge.",
  },
  {
    question: "Le kitesurf est-il dangereux ?",
    answer: "Bien encadré, le kitesurf est un sport sûr. Notre école dispose d'un bateau d'assistance permanent, de matériel sécurisé et d'un moniteur diplômé d'État. Le spot de l'Almanarre est idéal car protégé et avec une eau peu profonde.",
  },
  {
    question: "Pourquoi un bateau d'assistance est-il important ?",
    answer: "Le bateau permet de vous récupérer rapidement si vous dérivez, de vous ramener au point de départ, et d'intervenir en cas de problème. C'est un gain de temps énorme pour votre apprentissage et une sécurité maximale.",
  },
  {
    question: "Quelle est la meilleure période pour apprendre à l'Almanarre ?",
    answer: "L'Almanarre bénéficie de vents réguliers de mars à novembre. Le Mistral (nord-ouest) et le Levant (sud-est) offrent d'excellentes conditions. L'été combine eau chaude et vent régulier, idéal pour débuter !",
  },
  {
    question: "Quelle différence entre kitesurf et wingfoil ?",
    answer: "Le kitesurf utilise une aile tractée par des lignes (25m), offrant puissance et sauts. Le wingfoil se pratique avec une aile tenue à la main sur un foil, plus accessible et avec une sensation unique de vol. Les deux se pratiquent à l'Almanarre !",
  },
  {
    question: "Le matériel est-il fourni pendant les cours ?",
    answer: "Oui, tout le matériel est inclus : aile, planche, harnais, combinaison, casque et gilet de flottaison. Nous utilisons du matériel récent et adapté à votre niveau. Vous n'avez rien à apporter !",
  },
  {
    question: "Comment se passe une séance type ?",
    answer: "Une séance dure 3 heures : briefing sécurité et théorie (30 min), échauffement et manipulation de l'aile au sol (30 min), puis pratique dans l'eau avec le bateau d'assistance (2h). Débriefing personnalisé à la fin.",
  },
];

export function FAQSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary font-semibold mb-4">FAQ</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Questions Fréquentes sur nos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">
              Cours de Kitesurf
            </span>{" "}
            à Hyères
          </h2>
          <p className="text-muted-foreground text-lg">
            Tout ce que vous devez savoir avant de vous lancer dans l'aventure kitesurf !
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-2xl border border-border/50 px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-foreground py-6 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
