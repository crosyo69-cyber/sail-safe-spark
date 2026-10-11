import { FfvlLicenceNotice } from "@/components/FfvlLicenceNotice";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  question: string;
  answer: string;
}

interface ActivityFAQProps {
  title: string;
  subtitle: string;
  faqs: FAQ[];
  accentColor?: "primary" | "sunset" | "ocean";
  ffvlLicence?: boolean;
}

export function ActivityFAQ({ title, subtitle, faqs, accentColor = "primary", ffvlLicence = false }: ActivityFAQProps) {
  const gradientClass = accentColor === "sunset" 
    ? "from-sunset to-sunset-light" 
    : accentColor === "ocean" 
    ? "from-ocean to-turquoise" 
    : "from-primary to-turquoise";

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block text-primary font-semibold mb-4">FAQ</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${gradientClass}`}>
              {title.split(" ").slice(-1)}
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        </div>

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
                  {ffvlLicence && faq.question.toLowerCase().includes("licence ffvl") ? <FfvlLicenceNotice /> : faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
            {ffvlLicence && !faqs.some((faq) => faq.question.toLowerCase().includes("licence ffvl")) && (
              <AccordionItem value="ffvl-licence" className="bg-card rounded-2xl border border-border/50 px-6 shadow-sm">
                <AccordionTrigger className="text-left font-display font-semibold text-foreground py-6 hover:no-underline">
                  La licence FFVL est-elle incluse dans le tarif ?
                </AccordionTrigger>
                <AccordionContent className="pb-6"><FfvlLicenceNotice /></AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
