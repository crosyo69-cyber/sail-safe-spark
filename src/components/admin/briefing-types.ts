// Types du Cockpit IA du Directeur (lecture seule).
// Structurés pour l'ÉTAPE IA 3 : chaque opportunité porte déjà une `action`
// exploitable plus tard par un bouton « Préparer » puis « Envoyer ».

export type BriefingSeverity = "info" | "warning" | "critical";

export type BriefingAlert = {
  code: string;
  severite: BriefingSeverity;
  titre: string;
  detail: string;
  nombre: number;
};

export type BriefingOpportunityAction = {
  kind: "campaign";
  segment: string;
  activity?: string;
  date?: string;
  days?: number;
};

export type BriefingOpportunity = {
  id: string;
  type: string;
  titre: string;
  pourquoi: string;
  prompt: string;
  action: BriefingOpportunityAction;
  statut: "suggestion";
};

export type BriefingClient = {
  nom: string | null;
  email: string;
  ca_eur?: number;
  reservations?: number;
  credits_restants?: number;
  derniere_venue?: string | null;
  prochaine_expiration?: string | null;
  consentement?: boolean;
  raison?: string;
};

export type Briefing = {
  genere_le: string;
  date: string;
  activite_du_jour: {
    date: string;
    reservations: number;
    participants: number;
    par_activite: Record<string, number>;
    groupes: number;
    places_restantes: number;
    journees_completes: number;
    capacite_totale: number;
    taux_remplissage_pct: number;
  };
  business: {
    acomptes_jour_eur: number;
    transactions_jour: number;
    ca_mois_eur: number;
    ca_saison_eur: number;
    panier_moyen_eur: number;
    ca_mois_n1_eur: number;
    ca_saison_n1_eur: number;
    par_activite_mois: Record<string, number>;
    activite_plus_rentable: string | null;
    packs_vendus_mois: number;
    acomptes_packs_mois_eur: number;
    evolution_mois_pct: number | null;
    evolution_saison_pct: number | null;
  };
  alertes: BriefingAlert[];
  opportunites: BriefingOpportunity[];
  crm: {
    nouveaux_30j: number;
    clients_total: number;
    actifs: number;
    inactifs: number;
    prospects: number;
    sans_reservation_6m: number;
    top_clients: BriefingClient[];
    a_relancer: BriefingClient[];
  };
  marketing: {
    campagnes_actives: number;
    campagnes_recentes: { nom: string; statut: string; destinataires: number; planifiee_le: string | null }[];
    campagnes_en_echec_30j: number;
    automatisations_actives: number;
    automatisations_executees_7j: number;
    prochaine_automatisation: { nom: string; le: string } | null;
    base_marketing: number;
    contacts_consentants: number;
    emails_envoyes_30j: number;
  };
  meteo: { connectee: boolean; message: string };
  questions_suggerees: string[];
};