// Types du Cockpit financier (lecture seule) — alimentés par assistant_financial_summary().

export type FinanceDetailRow = {
  activite?: string;
  date?: string;
  client?: string | null;
  email?: string;
  montant_eur: number;
  statut?: string;
  source?: string;
  prestations_eur?: number;
  acomptes_eur?: number;
};

export type FinancialSummary = {
  genere_le: string;
  date: string;
  tarifs_source: string;
  acomptes: {
    jour_eur: number;
    mois_eur: number;
    saison_eur: number;
    mois_n1_eur: number;
    saison_n1_eur: number;
    transactions_mois: number;
  };
  prestations: {
    jour_eur: number;
    mois_eur: number;
    saison_eur: number;
    mois_n1_eur: number;
    saison_n1_eur: number;
    par_activite_saison: Record<string, number>;
  };
  solde_restant: { total_eur: number; clients_concernes: number };
  credits: {
    nombre: number;
    valeur_eur: number;
    valeur_expirant_30j_eur: number;
    nombre_expirant_30j: number;
  };
  repartition: { acomptes_eur: number; prestations_eur: number; credits_eur: number };
  details: {
    acomptes: FinanceDetailRow[];
    prestations: FinanceDetailRow[];
    solde: FinanceDetailRow[];
    credits: FinanceDetailRow[];
  };
};

export type FinanceDetailKey = keyof FinancialSummary["details"];
