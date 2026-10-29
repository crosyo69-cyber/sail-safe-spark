import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const WHATSAPP_URL =
  "https://wa.me/33672716905?text=" +
  encodeURIComponent("Bonjour, je souhaite des informations sur vos cours de kitesurf");

/** Floating "Écrire sur WhatsApp" link, stacked above the chatbot button. */
export function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Écrire sur WhatsApp"
      title="Écrire sur WhatsApp"
      onClick={() => trackEvent("whatsapp_click", { location: "floating_button" })}
      className="fixed bottom-[10.5rem] md:bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sunset-strong text-primary-foreground shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}
