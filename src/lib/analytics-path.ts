/**
 * LOT D-3-FIX — R8
 *
 * Normalisation des chemins avant transmission aux outils d'analytics
 * (GA4 / Google Ads / logger interne).
 *
 * Certaines routes publiques portent un token dans le path ou la query
 * (liste d'attente, préférences marketing, désabonnement alertes météo).
 * Ces tokens donnent accès à des données personnelles et/ou permettent une
 * mutation : ils ne doivent JAMAIS quitter le périmètre de l'application.
 *
 * Cette fonction est purement défensive : elle ne modifie ni la navigation,
 * ni les paramètres réellement lus par les pages (useParams / searchParams).
 */

/** Routes dont le dernier segment de path est un token opaque. */
const TOKEN_PATH_PREFIXES = ["/liste-attente", "/preferences-marketing"] as const;

/** Paramètres de query considérés comme sensibles et retirés systématiquement. */
const SENSITIVE_QUERY_PARAMS = ["token", "offer_token", "confirm_token", "unsubscribe_token"];

function sanitizePathname(pathname: string): string {
  for (const prefix of TOKEN_PATH_PREFIXES) {
    if (pathname === prefix || pathname === `${prefix}/`) return prefix;
    if (pathname.startsWith(`${prefix}/`)) return `${prefix}/:token`;
  }
  return pathname;
}

function sanitizeSearch(search: string): string {
  if (!search || search === "?") return "";

  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  let removed = false;
  for (const key of SENSITIVE_QUERY_PARAMS) {
    if (params.has(key)) {
      params.delete(key);
      removed = true;
    }
  }
  if (!removed) return search.startsWith("?") ? search : `?${search}`;

  const rest = params.toString();
  return rest ? `?${rest}` : "";
}

/**
 * Retourne le chemin sûr à envoyer aux analytics.
 *
 * /liste-attente/<uuid>                  -> /liste-attente/:token
 * /preferences-marketing/<uuid>          -> /preferences-marketing/:token
 * /desabonnement-alertes?token=<uuid>    -> /desabonnement-alertes
 * /tarifs?utm_source=ads                 -> /tarifs?utm_source=ads (inchangé)
 */
export function sanitizeAnalyticsPath(pathname: string, search = ""): string {
  return sanitizePathname(pathname) + sanitizeSearch(search);
}
