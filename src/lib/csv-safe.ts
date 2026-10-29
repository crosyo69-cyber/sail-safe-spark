/**
 * Cellule CSV protégée contre l'injection de formules (Excel, LibreOffice, Sheets).
 *
 * Toute valeur dont le premier caractère significatif (après espaces, tabulations,
 * retours à la ligne ou caractères de contrôle) est = + - @, ou qui commence
 * elle-même par une tabulation / un retour chariot, est préfixée d'une apostrophe :
 * le tableur l'affiche alors comme du texte, jamais comme une formule.
 * La valeur est toujours entourée de guillemets (guillemets internes doublés).
 * Les données en base ne sont jamais modifiées : seule la cellule exportée l'est.
 */
const FORMULA_START = /^[\s\u0000-\u001f\u007f\u00a0\u200b\ufeff]*[=+\-@\uff1d\uff0b\uff0d\uff20]/;
const RISKY_FIRST_CHAR = /^[\t\r\n]/;

export function neutralizeFormula(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (FORMULA_START.test(str) || RISKY_FIRST_CHAR.test(str)) return `'${str}`;
  return str;
}

export function csvCell(value: unknown): string {
  return `"${neutralizeFormula(value).replace(/"/g, '""')}"`;
}

export function csvRow(values: unknown[], separator = ";"): string {
  return values.map(csvCell).join(separator);
}
