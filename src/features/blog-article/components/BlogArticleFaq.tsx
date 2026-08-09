import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FAQItem } from "../types";

export const BlogArticleFaq = ({ faqData }: { faqData: FAQItem[] }) => (
  <div className="max-w-3xl mx-auto mt-12">
    <h2 className="font-display text-2xl font-bold text-foreground mb-6">
      Questions fréquentes
    </h2>
    <Accordion type="single" collapsible className="w-full">
      {faqData.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left text-foreground font-medium">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);
