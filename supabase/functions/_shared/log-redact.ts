/**
 * F-25-02 / F-25-03 — Utilitaires de minimisation des journaux et des erreurs.
 *
 * Objectifs :
 *  - ne jamais exposer un message d'exception interne (PostgREST, contrainte SQL,
 *    nom de table/fonction, détail fournisseur) dans une réponse publique ;
 *  - ne jamais journaliser d'e-mail complet, de nom complet, de token, d'OTP,
 *    d'en-tête Authorization, de cookie ou de secret ;
 *  - conserver la capacité de diagnostic via un identifiant de corrélation et
 *    une empreinte stable et non réversible.
 *
 * Aucune dépendance externe, aucun effet de bord.
 */

/** Identifiant de corrélation non sensible, à reporter dans la réponse et le log. */
export function correlationId(): string {
  return crypto.randomUUID();
}

/**
 * Masque une adresse e-mail : `john.doe@gmail.com` → `j***@gmail.com`.
 * Retourne `null` pour une entrée vide, et `***` pour une valeur non e-mail.
 */
export function maskEmail(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const raw = value.trim();
  const at = raw.lastIndexOf("@");
  if (at <= 0 || at === raw.length - 1) return "***";
  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1);
  return `${local[0]}***@${domain}`;
}

/** Masque un nom / prénom : `Jean` → `J***`. */
export function maskName(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const raw = value.trim();
  return `${raw[0]}***`;
}

/**
 * Empreinte courte, stable et non réversible d'une valeur (corrélation entre
 * deux journaux sans exposer la donnée d'origine).
 */
export async function fingerprint(value: unknown): Promise<string | null> {
  if (typeof value !== "string" || !value.trim()) return null;
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Description d'erreur minimisée, sûre pour un journal ou un e-mail admin :
 * type d'erreur + code éventuel, jamais de stack, jamais de message brut.
 */
export function errorSummary(err: unknown): { type: string; code: string | null } {
  if (err && typeof err === "object") {
    const anyErr = err as { name?: unknown; code?: unknown; constructor?: { name?: string } };
    const type = typeof anyErr.name === "string" && anyErr.name
      ? anyErr.name
      : (anyErr.constructor?.name ?? "Error");
    const code = typeof anyErr.code === "string" || typeof anyErr.code === "number"
      ? String(anyErr.code)
      : null;
    return { type, code };
  }
  return { type: typeof err, code: null };
}

/** Réponse publique générique : jamais de détail interne. */
export const GENERIC_ERROR_MESSAGE = "Une erreur est survenue. Veuillez réessayer.";
