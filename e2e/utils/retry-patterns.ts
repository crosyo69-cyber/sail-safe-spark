/**
 * Source unique de vérité pour les patterns considérés comme "réseau / timeout"
 * et donc éligibles à un retry automatique en CI. Toute erreur ne matchant
 * AUCUN de ces patterns est considérée comme déterministe et stoppe le retry.
 */
export const RETRYABLE_PATTERNS: RegExp[] = [
  /timeout/i,
  /timed out/i,
  /net::ERR_/i,
  /ECONNREFUSED/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /EAI_AGAIN/i,
  /socket hang up/i,
  /network/i,
  /navigation failed/i,
  /Target page, context or browser has been closed/i,
];

export function isRetryable(message: string): boolean {
  return RETRYABLE_PATTERNS.some((re) => re.test(message));
}