# Rapprochement Stripe — 29/10/2026 (lecture seule)

Sources : base de production (réservations, packs) et Stripe en lecture seule (sessions, lignes, 7 remboursements au total sur le compte). Aucune écriture.

## 14 commandes historiques

| # | Client | Date | Pers. | Encaissé | Remboursé | Net | Base | Statut |
|---|---|---|---:|---:|---:|---:|---|---|
| 1 | De macedo Julie | 31/07 | 2 | 150 | 0 | 150 | résa confirmée, pack 3 séances (3/3 utilisées) | rapproché comme pack 3 séances, à confirmer par vous |
| 2 | Eliot Letac | 03/08 | 2 | 150 | 150 (25/08) | 0 | résa confirmée, pack 3 (1 utilisée) | **écart confirmé** : remboursé intégralement, réservation et pack toujours actifs |
| 3 | Gabrielle Achard | 04/08 | 2 | 50 | non vérifié* | ? | résa confirmée, note 100 € | écart confirmé (50 € pour 2), sauf si le remboursement du 26/08 est le sien |
| 4 | Nicolas Reina | 08/08 | 3 | 50 | 0 | 50 | note 150 € | écart confirmé (50 € pour 3) |
| 5 | Dennis Klingler | 06/09 | 2 | 50 | 0 | 50 | note 100 € | écart confirmé |
| 6 | stéphanie weiler | 06/10 | 2 | 150 | 0 | 150 | pack 3 (0 utilisée) | rapproché comme pack 3 séances, à confirmer |
| 7 | Martin Geoffrey | 11/10 | 3 | 50 | 0 | 50 | note 150 € | écart confirmé |
| 8 | Martin Geoffrey | 11/10 | 3 | 50 | 0 | 50 | note 150 €, session distincte | écart confirmé |
| 9 | Guigues Sarah | 11/10 | 2 | 50 | 0 | 50 | note 100 € | écart confirmé |
| 10 | Weiler Stéphanie | 13/10 | 2 | 50 | 50 (19/10) | 0 | résa confirmée, note 100 € | **annulation à vérifier** : remboursée, réservation encore confirmée |
| 11 | Thomas Lechifflart | 14/10 | 2 | 50 | 0 | 50 | note 100 € | écart confirmé |
| 12 | cheval chloé | 21/10 | 2 | 150 | 0 | 150 | ligne Stripe « Acompte » 3 × 50 €, pack 3 (0 utilisée) | pack 3 séances, **pas une surfacturation** |
| 13 | Cosima Ermert (Stage) | 27/08 | 1 | 250 | 250 (18/09) | 0 | pack Stage actif | annulation à vérifier : remboursé, pack actif |
| 14 | Jean-François Pantais (Stage) | 03/10 | 3 | 250 | 0 | 250 | 3 packs (1 payeur + 2 à 0 €) | non vérifiable : règle Stage à cette date non documentée |

\* Un remboursement de 50 € du 26/08 n'a pas été rattaché à une session.
Remboursements hors liste : Natacha Guillet (14/10, annulée, remboursée : cohérent) et Denis Wiliquet (2 × 50 € remboursés le 12/10, **deux réservations des 14 et 15/11 encore confirmées**).

## Annulations des 4, 5 et 14 octobre
- 04/10 Haddad Kassandra et 05/10 cros yoanne : réservation annulée avec note « doublon », Stage bien réservé via pack ; aucun remboursement. Paiement conservé pour le Stage.
- 14/10 Natacha Guillet : annulée et remboursée (50 €), puis nouvelle réservation Wingfoil le jour même.

## Correctif de l'acompte (non appliqué)
- En ligne : `quantity = nombre de séances du pack` (prouvé par 150 € = 3 × 50 € le 21/10).
- Correctif prêt dans l'aperçu : `create-checkout` + `_shared/checkout-operation.ts` (opération explicite, 50 € × participants pour une journée datée) ; contrôle `amount_total` dans le webhook.
- Aucune migration nécessaire pour `create-checkout`. Le webhook d'aperçu ne bloque plus si le journal est absent.
- Retour arrière : redéployer la version précédente des deux fonctions.
