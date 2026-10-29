// Lot sécurité 1A — conversion sûre d'un texte libre en HTML d'e-mail.
// Aucune balise, aucun attribut, aucun lien n'est jamais produit depuis le texte.

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Normalise un texte libre : supprime caractères de contrôle, plafonne la longueur. */
export function cleanPlainText(value: unknown, maxLength = 500): string {
  const text = String(value ?? "")
    .replace(/\r\n?/g, "\n")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/** Texte libre → HTML inerte : échappé, retours à la ligne en <br>. */
export function textToHtml(value: unknown, maxLength = 500): string {
  return escapeHtml(cleanPlainText(value, maxLength)).replace(/\n/g, "<br>");
}
