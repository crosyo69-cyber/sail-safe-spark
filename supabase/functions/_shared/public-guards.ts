/**
 * F-25-01 — Garde-fous partagés des endpoints publics émetteurs d'e-mail.
 *
 * Principes (alignés sur F-23-01 / ai-guards.ts) :
 *  - la PREMIÈRE valeur de `x-forwarded-for` est fournie par le client : elle ne
 *    doit jamais servir de clé de rate limiting. On utilise la DERNIÈRE valeur
 *    (ajoutée par le proxy le plus proche de la plateforme), non retirable par
 *    le client, avec repli `x-real-ip` puis constante non vide ;
 *  - un quota GLOBAL (clé fixe `GLOBAL` côté SQL) borne la ressource coûteuse
 *    indépendamment de l'IP, de l'e-mail et du token ;
 *  - le quota est fail-closed : toute erreur du mécanisme refuse la requête.
 */
import { rateLimitKeys } from "./ai-guards.ts";

/** Clé de rate limit publique : dernière valeur XFF (non falsifiable par préfixe). */
export function publicRateKey(req: Request): string {
  return rateLimitKeys(req).edge;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export type QuotaResult = { ok: true } | { ok: false; reason: "limit" | "error" };

/**
 * Quota global horaire + journalier pour une surface publique donnée.
 * `context` doit être propre à l'endpoint (pas de couplage métier entre surfaces).
 * Exécuté AVANT toute création de token, insertion ou mise en file d'e-mail.
 */
export async function globalQuota(
  supabase: Db,
  context: string,
  hourly: number,
  daily: number,
): Promise<QuotaResult> {
  for (const [suffix, limit, window] of [
    ["hour", hourly, "1 hour"],
    ["day", daily, "24 hours"],
  ] as const) {
    const { data: allowed, error } = await supabase.rpc("public_quota_guard", {
      p_context: `${context}_global_${suffix}`,
      p_limit: limit,
      p_window: window,
    });
    if (error) {
      console.error("quota guard unavailable", context, suffix, error.message);
      return { ok: false, reason: "error" }; // fail-closed
    }
    if (allowed !== true) return { ok: false, reason: "limit" };
  }
  return { ok: true };
}
