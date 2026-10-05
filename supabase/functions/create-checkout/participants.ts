/**
 * F-27-01 — cohérence paiement ↔ capacité.
 *
 * Un checkout public ne doit JAMAIS encaisser un nombre de participants
 * qu'un unique `daily_group` ne pourra pas accueillir. La capacité de
 * référence reste `public.default_max_participants(activity)` (source de
 * vérité SQL utilisée par `enforce_daily_group_capacity`) : ce module ne
 * duplique aucune capacité, il se contente de résoudre l'activité et de
 * valider la quantité demandée.
 *
 * La résolution nom commercial → `activity_type` reproduit exactement celle
 * de `stripe-webhook` / `sync-stripe-reservations`, à ceci près qu'une
 * activité inconnue est ICI rejetée (pas de repli silencieux vers kitesurf).
 */

/** Noms commerciaux réellement proposés au paiement public. */
export const ACTIVITY_ENUM_BY_NAME: Record<string, string> = {
  "cours particulier kitesurf": "kitesurf",
  "stage 100% glisse": "stage_100_glisse",
  "cours à la carte": "kitesurf",
  "cours wingfoil": "wingfoil",
  "location matériel": "kitesurf",
  "foil tracté": "foil_tracte",
  "déposes en mer": "kitesurf",
};

function normalize(value: string): string {
  return value.normalize("NFC").toLowerCase().trim().replace(/\s+/g, " ");
}

/** Retourne l'`activity_type` correspondant, ou null si l'activité est inconnue. */
export function resolveActivityEnum(activityName: string): string | null {
  return ACTIVITY_ENUM_BY_NAME[normalize(activityName)] ?? null;
}

/**
 * Accepte uniquement un entier strictement positif (number ou chaîne
 * numérique). Absent → 1. Toute autre valeur (0, négatif, décimal, NaN,
 * texte, objet…) → null, c'est-à-dire rejet AVANT tout appel Stripe.
 */
export function parseParticipants(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return 1;
  if (typeof raw === "boolean") return null;
  if (typeof raw !== "number" && typeof raw !== "string") return null;
  const value = typeof raw === "number" ? raw : Number(raw.trim());
  if (!Number.isFinite(value) || !Number.isInteger(value)) return null;
  if (value < 1 || value > 1000) return null;
  return value;
}

/**
 * S3 — Stage 100 % Glisse : participants OBLIGATOIRE, entier strict 1..4.
 * Absent, 0, négatif, 5+, décimal, texte, booléen → null (rejet).
 */
export function parseStageParticipants(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isInteger(raw) && raw >= 1 && raw <= 4 ? raw : null;
  }
  if (typeof raw === "string" && /^\s*[1-4]\s*$/.test(raw)) return Number(raw.trim());
  return null;
}
