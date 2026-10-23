# Correction Stripe — état de préparation, pas d'activation

## Cause et choix confirmé
`totalSessions` déterminait la quantité Stripe alors que participants déterminait les notes, le pack et les revenus. Les deux nombres pouvaient diverger. L'utilisateur a confirmé : achat de pack individuel sans aucune journée réservée automatiquement.

## Préparé et testé
- Contrat explicite : dated_reservation, pack_purchase, stage ; montant attendu dérivé côté serveur. Journée : 50 €/participant ; pack individuel 3/5/10 kite ou 3/5 wing : 50 €/séance ; Stage : 250 €/participant, cinq jours inchangés.
- Pack : pas de date ni de groupe ; crédits seuls. Réservation datée nouvelle : pas de pack supplémentaire. Ancien achat multi-séances ambigu rejeté avant Stripe.
- Montant réellement payé en centimes, EUR et statut paid vérifiés avant toute écriture de paiement. Attendu et écart séparés, alerte en cas d'écart, pas de remboursement automatique.
- Brouillon de journal `payment-ledger.sql` NON APPLIQUÉ, accès lecture admin et insertion serveur, unicité par session. Aucun historique rempli.
- Notes, dépôt du pack et confirmations utilisent le montant Stripe réel. Protections existantes de réservation vérifiée et clés d'e-mail conservées.
- Tableau revenus et fiche CRM ne substituent plus une estimation au montant réel : « À vérifier » si aucune preuve. Calcul isolé du solde = prix total réel - encaissé, sans ajouter de nouveau l'écart. Prix total inconnu = solde inconnu.
- 87 tests Deno checkout/webhook et 3 tests Bun comptables passent, mocks uniquement, sans permission réseau de test.
- Aperçu : sélection de pack 3 à 150 € sans date/participants ; journée deux participants à 100 € vérifiée au navigateur, aucun appel checkout effectué.

## Non terminé / blocages avant activation
1. Le journal et les RPC de lecture n'existent pas sur le backend partagé : les preuves réelles ne peuvent pas être lues dans l'administration tant que le brouillon n'est pas validé et appliqué. Pas d'end-to-end hébergé du nouveau pack possible sans cette activation.
2. Reprise après réclamation : le RPC existant claim_stripe_webhook_event ne reprend pas un événement déjà réclamé, même indéterminé. La correction conserve ce comportement et ne prétend pas l'avoir réparé. Écriture du journal déplacée avant réclamation pour ne pas consommer l'événement si elle échoue ; les incidents ultérieurs restent soumis à cette limite. Une reprise atomique avec réconciliation de réservation et lease doit être conçue/testée séparément avant déploiement.
3. Les calculs SQL CRM globaux et assistant (briefing, query business, financial_summary) restent théoriques : aucune fonction gelée F-28 modifiée. La fiche CRM corrige son affichage de paiement via le service, pas ces RPC globaux. La préparation comptable n'est donc pas complète.
4. Rapprochement : 12 écarts retrouvés et comparés à Stripe ; impossible d'affirmer qu'ils constituent exactement les 14 commandes de l'ancien audit, sa liste n'étant pas conservée dans le projet. Attendu historique exact reste à vérifier lorsque pack et réservation étaient confondus. Ne pas régulariser selon la nouvelle règle rétroactivement.
5. Le typage navigateur est validé par le contrôle automatique. Les tests Deno ont été exécutés avec --no-check (convention actuelle) ; pas de certification de typage serveur exhaustive.

## Interdictions respectées
Aucun paiement, remboursement, SMS, e-mail client réel, mise à jour historique, migration appliquée, déploiement serveur ni publication. Les règles SQL de réservations, Stage, capacité et météo n'ont pas été modifiées. Le brouillon SQL n'est pas une migration enregistrée.

**Conclusion : préparation partielle, pas prêt pour déploiement.**
