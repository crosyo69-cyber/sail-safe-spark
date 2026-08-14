import { createApiClient } from "./_shared/api";

const api = createApiClient({ scope: "contact" });

export interface SendContactEmailBody {
  name: string;
  email: string;
  phone: string;
  activity: string;
  honeypot: string;
  formTimestamp: number;
}

/**
 * Edge function `send-contact-email`.
 * ISO-COMPORTEMENT : aucun retry automatique (comme l'appel direct d'origine),
 * aucune clé d'idempotence.
 */
export const contactService = {
  sendContactEmail: (body: SendContactEmailBody) =>
    api.invoke<unknown>("send-contact-email", body, { retries: 1 }),
};

export type ContactService = typeof contactService;
