# Dossier de déploiement — correctif Stripe (NON DÉPLOYÉ)

Statut : préparation uniquement. Aucun déploiement, aucune donnée ni configuration de production modifiée.

## 1. Fonctions concernées
| Fonction | Version en ligne | Version corrigée |
|---|---|---|
| `create-checkout` | Ancienne version (`quantity: packSessions`, commit 401b17e). Aucun journal d'exécution disponible : version déduite des paiements réels (21/10 : 150 € = 3 × 50 € pour un pack de 3). | Dépôt actuel (dernier commit fonctions : ce84bc9) |
| `stripe-webhook` | Ancienne version (montants théoriques `participants × 50 €`, sans contrôle de `amount_total` hors Stage A0). | Dépôt actuel |

Limite : le code source exact en ligne ne peut pas être téléchargé ; la comparaison repose sur l'historique du dépôt et les données Stripe.

## 2. Montants vérifiés côté serveur (version corrigée)
- `dated_reservation` : 50 € × participants (quantité calculée côté serveur, jamais par le navigateur).
- `pack_purchase` : prix du pack pour 1 personne, aucune journée réservée automatiquement.
- `stage` : 250 € × participants ; `amount_total` doit être égal, sinon aucune réservation et alerte admin.
- Requête sans `operation` explicite : refusée.

## 3. Persistance et journal des paiements
- Table `stripe_payments` absente (brouillon `payment-ledger.sql` non appliqué) → le paiement continue normalement (réservation, pack, e-mails). Codes détectés : 42P01 / PGRST205.
- Toute autre erreur d'écriture → traitement bloqué, Stripe relivre l'événement.
- Page de confirmation pack : repli sur `get_payment_booking_status` si `get_pack_payment_status` manque.

## 4. Tests
- Serveur : 353 réussis, 1 échec : `_tests/f27-checkout-capacity_test.ts`. Ce test (15/09) envoie une requête sans `operation` ; la version corrigée l'exige et la refuse. Échec attendu, à corriger dans un lot séparé (ajouter `operation: "dated_reservation"` à la fixture).
- Comptables/interface : 26/26. Journal absent / autre erreur : `ledger_missing_test.ts`.

## 5. Prérequis de schéma
Aucun pour le correctif. Le journal `stripe_payments` et ses RPC restent optionnels, à approuver séparément.

## 6. Restauration
- Le code de la version précédente reste dans l'historique du dépôt (commit 401b17e et suivants antérieurs au lot S3).
- Retour arrière = redéployer cette version des deux fonctions. Rien à défaire en base.
- À faire juste avant un futur déploiement : figer le commit de référence dans ce dossier.

## 7. Plan de déploiement (futur, sur autorisation)
1. Créneau calme (aucun paiement en cours, vérifier Stripe).
2. Déployer `stripe-webhook` puis `create-checkout` ensemble.
3. Contrôles immédiats (section 8). En cas d'anomalie : retour arrière immédiat.

## 8. Contrôles après déploiement
- Ouvrir une session de paiement test pour 2 personnes (journée) : montant affiché 100 €, sans payer.
- Pack de 3 séances : 150 €, aucune journée réservée.
- Journaux de `stripe-webhook` : aucune erreur au premier paiement réel ; réservation + e-mail « Acompte reçu » présents.
- Stripe : aucun envoi d'événement en échec.

## Recommandation
Déployable. Mettre à jour la fixture F-27 dans un lot distinct. En attente de votre autorisation explicite.
