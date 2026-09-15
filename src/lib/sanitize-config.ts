/**
 * F-25-J — Configuration explicite de la sanitation HTML.
 *
 * Module volontairement PUR (aucun import DOM / DOMPurify) afin de pouvoir être
 * testé statiquement. `src/lib/sanitize-html.ts` applique ces profils.
 *
 * Principes :
 *  - allowlist de balises et d'attributs : tout le reste est retiré ;
 *  - aucun gestionnaire d'évènement (onclick, onerror, ...) n'est autorisé ;
 *  - schémas d'URL restreints : https, http, mailto, tel, ancres et chemins
 *    relatifs. `javascript:`, `data:`, `vbscript:`, `file:` sont exclus ;
 *  - SVG et MathML désactivés (non nécessaires au rendu).
 */

/** Schémas d'URL autorisés pour href/src. Exclut javascript:, data:, vbscript:, file:. */
export const ALLOWED_URI_REGEXP =
  /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i;

/** Balises de texte enrichi communes à tous les profils. */
const TEXT_TAGS = [
  "p", "br", "hr", "span", "div",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "del", "ins", "mark", "small", "sub", "sup",
  "ul", "ol", "li", "dl", "dt", "dd",
  "blockquote", "pre", "code",
  "a",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
];

export type SanitizeProfile = {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
  ALLOWED_URI_REGEXP: RegExp;
  FORBID_TAGS: string[];
  FORBID_ATTR: string[];
  ALLOW_DATA_ATTR: boolean;
  ALLOW_ARIA_ATTR: boolean;
  USE_PROFILES: { html: true };
  ADD_ATTR?: string[];
};

const FORBID_TAGS = [
  "script", "style", "iframe", "frame", "frameset", "object", "embed", "applet",
  "form", "input", "button", "select", "textarea", "option",
  "link", "meta", "base", "svg", "math", "audio", "video", "source", "track",
];

/** Attributs explicitement interdits (défense en profondeur au-delà de l'allowlist). */
const FORBID_ATTR = [
  "style", "srcset", "formaction", "background", "ping", "srcdoc",
  "onerror", "onclick", "onload", "onmouseover", "onfocus", "onanimationend", "onbegin",
];

/**
 * Profil Markdown éditorial (articles de blog) : images internes/HTTPS autorisées,
 * car elles font partie du contenu rédactionnel.
 */
export const MARKDOWN_RICH: SanitizeProfile = {
  ALLOWED_TAGS: [...TEXT_TAGS, "img", "figure", "figcaption"],
  ALLOWED_ATTR: ["href", "title", "target", "rel", "src", "alt", "width", "height", "loading", "colspan", "rowspan", "scope", "id", "class"],
  ALLOWED_URI_REGEXP,
  FORBID_TAGS,
  FORBID_ATTR,
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: true,
  USE_PROFILES: { html: true },
};

/**
 * Profil sortie de modèle (chatbot public, assistant admin) : aucune image.
 * Le contenu est généré par un LLM ; les images externes seraient un vecteur de
 * traçage (beacon) sans valeur fonctionnelle.
 */
export const MARKDOWN_TEXT_ONLY: SanitizeProfile = {
  ALLOWED_TAGS: TEXT_TAGS,
  ALLOWED_ATTR: ["href", "title", "target", "rel", "colspan", "rowspan", "scope"],
  ALLOWED_URI_REGEXP,
  FORBID_TAGS: [...FORBID_TAGS, "img"],
  FORBID_ATTR: [...FORBID_ATTR, "src"],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  USE_PROFILES: { html: true },
};

/**
 * Profil prévisualisation d'e-mail (HTML de campagne, non assaini en base).
 * Les styles inline sont conservés car ils portent la mise en forme de l'e-mail,
 * mais scripts, évènements, iframes et schémas actifs restent interdits.
 */
export const EMAIL_PREVIEW: SanitizeProfile = {
  ALLOWED_TAGS: [...TEXT_TAGS, "img", "center", "font", "tbody"],
  ALLOWED_ATTR: [
    "href", "title", "target", "rel", "src", "alt", "width", "height",
    "align", "valign", "bgcolor", "border", "cellpadding", "cellspacing",
    "colspan", "rowspan", "class", "style",
  ],
  ALLOWED_URI_REGEXP,
  FORBID_TAGS,
  FORBID_ATTR: FORBID_ATTR.filter((a) => a !== "style"),
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  USE_PROFILES: { html: true },
};
