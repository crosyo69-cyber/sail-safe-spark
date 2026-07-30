## Point de départ

Une partie de la demande est déjà en place depuis la dernière itération :
- table `package_credit_history` (journal des mouvements : date, delta, motif, admin, solde après)
- recrédit manuel avec motifs (`RecreditDialog`), sur un pack ou un participant
- annulation + recrédit d'un participant ou d'un groupe d'activité
- email « séance recréditée »

Le plan ci-dessous complète ce qui manque.

## Phase A — Portefeuille et historique (base)

1. Vue `client_credit_wallet` : par pack et par activité → achetées, consommées, recréditées, restantes (calcul automatique depuis `client_packages` + `package_credit_history`).
2. Enrichir `package_credit_history` : colonnes `activity`, `daily_group_id`, `action` (booking / cancellation / recredit / report / group_cancel). Historique en append-only (aucune suppression, politique RLS lecture admin + lecture par code pack).
3. RPC `get_wallet_by_code(p_code)` pour l'espace client et `admin_search_wallets(p_query)` pour l'admin.

## Phase B — Report d'une réservation

- RPC `admin_reschedule_booking(p_kind, p_id, p_new_date, p_reason)` : transaction unique — vérifie la place dans le `daily_group` cible (crée le groupe si besoin via `find_or_create_daily_group`), déplace la réservation, ne touche ni au paiement Stripe ni aux crédits, écrit une ligne d'historique `report`, envoie l'email « réservation reportée ».
- Bouton « Reporter » (sélecteur de date + motif) sur chaque participant dans `/admin/journees`.

## Phase C — Annulation d'une journée entière

- RPC `admin_cancel_day(p_date, p_reason)` : annule tous les groupes de la journée, recrédite chaque client pack, annule les réservations visiteurs, libère les places, journalise, envoie un email personnalisé par client. Idempotent (ne recrédite pas deux fois un même booking déjà annulé).
- Bouton « Annuler cette journée » en tête de journée dans `/admin/journees`.

## Phase D — Emails

Trois templates cohérents avec l'identité (Navy/Orange, logo) :
- séance recréditée (existant, à harmoniser)
- réservation reportée (nouvelle date + rappel horaires)
- journée annulée (motif + invitation à reprendre une date)

Tous rappellent : « Les horaires seront communiqués la veille par téléphone selon les conditions météorologiques. »

## Phase E — Espace client

Dans `/mon-espace/:code` : bloc « Mes crédits disponibles » par activité (Kitesurf / Wingfoil / Pumpfoil…), avec achetées / consommées / recréditées / restantes, puis un historique chronologique des mouvements.

## Phase F — Tableau de bord admin

Nouvel onglet d'indicateurs : crédits utilisés, recrédités, restants, annulations météo, reports, journées annulées — filtrable par période.

## Phase G — Page « Gestion des crédits » (/admin/credits)

Recherche client (nom, email, code pack), portefeuille détaillé, ajout/retrait de crédits avec motif obligatoire, historique complet, filtres activité et saison, export CSV (séparateur `;`, UTF-8 BOM).

## Phase H — Liste d'attente

1. Table `daily_waitlist` (date, activité, nom, email, téléphone, participants, statut, token, expiration) + RLS (insertion publique, lecture admin) + GRANTs.
2. Bouton « Rejoindre la liste d'attente » sur `/reserver` quand la date+activité est complète.
3. Trigger sur annulation/libération de place → email au premier de la liste avec un lien de confirmation valable 24 h ; la place est bloquée pour lui pendant ce délai, puis passe au suivant (Edge Function `waitlist-confirm` + job de relance horaire).

## Détails techniques

- Toutes les opérations passent par des RPC `SECURITY DEFINER` avec contrôle `has_role(auth.uid(),'admin')`, en transaction unique, avec clés d'idempotence.
- Aucun appel Stripe : les paiements et l'historique de réservation restent intacts, seules les colonnes de statut et de crédits bougent.
- GRANTs explicites sur chaque nouvelle table/vue, RLS activée.
- Emails via la file existante (`enqueue_email` + `transactional_emails`).
- Vérification TypeScript à chaque phase.

## Ordre de livraison proposé

A → B → C → D → E → F → G → H, avec validation de votre part après C (cœur métier) et après G.
