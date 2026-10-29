# Contrôle post-réactivation — Stripe et événements en attente (lecture seule)

Statut au 29/10 21:05 UTC : le backend est en cours de redémarrage. Le contrôle démarre seulement quand il est confirmé actif.

## Étapes (aucune écriture)

1. **Disponibilité** — re-vérifier l'état du backend jusqu'à « actif », puis une lecture simple de test.
2. **Versions déployées** — consulter les journaux récents de `create-checkout` et `stripe-webhook` (messages, champs metadata `operation`, appels à `persistPayment`) pour établir si la version en ligne est l'ancienne ou celle de l'aperçu. Aucun redéploiement.
3. **Schéma réel** — lister tables et fonctions présentes (`stripe_payments`, `stripe_webhook_events`, `claim_stripe_webhook_event`, `book_stage_for_participants`, `get_payment_booking_status`, etc.) et les comparer à ce que la version déployée appelle.
4. **Événements pendant la pause** — lire `stripe_webhook_events` et les journaux du webhook (erreurs, 5xx, doublons) ; côté Stripe, en lecture seule : événements `checkout.session.completed` et sessions payées depuis le début de la pause, avec leur statut de livraison.
5. **Rapprochement croisé** — pour chaque session payée : événement reçu ? réservation/pack confirmé lié à la session ? montant encaissé = montant attendu ? Classer : payé sans réservation, réservation sans paiement vérifié, traitement incertain, simplement absent vs réellement échoué.
6. **Les 14 commandes historiques** — même grille, preuves Stripe + base.
7. **Rapport** — preuves, horodatages, limites, et procédure de reprise idempotente proposée (par session, vérification préalable de l'existant, jamais de double réservation ni d'e-mail en double).

## Interdits
Pas de rejeu de webhook, réservation, changement de statut, notification, remboursement, encaissement, migration, déploiement ni publication. Toute reprise attend votre autorisation explicite et séparée. Lots F-27/F-28 intacts.
