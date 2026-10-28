// Frozen reports are operational sources, not verified payment evidence.
// Apply before presenting results or sending tool data to a language model.
export function maskUnverifiedFinancials(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskUnverifiedFinancials);
  if (!value || typeof value !== "object") return value;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const financial = /(^|_)(ca|revenue|acomptes?|deposit|solde|panier|balance|amount|montant)(_|$)|_eur$|evolution_.*_pct$/.test(key);
    result[key] = financial ? null : maskUnverifiedFinancials(child);
  }
  return result;
}

export function financialToolResult(value: unknown) {
  return {
    data: maskUnverifiedFinancials(value),
    accounting_status: "unverified",
    accounting_notice: "À vérifier : aucune preuve de paiement ni prix contractuel certifié dans cette source. Les montants masqués ne sont pas des zéros. Les classements financiers historiques ne sont pas certifiés.",
  };
}