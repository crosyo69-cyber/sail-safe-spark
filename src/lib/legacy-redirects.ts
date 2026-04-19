/**
 * Legacy URL → New URL redirect mapping.
 * Client-side 301 handling via React Router (LegacyRedirectHandler).
 *
 * IMPORTANT: Les entrées se terminant par `.html` ont été retirées car le
 * SPA fallback de Lovable hosting ne sert pas `index.html` pour ces paths
 * (traités comme assets statiques manquants → 404 brut).
 * Les redirections `.html` sont gérées en amont via Cloudflare Bulk Redirects.
 *
 * Ce fichier ne contient désormais que les paths SANS extension `.html`/`.htm`,
 * pour lesquels le SPA fallback fonctionne correctement.
 */

// Exact path matches: old path → new path
export const exactRedirects: Record<string, string> = {
  // 1. Pages principales (sans extension)
  "/nos-activites": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-w1": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-kite-surf-w1": "/cours-kitesurf-hyeres-debutant",
  "/activites-wing-foil-w1": "/stage-wingfoil-hyeres-almanarre",
  "/pump-foil-dock-start-w1": "/cours-pumpfoil-dock-start-hyeres",
  "/activites-downwind-foil-w1": "/cours-pumpfoil-dock-start-hyeres",
  "/bons-cadeaux-w1": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/guide-local-w1": "/a-propos-ecole-kitesurf-hyeres",
  "/plan-du-site": "/",
  "/toutes-nos-prestations-1": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/archives-1": "/blog-kitesurf-hyeres",
  "/secteurs": "/spot-kitesurf-almanarre-hyeres-var",
  "/contact-w1": "/contact-reservation-kitesurf-hyeres",
  "/spot-almanarre-w1": "/spot-kitesurf-almanarre-hyeres-var",
  "/tarifs-w1": "/tarifs-cours-kitesurf-wingfoil-hyeres",

  // 2. Pages villes (SEO local)
  "/hyeres-y1": "/",
  "/presqu+ile+de+giens-y2": "/spot-kitesurf-almanarre-hyeres-var",
  "/toulon-y3": "/",
  "/six-fours-les-plages-y4": "/",

  // 3. Logs 404 mars 2026 - vague 2 (sans extension)
  "/location-materiel": "/location-materiel-kitesurf-hyeres",

  // 4. Redirections internes + anciennes URLs courtes crawlées par Google
  "/foil-tracte-wakeboard-hyeres": "/foil-tracte-hyeres",
  "/tarifs": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/foil-tracte": "/foil-tracte-hyeres",
  "/deposes-mer": "/deposes-mer-kitesurf-hyeres",
  "/spot-almanarre": "/spot-kitesurf-almanarre-hyeres-var",
  "/a-propos": "/a-propos-ecole-kitesurf-hyeres",
  "/contact": "/contact-reservation-kitesurf-hyeres",
  "/stage-wingfoil": "/stage-wingfoil-hyeres-almanarre",
  "/cours-pumpfoil": "/cours-pumpfoil-dock-start-hyeres",
  "/blog": "/blog-kitesurf-hyeres",
  "/cours-kitesurf": "/cours-kitesurf-hyeres-debutant",
  "/wakeboard": "/wakeboard-hyeres",

  // 5. Typos fréquentes
  "/adim": "/admin",
};

/**
 * Pattern-based redirects for SEO local pages (-zNN / -yNN suffix).
 * Maps keyword patterns to their target URLs.
 * These handle URLs like: /ecole+de+kitesurf+tous+niveaux+toulon-z3
 */
interface PatternRedirect {
  /** Keyword portion before the city name */
  keyword: string;
  target: string;
}

const seoLocalPatterns: PatternRedirect[] = [
  // Kitesurf
  { keyword: "ecole+de+kitesurf+tous+niveaux", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "ou+apprendre+le+kitesurf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "tarifs+des+cours+de+kitesurf", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "cours+de+kite+surf+pour+debutant", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "week-end+decouverte+kitesurf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "stage+de+kitesurf+a+la+semaine+ou+au+week-end", target: "/stage-kitesurf-100-glisse-hyeres" },
  { keyword: "cours+de+perfectionnement+en+kitesurf", target: "/session-kitesurf-carte-hyeres" },
  { keyword: "cours+d+initiation+kitesurf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "prendre+des+cours+en+ecole+de+kitesurf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "ecole+de+kite+surf+pour+cours+individuels+ou+particuliers", target: "/cours-particulier-kitesurf-hyeres" },
  { keyword: "stage+de+kitesurf+pour+debutant", target: "/stage-kitesurf-100-glisse-hyeres" },
  { keyword: "cours+de+kitesurf+prix", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "cours+de+perfectionnement+en+kite+surf+pour+gagner+en+autonomie", target: "/session-kitesurf-carte-hyeres" },
  { keyword: "organiser+un+sejour+kite+surf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "ecole+de+voile+pour+voyage+kite+surf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "vente+materiel+de+kitesurf+d+occasion", target: "/location-materiel-kitesurf-hyeres" },

  // Foil Tracté
  { keyword: "cours+de+foil+tracte", target: "/foil-tracte-hyeres" },

  // Wakeboard
  { keyword: "planche+tractee+wakeboard", target: "/wakeboard-hyeres" },
  { keyword: "reservation+de+cours+de+wakeboard", target: "/wakeboard-hyeres" },

  // Location
  { keyword: "acheter+du+materiel+de+kite+surf", target: "/location-materiel-kitesurf-hyeres" },
  { keyword: "prix+location+de+materiel+de+kite+surf", target: "/location-materiel-kitesurf-hyeres" },
  { keyword: "location+de+materiel+de+kitesurf", target: "/location-materiel-kitesurf-hyeres" },

  // Dépose en mer
  { keyword: "depose+en+mer+pour+kitesurf", target: "/deposes-mer-kitesurf-hyeres" },

  // Wingfoil
  { keyword: "cours+de+wing+foil", target: "/stage-wingfoil-hyeres-almanarre" },
  { keyword: "ecole+avec+cours+et+stages+pour+apprendre+le+wing+foil", target: "/stage-wingfoil-hyeres-almanarre" },
  { keyword: "prix+cours+de+wingfoil", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },

  // Découverte
  { keyword: "journee+decouverte+kite+surf+ou+wing+foil", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },

  // Autres sports / anciennes pages
  { keyword: "cours+de+sky+surf+et+fly+surf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "faire+une+balade+en+paddle", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },

  // Patterns GSC mars 2026
  { keyword: "prix+cours+kitesurf+en+groupe", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "cours+de+foil+pour+kitesurf", target: "/foil-tracte-hyeres" },
  { keyword: "prix+location+de+materiel+de+kite", target: "/location-materiel-kitesurf-hyeres" },
  { keyword: "stage+pour+apprendre+le+kite+surf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "prendre+des+cours+de+kitesurf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "faire+un+stage+de+kitesurf+a+l+almanarre", target: "/stage-kitesurf-100-glisse-hyeres" },
  { keyword: "cours+pour+apprendre+le+kite+surf", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "cours+de+kitesurf+en+groupe", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "ou+prendre+des+cours+de+strapless", target: "/cours-kitesurf-hyeres-debutant" },
  { keyword: "prix+stage+d+initiation+kite+surf", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "prix+d+un+stage+de+kite+surf", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "cours+individuel+kitesurf+prix", target: "/cours-particulier-kitesurf-hyeres" },
  { keyword: "cours+particulier+de+kitesurf", target: "/cours-particulier-kitesurf-hyeres" },
  { keyword: "journee+decouverte+du+kitesurf", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
  { keyword: "journee+decouverte+en+paddle", target: "/tarifs-cours-kitesurf-wingfoil-hyeres" },
];

/**
 * Resolve a legacy URL path to its new destination.
 * Returns the new path or null if no redirect matches.
 */
export function resolveLegacyRedirect(pathname: string): string | null {
  // Normalize: Google may crawl with %20, spaces, or + signs — decode then unify to +
  const decoded = decodeURIComponent(pathname);
  const normalized = decoded.replace(/ /g, "+");

  // 1. Check exact matches first (try both original and normalized)
  if (exactRedirects[pathname]) {
    return exactRedirects[pathname];
  }
  if (normalized !== pathname && exactRedirects[normalized]) {
    return exactRedirects[normalized];
  }

  // 2. Check dossier_cite/* (old CMS images)
  if (pathname.startsWith("/dossier_cite/")) {
    return "/placeholder.svg";
  }

  // 3. Redirect /blog/slug → /blog-kitesurf-hyeres/slug (malformed external links)
  const blogPrefixMatch = pathname.match(/^\/blog\/(.+)$/);
  if (blogPrefixMatch) {
    return `/blog-kitesurf-hyeres/${blogPrefixMatch[1]}`;
  }

  // 4. Check SEO local patterns (keyword+city-zNN or -yNN)
  const localSuffixMatch = normalized.match(/-[zy]\d+$/);
  if (localSuffixMatch) {
    const pathWithoutSuffix = normalized.slice(0, localSuffixMatch.index);
    for (const pattern of seoLocalPatterns) {
      if (pathWithoutSuffix.startsWith("/" + pattern.keyword)) {
        return pattern.target;
      }
    }
    // Fallback: unrecognized keyword with local suffix → homepage
    return "/";
  }

  return null;
}
