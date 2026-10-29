# Plan d'exécution contrôlé — rapport (29/10/2026)

## Lot 1 — Stripe (lecture seule)
- Fichiers : `create-checkout/index.ts`, `_shared/checkout-operation.ts`, `stripe-webhook/index.ts`, `stripe-webhook/payment-ledger.ts`, `stripe-webhook/stage.ts`.
- Production (déduite des encaissements) : `quantity = séances du pack` (ex. 21/10 : 3 × 50 €). L'aperçu calcule 50 € × personnes (journée), prix du pack × 1 (pack), 250 € × personnes (Stage, montant contrôlé).
- Journal : absent → paiement poursuivi ; autre erreur → blocage (`ledger_missing_test.ts`).
- Tests : 353 réussis, 1 échec. `_tests/f27-checkout-capacity_test.ts` (écrit le 15/09, deux commits) envoie une requête sans type d'achat ; le correctif exige désormais `operation`, donc la requête est refusée. Échec attendu, test non modifié.
- Type d'achat manquant ou invalide : couvert dans `_shared/checkout-operation.ts` et ses tests.
- Retour arrière : redéployer la version précédente des deux fonctions. Dépendances : journal et statut de pack non appliqués (les deux ont un repli).
- Recommandation : déployable après votre autorisation ; mettre à jour la fixture F-27 dans un lot distinct.

## Lot 2 — Briefing en mode manuel (préparé, NON déployé)
- Fonction `daily-briefing` : un appel d'administrateur est toujours un aperçu (pas d'e-mail, pas d'écriture dans le journal d'envoi), vérifié côté serveur. Seule une tâche programmée pourrait envoyer, et aucune n'existe.
- Écran « Briefing du jour » dans l'Assistant admin : destinataire, période, chiffres « Données réelles », texte « IA — non envoyé », bouton Envoyer désactivé.
- Tests : 4/4 (heure de Paris, journée de la veille, administrateur jamais en envoi réel).
- En attente : redéploiement de la fonction pour que l'aperçu fonctionne (la version en ligne refuse les administrateurs).

## Lot 3 — Dossiers
- Les cinq fiches factuelles figurent dans `validation-2026-10-29.md` (inchangées, aucun statut modifié).
- Pantais (03/10) : la version du code en ligne ce jour-là (15/09) facturait le Stage `quantity = séances du pack` (5 × 50 € = 250 €), sans tenir compte du nombre de participants. Le prix de 250 € par personne n'apparaît que le 05/10. 250 € pour 3 personnes correspond donc au fonctionnement du site à cette date. Le tarif commercial affiché (399/499 €) n'est pas prouvé daté par ces sources.

## Lot 4 — WhatsApp (audit)
- Existant : uniquement des boutons de partage (articles). Aucune intégration WhatsApp Business.
- Limite : cette version du site peut envoyer des messages WhatsApp mais pas en recevoir.
- Options :
  - (a) Migration du site vers la version récente : réception possible, assistant IA branché sur les prix, le CRM et les disponibilités. Complexité élevée, risque de migration sur tout le site.
  - (b) Outil externe de messagerie WhatsApp avec IA, relié par lien : complexité moyenne, abonnement mensuel, peu d'intégration avec les réservations.
  - (c) Minimal : bouton « Écrire sur WhatsApp » vers votre téléphone + assistant du site existant, avec bascule vers vous. Complexité faible, pas de réponse automatique sur WhatsApp.
- Coûts à confirmer : conversations Meta (réponses gratuites dans la fenêtre de 24 h, modèles payants), crédits IA.
- Recommandation : (c) tout de suite ; (a) seulement après la stabilisation des paiements.
