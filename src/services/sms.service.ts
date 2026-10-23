import { createApiClient } from "./_shared/api";
import type { Result } from "./_shared/result";

const api = createApiClient({ scope: "sms" });

export interface AppointmentSmsRecipient {
  /** "visitor" = réservation à la carte, "package" = inscription forfait. */
  kind: "visitor" | "package";
  /** Identifiant de la réservation / inscription, revérifié côté serveur. */
  bookingId: string;
  name: string;
  phone: string;
}

export interface AppointmentSmsRequest {
  date: string;
  activity: string | null;
  groupId: string | null;
  /** Obligatoires et validés côté serveur, indépendamment du message éditable. */
  spot: string;
  horaire: string;
  message: string;
  resend: boolean;
  recipients: AppointmentSmsRecipient[];
}

export interface AppointmentSmsResultItem {
  name: string;
  phone_last4: string;
  status: "sent" | "failed" | "unknown" | "duplicate" | "ineligible" | string;
  messageId?: string;
  error?: string;
}

export interface AppointmentSmsResponse {
  results: AppointmentSmsResultItem[];
  sent: number;
  skipped: number;
  failed: number;
  /** Destinataires exclus car réservation non confirmée ou introuvable. */
  ineligible?: number;
}

export const smsService = {
  /**
   * Fonction serveur `send-appointment-sms` (admin uniquement).
   * retries: 1 et sans clé d'idempotence côté client : la protection
   * anti-doublon est assurée en base (dedupe_key), jamais par une relance.
   */
  sendAppointmentSms: (body: AppointmentSmsRequest): Promise<Result<AppointmentSmsResponse>> =>
    api.invoke("send-appointment-sms", body, { retries: 1 }),
};

export type SmsService = typeof smsService;
