export type Member = {
  kind: "visitor" | "package";
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  participants: number;
  package_code?: string;
  /** Activité réellement pratiquée par le client (visiteur : client_activity, pack : activité du pack). */
  client_activity?: string;
  /** Horodatage de la réservation (ISO). */
  booked_at?: string;
};

export type DailyGroup = {
  id: string;
  activity: "kitesurf" | "wingfoil" | string;
  group_index: number;
  max_participants: number;
  status: "open" | "closed" | "cancelled" | string;
  notes: string | null;
  taken: number;
  members: Member[];
};

export const ACTIVITY_LABEL: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

export const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  closed: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  cancelled: "bg-rose-500/10 text-rose-700 border-rose-500/30",
};

export const statusLabel = (status: string) =>
  status === "open" ? "Ouvert" : status === "closed" ? "Fermé" : "Annulé";
