/**
 * Legacy URL → New URL redirect mapping.
 * Extracted from public/_redirects for client-side 301 handling via React Router.
 * Covers: .html pages, details-* articles, -zNN SEO local pages, partner pages, and misc redirects.
 */

// Exact path matches: old path → new path
export const exactRedirects: Record<string, string> = {
  // 1. Pages principales (.html)
  "/nos-activites.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-w1.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/activites-kite-surf-w1.html": "/cours-kitesurf-hyeres-debutant",
  "/activites-wing-foil-w1.html": "/stage-wingfoil-hyeres-almanarre",
  "/pump-foil-dock-start-w1.html": "/cours-pumpfoil-dock-start-hyeres",
  "/activites-downwind-foil-w1.html": "/cours-pumpfoil-dock-start-hyeres",
  "/bons-cadeaux-w1.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/guide-local-w1.html": "/a-propos-ecole-kitesurf-hyeres",
  "/tarifs.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/contact.html": "/contact-reservation-kitesurf-hyeres",
  "/mentions-legales.html": "/mentions-legales",
  "/politique-confidentialite.html": "/politique-confidentialite",
  "/plan-du-site.html": "/",
  "/toutes-nos-prestations-1.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/archives-1.html": "/blog-kitesurf-hyeres",
  "/secteurs.html": "/spot-kitesurf-almanarre-hyeres-var",

  // 2. Articles & Pages détail (details-*.html)
  "/details-apprendre+le+kitesurf+en+ecole+a+hyeres+dans+le+var-147.html": "/cours-kitesurf-hyeres-debutant",
  "/details-les+cours+pour+apprendre+ou+a+se+perfectionner+en+kitesurf+a+hyeres+dans+le+var-35.html": "/session-kitesurf-carte-hyeres",
  "/details-stages+et+cours+de+perfectionnement+ou+coaching+en+kitesurf+a+hyeres+a+proximite+de+carqueiranne-152.html": "/stage-kitesurf-100-glisse-hyeres",
  "/details-apprenez+le+kitesurf+avec+le+bon+materiel+a+hyeres-250.html": "/blog/guide-equipement-kitesurf-debutant",
  "/details-kitesurf+enfant+et+adolescent+a+hyeres+apprendre+en+toute+securite-214.html": "/cours-kitesurf-hyeres-debutant",
  "/details-stage+de+kitesurf+a+l+almanarre+5+jours+pour+progresser+rapidement+a+hyeres-224.html": "/stage-kitesurf-100-glisse-hyeres",
  "/details-pratiquez+le+kitesurf+a+l+almanarre+en+toute+securite-219.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/details-conditions+de+vent+a+l+almanarre+le+guide+kitesurf+a+hyeres-211.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/details-stage+de+perfectionnement+kitesurf+avance+a+hyeres-215.html": "/session-kitesurf-carte-hyeres",
  "/details-organisez+votre+sejour+kitesurf+a+hyeres+avec+kitesurf+passion-217.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-wingfoil+debutant+a+hyeres+apprenez+a+voler+sur+l+eau+a+l+almanarre-247.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-offrir+un+stage+d+initiation+de+wing+foil+sur+5+jours+consecutifs-130.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-offrir+une+cours+de+wingfoil+avec+kite+surf+passion-131.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-ecole+de+wing+foil+hyeres+proche+l+almanare-184.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-pourquoi+se+mettre+au+wing+foil+sur+hyeres+almanare-158.html": "/blog/wingfoil-sport-tendance-2024",
  "/details-ecole+de+wingfoil+a+hyeres+apprenez+le+wingfoil+a+l+almanarre+dans+le+var-227.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-est-il+dangereux+d+apprendre+le+wingfoil+a+hyeres+dans+le+var-182.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-cours+de+foil+pour+le+kitesurf+et+le+wing+foil+et+le+surf+foil+hyeres+83+dans+le+var-22.html": "/foil-tracte-hyeres",
  "/details-nouveaute+a+hyeres+decouvrez+notre+simulateur+de+foil+tracte+wingfoil+surf+foil+kite+foil+windsurf+foil-190.html": "/foil-tracte-hyeres",
  "/details-tarifs+des+cours+de+kitesurf+a+hyeres+formules+claires+et+adaptees-245.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-spot+de+kitesurf+de+la+baie+de+l+almanarre+un+lieu+mythique+a+hyeres-243.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/details-la+meteo+du+vent+sur+hyeres+l+almanarre+pour+ne+pas+rater+vos+sessions+de+kitesurf-51.html": "/spot-kitesurf-almanarre-hyeres-var",
  "/details-moniteur+de+kitesurf+diplome+a+hyeres+un+encadrement+professionnel+et+securise-242.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-moniteur+de+kitesurf+diplome+a+hyeres+un+encadrement+professionnel+et+securise-204.html": "/a-propos-ecole-kitesurf-hyeres",
  "/details-bon+cadeaux+fete+de+noel+pour+ecole+de+kite+surf+hyeres-165.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-commandez+votre+bon+cadeau+kitesurf+dans+le+var-246.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/details-commandez+votre+bon+cadeau+kitesurf+des+maintenant-208.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",

  // 3. Sous-pages activités & pages supplémentaires
  "/activites-coaching+wingfoil+hyeres+de+l+almanarre-26.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-offrir+un+cadeau+de+noel+pour+une+femme+ou+un+homme+on+un+enfant+le+kitesurf+a+hyeres-24.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/actualit-s-w1.html": "/blog-kitesurf-hyeres",
  "/tarifs-w1.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",
  "/archives-2.html": "/blog-kitesurf-hyeres",
  "/archives-3.html": "/blog-kitesurf-hyeres",
  "/archives-4.html": "/blog-kitesurf-hyeres",

  // 4. Pages villes (SEO local)
  "/hyeres-y1": "/",
  "/presqu+ile+de+giens-y2": "/spot-kitesurf-almanarre-hyeres-var",
  "/toulon-y3": "/",

  // 8. Pages partenaires (lien-*.html)
  "/lien-federation+de+vol+libre+nice+ffvl-25.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-agence+immobilier+carqueiranne+guyhoquet-58.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-hotel+carqueiranne+hotel+richiardi-31.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-office+du+tourisme+toulon+provence+med-191.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-salle+de+sports+hyeres+synergy+fit-170.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-tilou+location+specialiste+de+la+location+d+appartements+et+chambre+d+hote+a+giens+hyeres+giens+tiloulocation-54.html": "/a-propos-ecole-kitesurf-hyeres",
  "/lien-simulateur+de+chute+libre+hyrese+air+vertical-44.html": "/a-propos-ecole-kitesurf-hyeres",

  // 9. URLs 404 détectées dans GSC (février 2026)
  "/details-venez+apprendre+le+wing+foil+en+stage+et+cours+d+initiation+hyeres+l+almanarre-70.html": "/stage-wingfoil-hyeres-almanarre",
  "/details-venez+apprendre+le+wing+foil+en+stage+et+cours+d+initiation+a+hyeres+l+almanarre-70.html": "/stage-wingfoil-hyeres-almanarre",
  "/activites-cours+de+pump+foil+et+dock+start+a+hyeres+plage+de+l+almanare+var-37.html": "/cours-pumpfoil-dock-start-hyeres",
  "/details-ailes+d+occasion+de+kitesurf+a+vendre+duotone+a+hyeres+l+amanarre-151.html": "/location-materiel-kitesurf-hyeres",
  "/activites-offrir+un+cadeau+de+noel+pour+une+femme+ou+un+homme+on+un+enfant+le+kitesurf+a+hyeres+-24.html": "/tarifs-cours-kitesurf-wingfoil-hyeres",

  // 10. Redirections internes
  "/foil-tracte-wakeboard-hyeres": "/foil-tracte-hyeres",
};

/**
 * Pattern-based redirects for SEO local pages (-zNN suffix).
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
];

/**
 * Resolve a legacy URL path to its new destination.
 * Returns the new path or null if no redirect matches.
 */
export function resolveLegacyRedirect(pathname: string): string | null {
  // 1. Check exact matches first
  if (exactRedirects[pathname]) {
    return exactRedirects[pathname];
  }

  // 2. Check dossier_cite/* (old CMS images)
  if (pathname.startsWith("/dossier_cite/")) {
    return "/placeholder.svg";
  }

  // 3. Check SEO local patterns (keyword+city-zNN)
  // Pattern: /keyword+city-zN where city is toulon, hyeres, or presqu+ile+de+giens
  const zSuffixMatch = pathname.match(/-z\d+$/);
  if (zSuffixMatch) {
    const pathWithoutSuffix = pathname.slice(0, zSuffixMatch.index);
    for (const pattern of seoLocalPatterns) {
      if (pathWithoutSuffix.startsWith("/" + pattern.keyword)) {
        return pattern.target;
      }
    }
  }

  return null;
}
