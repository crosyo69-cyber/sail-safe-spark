export type SegmentDefinition = {
  activities: string[];
  topics: string[];
  consent: "yes" | "no" | "all";
  levels: string[];
  lifecycle: string[];
  credits: string[];
  last_booking_after?: string | null;
  last_booking_before?: string | null;
  min_bookings?: number | null;
  max_bookings?: number | null;
  not_booked_since_months?: number | null;
  min_revenue?: number | null;
  max_revenue?: number | null;
  min_avg_basket?: number | null;
  min_packages?: number | null;
  departments: string[];
  countries: string[];
  max_distance_km?: number | null;
  include_test?: boolean;
};

export const EMPTY_SEGMENT: SegmentDefinition = {
  activities: [],
  topics: [],
  consent: "yes",
  levels: [],
  lifecycle: [],
  credits: [],
  departments: [],
  countries: [],
};

export const ACTIVITY_OPTIONS = [
  { value: "kitesurf", label: "Kitesurf" },
  { value: "wingfoil", label: "Wingfoil" },
  { value: "pumpfoil", label: "Pumpfoil" },
  { value: "foil_tracte", label: "Foil tracté" },
  { value: "stage_100_glisse", label: "Stage 100 % Glisse" },
];

export const TOPIC_OPTIONS = [
  { value: "weather", label: "Alertes météo" },
  { value: "promotions", label: "Promotions" },
  { value: "news", label: "Nouveautés" },
  { value: "events", label: "Événements" },
];

export const LEVEL_OPTIONS = [
  { value: "debutant", label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "confirme", label: "Confirmé" },
  { value: "expert", label: "Expert" },
];

export const LIFECYCLE_OPTIONS = [
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
  { value: "nouveau", label: "Nouveau (<30 j)" },
  { value: "prospect", label: "Jamais réservé" },
];

export const CREDIT_OPTIONS = [
  { value: "none", label: "0 crédit" },
  { value: "1_3", label: "1 à 3 crédits" },
  { value: "gt3", label: "Plus de 3 crédits" },
  { value: "expiring_30d", label: "Expiration < 30 j" },
];

export type SegmentPreviewRow = {
  email: string;
  first_name: string | null;
  last_name: string | null;
  activities: string[] | null;
  last_date: string | null;
  consent: boolean;
  level: string | null;
};

export type SegmentEstimate = {
  clients: number;
  emails: number;
  sms: number;
  total_base: number;
  percent: number;
  preview: SegmentPreviewRow[];
};

export const segmentSummary = (d: SegmentDefinition): string => {
  const parts: string[] = [];
  if (d.activities.length) parts.push(d.activities.join(", "));
  if (d.topics.length) parts.push(d.topics.join(", "));
  if (d.levels.length) parts.push(d.levels.join(", "));
  if (d.lifecycle.length) parts.push(d.lifecycle.join(", "));
  if (d.credits.length) parts.push(`crédits: ${d.credits.join(", ")}`);
  if (d.departments.length) parts.push(`dép. ${d.departments.join(", ")}`);
  if (d.countries.length) parts.push(d.countries.join(", "));
  parts.push(d.consent === "yes" ? "consentement oui" : d.consent === "no" ? "consentement non" : "tous consentements");
  return parts.join(" · ");
};