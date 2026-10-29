# Plan d'exécution contrôlé — 4 lots

Règle commune : aucune modification de données métier ou de paiement, aucun remboursement ni annulation, aucun e-mail réel, aucun déploiement, aucune migration, aucune programmation, aucun accès élargi aux secrets. Chaque lot se termine par un rapport : ce qui a été inspecté, les preuves, les incertitudes, ce qui est préparé (non appliqué) et l'autorisation nécessaire pour la suite.

## Lot 1 — Vérification finale Stripe (lecture seule)
1. Comparer `create-checkout` et `stripe-webhook` de l'aperçu à la version en production (déduite des montants réels encaissés et des notes en base ; les journaux des fonctions sont vides, donc pas de lecture directe).
2. Relire et tester le calcul serveur : journée datée = 50 € × personnes ; pack = prix du pack × 1, sans journée créée ; Stage = 250 € × personnes, montant vérifié avant toute réservation.
3. Relancer les tests du journal des paiements : journal absent → le paiement continue ; autres erreurs → blocage.
4. Test en échec `f27-checkout-capacity_test.ts` : retracer son historique (2 commits connus), expliquer l'échec (requête sans type d'achat), sans le modifier.
5. Lister les tests qui couvrent un type d'achat manquant ou invalide.
6. Documenter le retour arrière (version précédente des deux fonctions) et les dépendances (journal non appliqué, fonction de statut de pack absente).

## Lot 2 — Briefing quotidien en mode manuel (préparé, sans envoi)
- Ajouter un mode « aperçu » à la fonction du briefing : elle calcule les données et le texte IA, ne met rien en file d'envoi et n'écrit rien dans le journal d'envoi.
- Écran d'administration « Briefing du jour » : destinataire affiché (crosyo69@gmail.com), période couverte (veille, heure de Paris), chiffres réels étiquetés « réel » (Stripe, réservations, packs, alertes, actions, liste d'attente) et texte IA étiqueté séparément.
- Bouton « Envoyer » présent mais désactivé dans ce lot ; plus tard, il exigera une confirmation et sera protégé contre le double envoi (une fois par jour, déjà prévu côté serveur).
- Accès réservé aux administrateurs, vérifié côté serveur ; secrets uniquement côté serveur.
- Tests : période et fuseau horaire, mode aperçu sans écriture ni envoi, refus pour un non-administrateur.
- Le passage en mode aperçu demande de redéployer la fonction du briefing (fonction hors paiement, déjà en ligne mais jamais déclenchée) : autorisation demandée séparément avant ce redéploiement.

## Lot 3 — Dossiers historiques (lecture seule)
- Une fiche par dossier (Gabrielle Achard, Eliot Letac, Stéphanie Weiler 13/10, Cosima, Denis Wiliquet) : paiements et remboursements Stripe avec dates et motif déclaré, réservation, pack, séances utilisées, historique des crédits, e-mails envoyés, notes admin. Aucune supposition sur le cours effectué ; les manques sont listés.
- Jean-François Pantais (paiement du 03/10) : rechercher dans l'historique du code et des documents le tarif du Stage avant le 05/10 (le prix Stripe de 250 € par personne est présent dans la version du 05/10), les pages tarifs et les e-mails de confirmation de l'époque. Conclusion seulement si une preuve datée existe.

## Lot 4 — Audit WhatsApp et chiffrage (sans modification)
- Constat de départ : sur cette version du site, l'envoi WhatsApp est possible mais pas la réception des messages entrants.
- Comparer : (a) migration du site vers la version qui reçoit les messages, (b) outil externe de messagerie relié au CRM, (c) solution minimale : bouton WhatsApp et formulaire existant + assistant du site, avec transfert vers vous.
- Pour chaque option : complexité, coûts récurrents à confirmer (Meta, crédits IA), sécurité, risques, intégration CRM et réservations, recommandation.

## Détails techniques
- Lot 2 : paramètre `preview: true` dans `daily-briefing`, appelé via une route admin vérifiant `has_role(admin)` ; nouvelle page sous l'administration existante, en suivant la structure services/hooks.
- Aucune migration ; `cron_invoke_edge_function` inchangée.
