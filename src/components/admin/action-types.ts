// Types de l'Assistant Opérationnel (ÉTAPE IA 3).
// Toute la logique métier vit dans assistant_prepare_action() côté base.

export type PreparedActionType =
  | "campagne_brevo"
  | "relance_credits"
  | "relance_inactifs"
  | "campagne_meteo"
  | "promo_stage"
  | "derniere_minute"
  | "export_csv"
  | "rapport_pdf";

export type PreparedActionStatus = "prepared" | "validated" | "cancelled" | "expired";

export type PreparedActionPayload = {
  subject?: string | null;
  preheader?: string | null;
  text?: string | null;
  html?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  activity?: string | null;
  params?: Record<string, unknown>;
};

export type PreparedAction = {
  id: string;
  action_type: PreparedActionType;
  priority: string;
  title: string;
  justification: string;
  status: PreparedActionStatus;
  source: string | null;
  payload: PreparedActionPayload;
  segment_definition: Record<string, unknown>;
  segment_summary: string | null;
  recipients_count: number;
  recipients_preview: { email?: string; first_name?: string | null; last_name?: string | null }[];
  result: Record<string, unknown>;
  prepared_by_email: string | null;
  decided_by_email: string | null;
  decided_at: string | null;
  expires_at: string;
  created_at: string;
};

export const ACTION_META: Record<PreparedActionType, { label: string; emoji: string; hint: string }> = {
  campagne_brevo: { label: "Campagne Brevo", emoji: "📣", hint: "Campagne marketing générale" },
  relance_credits: { label: "Relance crédits", emoji: "⏳", hint: "Crédits qui expirent bientôt" },
  relance_inactifs: { label: "Relance inactifs", emoji: "💤", hint: "Clients sans réservation récente" },
  campagne_meteo: { label: "Campagne météo", emoji: "🌬️", hint: "Fenêtre de vent favorable" },
  promo_stage: { label: "Promotion Stage", emoji: "🏄", hint: "Stage 100 % Glisse" },
  derniere_minute: { label: "Dernière minute", emoji: "⚡", hint: "Places restantes à combler" },
  export_csv: { label: "Export CSV", emoji: "📄", hint: "Export du segment" },
  rapport_pdf: { label: "Rapport PDF", emoji: "🧾", hint: "Synthèse imprimable" },
};

export const STATUS_META: Record<PreparedActionStatus, { label: string; className: string }> = {
  prepared: { label: "Préparée", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  validated: { label: "Validée", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  cancelled: { label: "Annulée", className: "bg-muted text-muted-foreground" },
  expired: { label: "Expirée", className: "bg-destructive/15 text-destructive" },
};

export const PRIORITY_META: Record<string, string> = {
  haute: "border-destructive/40 text-destructive",
  normale: "border-primary/40 text-primary",
  basse: "border-muted-foreground/30 text-muted-foreground",
};
