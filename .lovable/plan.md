# Rendre le code de l'aperçu sans danger tant que le journal des paiements n'est pas activé

## Constat (vérifié)
- Le webhook de l'aperçu appelle `persistPayment` (ligne 664) avant toute réservation. Cette fonction lève une erreur si la table `stripe_payments` est absente, et c'est le cas en base. Au prochain déploiement des fonctions, chaque paiement serait encaissé sans réservation, sans e-mail et sans pack.
- La page de confirmation d'un pack appelle `get_pack_payment_status`, absente elle aussi, et reste bloquée sur « en vérification ».
- Le tableau Revenus additionne `received ?? 0` : sans journal, tout tombe à 0 €. La fiche CRM perd aussi ses montants.
- En production, les événements Stripe sont tous traités jusqu'au 21/10 : la version en ligne est l'ancienne et n'est pas touchée pour l'instant.

## Correctifs proposés (aperçu, sans migration ni déploiement)
1. **Webhook** : si la table du journal est absente (erreur « relation n'existe pas » / PGRST205), journaliser un avertissement et continuer le traitement de la réservation. Toute autre erreur d'écriture reste bloquante. La vérification du montant encaissé et l'alerte d'écart restent actives sans dépendre de la table.
2. **Page de confirmation d'un pack** : si la fonction de statut est absente, se rabattre sur la vérification existante `get_payment_booking_status` et sur l'existence du pack lié à la session, au lieu de rester sur « en vérification ».
3. **Revenus** : si le journal est indisponible, afficher un bandeau « Journal des paiements non activé » et les totaux « À vérifier ». Ne jamais afficher 0 €, et ne pas compter 0 transaction comme un chiffre réel. L'ancien calcul théorique n'est pas rétabli, conformément à la règle « inconnu ≠ zéro ».
4. **CRM** : même traitement. Montants « À vérifier » avec la mention de la cause, jamais 0.
5. **Tests** : ajouter des tests pour la table absente (la réservation est créée, aucune erreur), une autre erreur d'écriture (bloquante), un statut de pack sans fonction en base (pas de blocage), et un dashboard sans journal (totaux inconnus, pas 0). Relancer les 116 tests existants.

## Hors périmètre
Aucune migration, aucun déploiement des fonctions, aucune publication, aucune modification de données. Lots F-27/F-28 intacts. Les deux alertes ne seront marquées corrigées qu'une fois les tests passés.
