import { Wind, Waves, Anchor, Plane, type LucideIcon } from "lucide-react";
import type { Activity } from "./types";

export const ACTIVITIES: { value: Activity; label: string; icon: LucideIcon }[] = [
  { value: "kitesurf", label: "Kitesurf", icon: Wind },
  { value: "wingfoil", label: "Wingfoil", icon: Waves },
  { value: "pumpfoil", label: "Pumpfoil", icon: Anchor },
  { value: "foil_tracte", label: "Foil tracté", icon: Plane },
  { value: "stage_100_glisse", label: "Stage 100% Glisse (5 jours)", icon: Wind },
];

/** Libellés courts (page de confirmation liste d'attente). */
export const ACTIVITY_LABEL: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
  stage_100_glisse: "Stage 100% Glisse",
};

/** Capacités par défaut utilisées quand le RPC ne renvoie pas de valeur. */
export const DEFAULT_KITE_CAPACITY = 4;
export const DEFAULT_WING_CAPACITY = 3;
export const DEFAULT_STAGE_CAPACITY = 4;

/** Nombre de journées consécutives d'un Stage 100% Glisse. */
export const STAGE_DAYS = 5;
