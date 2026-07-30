export type CrmClient = {
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  first_seen: string | null;
  reservations_count: number;
  participants_count: number;
  packages_count: number;
  sessions_purchased: number;
  sessions_used: number;
  credits_remaining: number;
  credits_consumed: number;
  credits_expired: number;
  next_expiry: string | null;
  revenue: number;
  activities: string[];
  marketing_consent: boolean;
  last_activity: string | null;
  first_activity: string | null;
  lifecycle: "active" | "inactive" | "prospect";
};

export type CrmDashboardStats = {
  total_clients: number;
  new_clients_30d: number;
  new_clients_365d: number;
  active_clients: number;
  inactive_clients: number;
  prospects: number;
  total_revenue: number;
  revenue_per_client: number;
  avg_basket: number;
  avg_sessions: number;
  loyalty_rate: number;
  repeat_clients: number;
  credits_outstanding: number;
  marketing_optin: number;
};

export type CrmDetail = {
  summary: CrmClient | null;
  profile: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    observations: string | null;
    recommended_gear: string | null;
    marketing_consent: boolean;
    marketing_consent_at: string | null;
    tags: string[];
  } | null;
  levels: { id: string; activity: string; level: string; notes: string | null; updated_at: string }[];
  documents: { id: string; title: string; url: string; doc_type: string; created_at: string }[];
  packages: {
    id: string; code: string; activity: string; package_type: string; status: string;
    total_sessions: number; used_sessions: number; deposit_amount: number | null;
    deposit_paid_at: string | null; stripe_session_id: string | null;
    expires_at: string; created_at: string;
  }[];
  bookings: {
    kind: "visitor" | "package"; id: string; date: string | null; activity: string | null;
    participants: number; status: string; skill_level: string | null; created_at: string;
    stripe_session_id: string | null;
  }[];
  credits: {
    id: string; activity: string; origin: string; status: string; reason: string | null;
    created_at: string; expires_at: string; consumed_at: string | null; package_code: string;
  }[];
  credit_history: {
    id: string; delta: number; kind: string; action: string | null; reason: string | null;
    activity: string | null; balance_after: number; created_at: string;
  }[];
  payments: {
    source: "package" | "reservation"; reference: string | null; amount: number;
    activity: string | null; stripe_session_id: string | null; paid_at: string;
  }[];
};

export const ACTIVITY_LABEL: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

export const LEVEL_LABEL: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

export const LIFECYCLE_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  inactive: { label: "Inactif", className: "bg-orange-500/15 text-orange-700 dark:text-orange-400" },
  prospect: { label: "Prospect", className: "bg-muted text-muted-foreground" },
};

export const eur = (n: number | null | undefined) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
    .format(Number(n ?? 0));