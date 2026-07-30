export type CampaignStatus = "draft" | "ready" | "scheduled" | "sent" | "archived";

export type CampaignAudience = {
  activities: string[];
  lifecycle: string[];
  with_credits: boolean;
  expiring_30d: boolean;
  marketing_consent_only: boolean;
};

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  content_html: string;
  hero_image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  status: CampaignStatus;
  scheduled_at: string | null;
  audience: CampaignAudience;
  recipients_count: number;
  created_by_email: string | null;
  updated_by_email: string | null;
  created_at: string;
  updated_at: string;
};

export const EMPTY_AUDIENCE: CampaignAudience = {
  activities: [],
  lifecycle: [],
  with_credits: false,
  expiring_30d: false,
  marketing_consent_only: true,
};

export const STATUS_META: Record<CampaignStatus, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  ready: { label: "Prête", className: "bg-sky-500/15 text-sky-700 dark:text-sky-400" },
  scheduled: { label: "Planifiée", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  sent: { label: "Envoyée", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  archived: { label: "Archivée", className: "bg-foreground/10 text-muted-foreground" },
};

export const ACTIVITY_OPTIONS: { value: string; label: string }[] = [
  { value: "kitesurf", label: "Kitesurf" },
  { value: "wingfoil", label: "Wingfoil" },
  { value: "pumpfoil", label: "Pumpfoil" },
  { value: "foil_tracte", label: "Foil tracté" },
  { value: "stage_100_glisse", label: "Stage 100 % Glisse" },
];

export const audienceSummary = (a: CampaignAudience): string => {
  const parts: string[] = [];
  if (a.activities.length === 0) parts.push("Tous les clients");
  else parts.push(a.activities.map((v) => ACTIVITY_OPTIONS.find((o) => o.value === v)?.label ?? v).join(", "));
  if (a.lifecycle.includes("active")) parts.push("actifs");
  if (a.lifecycle.includes("inactive")) parts.push("inactifs");
  if (a.with_credits) parts.push("avec crédits");
  if (a.expiring_30d) parts.push("expirent < 30 j");
  if (a.marketing_consent_only) parts.push("opt-in");
  return parts.join(" · ");
};