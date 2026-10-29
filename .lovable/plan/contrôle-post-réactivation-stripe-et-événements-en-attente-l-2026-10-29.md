# Contrôle post-réactivation — Stripe et événements en attente (lecture seule)

Statut au 29/10 21:09 UTC : backend de nouveau actif (base et connexion répondent). Déjà constaté côté Stripe : aucun avis de paiement en échec ou en attente d'envoi ; dernier paiement le 21/10 18:39 UTC ; aucun paiement pendant la pause.

## Étapes (aucune écriture)

1. **Versions déployées** — journaux récents de `create-checkout` et `stripe-webhook` (présence de `operation`, `persistPayment`, messages propres à l'aperçu) pour dater la version en ligne. Aucun redéploiement.
2. **Schéma réel** — lister tables/fonctions (`stripe_payments`, `stripe_webhook_events`, `claim_stripe_webhook_event`, `book_stage_for_participants`, `get_payment_booking_status`, `client_packages`, `reservations`) et comparer aux appels de la version en ligne.
3. **Événements Stripe** — `checkout.session.completed` des 30 derniers jours : livraison, doublons, `pending_webhooks`.
4. **Rapprochement croisé** — pour chaque session payée : événement enregistré en base ? réservation ou pack confirmé lié à la session ? montant encaissé vs attendu ? Classer : payé sans réservation, réservation sans paiement vérifié, traitement incertain, absent vs échoué.
5. **14 commandes historiques** — même grille, preuves Stripe et base.
6. **Rapport** — preuves horodatées, limites, procédure de reprise idempotente proposée (par session, vérification préalable, pas de double réservation ni double e-mail).

## Interdits
Pas de rejeu de webhook, réservation, changement de statut, notification, remboursement, encaissement, migration, déploiement ni publication. Toute reprise attend une autorisation explicite séparée. Lots F-27/F-28 intacts.
