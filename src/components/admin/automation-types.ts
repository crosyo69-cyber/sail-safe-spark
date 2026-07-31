import type { SegmentDefinition } from "./segment-types";

export type AutomationTrigger =
  | "credit_expiring"
  | "new_reservation"
  | "first_reservation"
  | "no_booking_since"
  | "birthday"
  | "weather_recredit"
  | "new_package"
  | "weather_exceptional";

export type Automation = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  trigger_type: AutomationTrigger;
  trigger_config: { days?: number } & Record<string, unknown>;
  segment_id: string | null;
  segment_definition: Partial<SegmentDefinition>;
  required_topic: string | null;
  email_subject: string;
  email_html: string;
  email_cta_label: string | null;
  email_cta_url: string | null;
  delay_days: number;
  priority: number;
  dedupe_window_days: number;
  max_recipients: number;
  last_run_at: string | null;
  next_run_at: string;
  created_at: string;
  updated_at: string;
};

export type AutomationRun = {
  id: string;
  automation_id: string;
  mode: "test" | "live";
  status: "success" | "error" | "skipped" | "running";
  recipients_count: number;
  skipped_count: number;
  campaign_id: string | null;
  result: Record<string, unknown>;
  error: string | null;
  triggered_by: string | null;
  started_at: string;
  finished_at: string | null;
};

export const TRIGGER_OPTIONS: {
  value: AutomationTrigger;
  label: string;
  help: string;
  daysLabel?: string;
  defaultDays?: number;
  disabled?: boolean;
}[] = [
  { value: "credit_expiring", label: "Crédit expire dans X jours", help: "Clients dont le prochain crédit expire dans la fenêtre.", daysLabel: "Jours avant expiration", defaultDays: 30 },
  { value: "new_reservation", label: "Nouvelle réservation", help: "Réservation enregistrée dans les X derniers jours.", daysLabel: "Fenêtre (jours)", defaultDays: 1 },
  { value: "first_reservation", label: "Première réservation", help: "Clients à leur toute première réservation.", daysLabel: "Fenêtre (jours)", defaultDays: 7 },
  { value: "no_booking_since", label: "Aucune réservation depuis X jours", help: "Clients dormants ou jamais venus.", daysLabel: "Inactivité (jours)", defaultDays: 180 },
  { value: "birthday", label: "Anniversaire", help: "Date d'anniversaire du jour (+ délai éventuel).", defaultDays: 0 },
  { value: "weather_recredit", label: "Recrédit météo", help: "Crédit remis suite à une annulation météo.", daysLabel: "Fenêtre (jours)", defaultDays: 2 },
  { value: "new_package", label: "Nouveau pack acheté", help: "Pack acheté dans les X derniers jours.", daysLabel: "Fenêtre (jours)", defaultDays: 1 },
  { value: "weather_exceptional", label: "Météo exceptionnelle (à venir)", help: "Intégration future : ne renvoie aucun destinataire pour l'instant.", disabled: true },
];

export const TRIGGER_LABEL: Record<AutomationTrigger, string> = Object.fromEntries(
  TRIGGER_OPTIONS.map((t) => [t.value, t.label]),
) as Record<AutomationTrigger, string>;

export const EMPTY_AUTOMATION: Omit<Automation, "id" | "created_at" | "updated_at" | "last_run_at" | "next_run_at"> = {
  name: "",
  description: "",
  active: false,
  trigger_type: "credit_expiring",
  trigger_config: { days: 30 },
  segment_id: null,
  segment_definition: {},
  required_topic: null,
  email_subject: "",
  email_html: "",
  email_cta_label: null,
  email_cta_url: null,
  delay_days: 0,
  priority: 100,
  dedupe_window_days: 30,
  max_recipients: 500,
};
