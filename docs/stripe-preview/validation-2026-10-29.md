# Validation avant déploiement — 29/10/2026 (lecture seule)

## A. Correctif Stripe (aperçu, non déployé)
- Réservation datée : 50 € × participants, calculé côté serveur.
- Pack individuel : prix du pack pour 1 participant, aucune journée réservée automatiquement.
- Stage : 250 € × participants (1 à 4), contrôle `amount_total` dans le webhook, sinon aucune réservation et alerte admin.
- Journal `stripe_payments` absent (codes 42P01 / PGRST205) : avertissement dans les journaux, la réservation continue. Test `ledger_missing_test.ts`.
- Toute autre erreur d'écriture du journal bloque le traitement (test : délai dépassé → rejet).
- Tests : fonctions serveur 353 réussis, 1 échec préexistant (`f27-checkout-capacity_test.ts`, champ `operation` manquant dans la fixture, déjà signalé avant ces changements). Tests unitaires de l'interface : 26/26.
- Les « 78 erreurs » : la commande lançait aussi 58 fichiers de tests navigateur Playwright (faits pour `playwright test`) et 1 fichier Deno. Ce sont des erreurs d'environnement, pas des échecs ni des régressions.
- Retour arrière : redéployer la version précédente de `create-checkout` et `stripe-webhook` ; aucune donnée ni migration à défaire.

## B. Fiches de décision (aucune régularisation)
| Cas | Transactions | Remboursements | Réservation / pack | Constat | Manque |
|---|---|---|---|---|---|
| Gabrielle Achard | 04/08, 50 € (2 pers., Wingfoil 06/08) | aucun (le 50 € du 26/08 concerne une session du 22/07) | confirmée ; pack 1 séance, 1 utilisée, acompte noté 100 € | 50 € encaissés pour 2 personnes | accord commercial éventuel |
| Eliot Letac | 03/08, 150 € (2 pers., Wingfoil 14/08) | 150 € le 25/08 | confirmée ; pack 3 séances, 1 utilisée | net 0 € avec réservation et pack actifs | motif du remboursement, cours effectué ou non |
| Stéphanie Weiler 13/10 | 50 € (2 pers., Wingfoil 15/10) | 50 € le 19/10 (« demandé par le client ») | confirmée ; pack 1, 1 utilisée | net 0 € avec réservation confirmée | cours effectué ou non |
| Cosima (Stage) | 27/08, 250 € | 250 € le 18/09 | pack Stage actif, 5/5 utilisées | net 0 € avec pack actif | motif, séances réellement suivies |
| Denis Wiliquet | 09/10, 2 × 50 € (Kitesurf 14 et 15/11) | 2 × 50 € le 12/10 | 2 réservations encore confirmées | net 0 € avec 2 réservations futures actives | annulation voulue ou non |
| Jean-François Pantais | 03/10, 250 € (3 pers., Stage 19/10) | aucun | 1 pack payeur + 2 packs à 0 € ; réservation parasite annulée | 250 € pour 3 personnes | règle Stage en vigueur le 03/10 |

## C. Réglage bloquant le briefing
- Fonction concernée : `cron_invoke_edge_function`, qui permet aux tâches planifiées d'appeler une fonction serveur. Elle n'accepte qu'une liste fixe de fonctions ; il faut y ajouter `daily-briefing`.
- Elle lit la clé protégée `email_queue_service_role_key` dans le coffre de secrets (valeur jamais affichée).
- Toute modification de base qui touche au coffre est refusée par le réglage de permission « accès de l'agent aux secrets » du projet.
- Autoriser cet accès permet à l'agent de modifier des fonctions qui lisent ce coffre, sans jamais en afficher les valeurs.
- Alternatives : (1) autoriser ponctuellement, puis retirer l'autorisation ; (2) l'appliquer vous-même avec le texte SQL préparé ; (3) déclencher le briefing depuis un bouton de l'administration, sans programmation.
- Programmation prévue : deux déclenchements par jour, 07:00 et 08:00 UTC. La fonction n'envoie que lorsqu'il est 9h à Paris (Europe/Paris, heure d'été comme d'hiver), une seule fois par jour.

## D. Aperçu (données réelles du 28/10, texte IA non généré)
- Stripe : 0 paiement (réel).
- Réservations créées : 0 ; packs : 0 (réel).
- Alertes non lues : 304, dont les 10 dernières de niveau « info » (« Nouvelle réservation », « Débit manuel — Natacha Guillet ») (réel).
- Actions à valider : 0 ; liste d'attente : 0 ; groupes du 29/10 : 0 (réel).
- Texte rédigé (simulé) : « Journée calme hier : aucun paiement, aucune réservation ni pack. 304 alertes restent non lues, toutes informatives ; un tri est conseillé. Aucune action à valider ni personne en liste d'attente. Priorité du jour : marquer les anciennes alertes comme lues. »
