# Rapport de prépublication — 29/10/2026

## A. Corrections réalisées
- src/components/WhatsAppButton.tsx : sur ordinateur (≥ 768 px), le bouton est placé à gauche de l'assistant, sur la même ligne en bas à droite (au lieu d'être empilé au-dessus). Mobile inchangé (empilé au-dessus de la barre « Réserver »). Taille 56×56 px, couleur, numéro 06 72 71 69 05, message pré-rempli, lien et suivi « whatsapp_click » inchangés.
- Aucune autre modification dans ce lot.

## B. Vérifications
- Largeurs testées : 360, 390, 430, 719, 768, 1024, 1280, 1366, 1440, 1920 px.
  - Aucun chevauchement WhatsApp/assistant, ni avec la barre « Réserver » (mobile).
  - « Bateau d'assistance inclus » libre de 1280 à 1920 px.
  - Limite : à 1024×768, les deux boutons flottants (assistant compris, déjà le cas avant) recouvrent la fin du bouton « 06 72 71 69 05 » de l'accueil au premier affichage ; sur mobile, les boutons flottants passent au-dessus du contenu qui défile (comportement normal d'un bouton flottant).
- Suivi : clic compté après « Tout accepter », rien après « Tout refuser » (contrôle précédent, logique inchangée).
- Briefing (aucune modification) : 9/9 tests ; appel sans compte admin → 403 ; page admin sans session → redirection vers la connexion ; « Préparer l'aperçu » avec compte admin : blocs veille/stock séparés, résumé sans IA, aucun appel IA enregistré (journal des appels IA vide sur la fenêtre du test) ; bouton « Envoyer » désactivé.
- Stripe : tests inchangés (42/42 création, 50/50 réception), non relancés dans ce lot.

## C. Stripe — état technique (NON DÉPLOYÉ)
Empreintes SHA-256 (début…fin) de la version candidate :
- 15daa83118a7  supabase/functions/create-checkout/index.ts
- f2e39651c695  supabase/functions/create-checkout/origin.ts
- d31eefc457bf  supabase/functions/create-checkout/participants.ts
- 37ecf47623f9  supabase/functions/stripe-webhook/index.ts
- 5f6b2441c5c0  supabase/functions/stripe-webhook/payment-ledger.ts
- bdf59b03c948  supabase/functions/stripe-webhook/stage.ts
- afb7a3f507e1  supabase/functions/_shared/checkout-operation.ts
- c43695b5ea69  supabase/functions/_shared/ffvl-licence-notice.ts
- 72ef48367872  supabase/functions/_shared/log-redact.ts
- Différences vérifiables : aucune comparaison directe possible ; différences déduites de l'historique et des paiements réels (voir dossier-deploiement et controle-final du 29/10).
- Restauration exacte NON garantie : le code en ligne ne peut pas être lu ; aucun journal d'exécution pour ces fonctions ; aucun historique des déploiements accessible avec mes outils. Seule une restauration approximative (version du dépôt jugée la plus proche) serait possible, ce qui n'est pas une restauration garantie.

## État avant publication
- Site : PRÉPARÉ, NON PUBLIÉ.
- Stripe : NON DÉPLOYÉ.
- Briefing : AUCUN EMAIL ENVOYÉ (journal : 0).
- Programmation automatique : NON ACTIVÉE (0 tâche programmée).
- Aucune donnée client ou réservation modifiée.

## Restant éventuel
- Chevauchement des boutons flottants avec le bouton téléphone à 1024×768 (préexistant pour l'assistant).
- En-tête de l'accueil à 1024 px : logo et menu se touchent (préexistant, non modifié).
- Fixture F-27 à mettre à jour dans un lot séparé.
