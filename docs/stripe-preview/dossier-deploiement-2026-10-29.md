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

---

# Complément du 29/10 (contrôles avant autorisation)

## A. Références exactes de la version préparée (SHA-256 des fichiers)
| Fichier | SHA-256 |
|---|---|
| create-checkout/index.ts | 15daa83118a7501e2a3e390d255704c2661aa7dced99700cb7961cfff8407a4c |
| create-checkout/origin.ts | f2e39651c695efa60cbc49bf633644bcb90ced7612f811bce13dea851934567c |
| create-checkout/participants.ts | d31eefc457bf2afffe20835bf161f678d9bb61108b64b24622d3741fcc27e0e6 |
| stripe-webhook/index.ts | 37ecf47623f90862d5c214590a12df3810243341f9db7d224f8f16d6f9abf147 |
| stripe-webhook/payment-ledger.ts | 5f6b2441c5c07fd781eece49f24b48704b2d2977426f11d822370a98e0865055 |
| stripe-webhook/stage.ts | bdf59b03c948372c608653a0e8550f629b034460cd1d653e82a7fe9e5c094e09 |

Dernier commit touchant ces fonctions : ce84bc9.

## B. Limites de la comparaison avec la production
- Le code en ligne n'a pas pu être téléchargé et aucun journal d'exécution n'existe pour ces deux fonctions.
- Ce dossier ne contient donc PAS de comparaison directe. La version en ligne est une déduction, à partir de l'historique du dépôt (commit 401b17e, `quantity: packSessions`) et de paiements Stripe réels cohérents avec ce calcul (ex. 21/10 : 150 € = 3 × 50 € pour un pack de 3, et 50 € encaissés pour 2 ou 3 personnes).
- Avant un déploiement, la version en ligne ne peut être confirmée qu'indirectement.

## C. Différences fonctionnelles par type d'achat (déduites)
| Achat | En ligne (déduit) | Version préparée |
|---|---|---|
| Journée datée | séances du pack × 50 €, participants ignorés | 50 € × participants, pack par défaut ignoré |
| Pack individuel | séances × 50 € | prix du pack pour 1 personne, aucune journée réservée ; pack multi-personnes refusé |
| Stage 100 % Glisse | 250 € × participants avec contrôle A0 (depuis le 05/10) | identique, `amount_total` vérifié, sinon aucune réservation + alerte |
| Requête sans type d'achat | acceptée | refusée |

## D. Tests (relancés ce soir)
- create-checkout : 42/42 · stripe-webhook : 50/50 · briefing : 5/5.
- Journée : « Réservation n personne(s) : … centimes, pack par défaut ignoré », « Réservation datée : aucun pack de crédits supplémentaire ».
- Pack : « Pack individuel n séances », « Pack individuel : crédits créés, aucune réservation même si une date est fournie », « Pack multi-personnes refusé », « Ancien pack ambigu refusé ».
- Stage : « Stage 2 personnes : 500 euros et 5 jours », T1–T11 (250 € × n), T7 anomalie de montant → aucun appel, T8/T9/T10.
- Journal : « missing ledger table does not block booking », « other ledger write errors stay blocking ».
- Test ancien en échec, laissé inchangé : `_tests/f27-checkout-capacity_test.ts`, cas « F-27-01 wingfoil : 1 et 3 participants acceptés » (10 réussis, 1 échec). Il envoie une requête sans `operation`, désormais refusée par conception.

## E. Contrôles pré-déploiement
1. Vérifier que les empreintes ci-dessus correspondent aux fichiers à déployer.
2. Relancer les tests create-checkout et stripe-webhook (tous verts).
3. Stripe : aucun paiement en cours, aucun envoi d'événement en échec.
4. Noter le commit de retour arrière (version antérieure au correctif).

## F. Retour arrière
Redéployer la version antérieure des deux fonctions depuis l'historique du dépôt. Rien à défaire en base (le correctif n'a aucune migration).

## G. Contrôles post-déploiement
1. Session de paiement sans payer : journée 2 personnes = 100 € ; pack 3 séances = 150 € ; Stage 2 personnes = 500 €.
2. Premier paiement réel : réservation ou pack créé, e-mail « Acompte reçu », aucune erreur dans les journaux du webhook.
3. Stripe : aucun événement en échec dans l'heure.
4. En cas d'écart : retour arrière immédiat.

En attente d'une autorisation explicite. Rien n'a été déployé.
