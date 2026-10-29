# Contrôle final avant décision — 29/10/2026 (rien de déployé côté Stripe)

## Lot A — Briefing (fonction daily-briefing remise en ligne, aperçu seulement)
Fichiers : supabase/functions/daily-briefing/{facts.ts, facts_test.ts, index.ts}, src/components/admin/DailyBriefingPreview.tsx, src/services/assistant.service.ts.
- Faits séparés : `pendant_la_periode` (Stripe, réservations, packs de la veille) / `stock_actuel_ne_decrit_pas_la_veille` (nombre d'alertes non lues + dates extrêmes, actions, liste d'attente). Les titres d'alertes ne sont plus transmis à l'IA.
- Consignes IA : alerte ≠ preuve d'un événement de la veille ; « 0 réservation » obligatoire si aucune ; indisponible = dit indisponible.
- Contrôle après rédaction (`aiTextIsSafe`) : texte écarté s'il contredit les chiffres ; résumé fixe sans IA à la place (aperçu et e-mail).
- Coût IA : « Préparer l'aperçu » n'appelle jamais l'IA. « Rédiger avec l'IA » = 1 appel, texte conservé tant que la page est ouverte (le bouton disparaît ensuite). L'envoi programmé, s'il est un jour activé, appellerait l'IA une fois par jour.
- Tests : facts_test 4/4, briefing-utils 5/5 (9/9). Vérifié à l'écran : résumé sans IA puis une rédaction IA conforme (« 0 réservation », alertes présentées comme stock du 10/06 au 21/10).
- Journal e-mail du briefing : 0 ligne ; programmation : aucune.

## Lot B — Stripe : contrôle final
1. Parcours de paiement : un seul point d'entrée, `DepositPaymentSection` → `useDepositCheckout` → `create-checkout`. Il envoie toujours `operation` (stage / pack_purchase / dated_reservation). Aucun autre appel trouvé dans le site.
2. Test ancien conservé : `_tests/f27-checkout-capacity_test.ts` (F-27-01) échoue car il n'envoie pas `operation`, refusé par conception.
3. Empreintes candidates (SHA-256) — inclut les fichiers partagés :
   - create-checkout/index.ts 15daa831…07a4c · origin.ts f2e39651…34567c · participants.ts d31eefc4…e27e0e6
   - stripe-webhook/index.ts 37ecf476…f9abf147 · payment-ledger.ts 5f6b2441…65055 · stage.ts bdf59b03…94e09
   - _shared/checkout-operation.ts afb7a3f5…6fa1 · _shared/ffvl-licence-notice.ts c43695b5…bca9 · _shared/log-redact.ts 72ef4836…e61d
4. Limites : le code en ligne ne peut pas être lu, aucun journal d'exécution n'existe pour ces fonctions. La version en ligne est déduite (historique + paiements réels), pas comparée directement.
5. Restauration : aucun outil disponible ne permet de télécharger la version distante ni de revenir à un déploiement antérieur. La version précédente du dépôt N'EST PAS garantie identique à la version en ligne. Risque documenté : la seule restauration possible = redéployer la version du dépôt jugée la plus proche (antérieure au correctif), puis la valider par une session de paiement sans payer (montant affiché conforme à l'ancien calcul).
6. Prérequis : clés STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET présentes (valeurs non lues). Dépendances : stripe@14.21.0, supabase-js@2 (inchangées). Base : tables reservations, client_packages, package_bookings, stripe_webhook_events et fonctions book_stage_for_participants, claim/mark_stripe_webhook_event, enqueue_admin_notification, find_or_create_daily_group, public_rate_guard présentes. `stripe_payments` absente : toléré par conception. Réglage de vérification d'identité inchangé (désactivé, signature Stripe vérifiée dans le code).
7. Post-déploiement : sessions sans paiement (journée 2 pers. = 100 €, pack 3 = 150 €, Stage 2 pers. = 500 €) ; premier paiement réel → réservation/pack + e-mail « Acompte reçu ». Conditions d'arrêt (retour arrière immédiat) : montant différent de l'attendu, paiement sans réservation ou pack, erreur dans le journal du webhook, événement Stripe en échec.

Recommandation : prêt pour décision ; risque principal = restauration non garantie identique. En attente d'une autorisation distincte.

## Lot C — WhatsApp (aperçu, inchangé)
- Lien : https://wa.me/33672716905 (06 72 71 69 05), message « Bonjour, je souhaite des informations sur vos cours de kitesurf ».
- 360/390/430/719 px : aucun chevauchement boutons/barre « Réserver ». Ordinateur : boutons empilés en bas à droite.
- Statistiques : clic compté après « Tout accepter », aucun envoi après « Tout refuser ».
- Remarque : sur ordinateur, le bouton WhatsApp recouvre légèrement la fin de « Bateau d'assistance inclus » sur l'accueil.
En attente de l'autorisation de publication.
