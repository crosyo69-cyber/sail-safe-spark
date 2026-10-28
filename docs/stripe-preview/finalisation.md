# Finalisation Stripe — préparation partielle, lot bloqué

## Autorisation et résultat
Travail en aperçu et lecture seule des sources historiques. Aucune migration appliquée/enregistrée, réservation historique modifiée, publication, fonction déployée, collecte, remboursement, SMS ou e-mail réel. Le SQL ajouté est un brouillon sous docs, non exécuté.

## Rapprochement
L'ancien rapport a été retrouvé dans l'historique du chat : il nomme les 14 commandes (8 carte à 50 €, 4 carte à 150 €, 2 Stage). Le tableau complémentaire conserve ces 14 lignes, et non 14 dettes établies. Deux commandes Geoffrey Martin sont distinctes par date/session, pas un doublon déduit du nom.

Les 12 montants carte sont repris du rapprochement Stripe antérieur conservé, pas d'une nouvelle certification intégrale des remboursements. Deux sessions Stage ont été relues avec charge : Cosima, 250 € capturés et 250 € remboursés, net 0 ; Jean-François, 250 € capturés, aucun remboursement sur la charge relue. L'ancienne règle Stage à la date d'achat reste à documenter : ne pas appliquer rétroactivement le nouveau 750 €.

Les lectures de la base ont ensuite échoué (« database possibly not accessible ») : plusieurs identifiants de réservation, notes exactes et états d'incident ne sont pas certifiés. Le tableau distingue montant dashboard historique et montant CRM fixe historique. Les lignes ne valent ni créance ni instruction de régularisation.

## Calculs CRM / assistant
- Audit des fonctions crm_client_base/detail/dashboard/list, assistant_query/business/top_clients/packs/meilleure_activite, assistant_briefing et assistant_financial_summary : revenus théoriques, dépôts persistés non prouvés, tarifs catalogue et compensation par email.
- SQL gelé inchangé. Aperçu CRM liste/dashboard : revenus non certifiés nuls ; affichage/export « À vérifier », pas zéro. Fiche : conserve les lignes sans session comme inconnues et ajoute les paiements ledger-only ; revenu historique global reste inconnu.
- Assistant : masquage récursif des montants à la frontière navigateur et avant l'envoi des résultats au modèle ; opérations conservées, soldes inconnus. La fonction serveur n'est pas déployée, donc le chat hébergé reste soumis à l'ancien serveur.
- Brouillon admin_verified_payment_report : reçu brut par session unique et paid_at, attendu/écart séparés ; solde NULL faute de prix contractuel ; net NULL faute de journal des remboursements. Ne prétend pas résoudre les encaissements nets.
- Calcul isolé : prix 240 €, reçu 50 €, attendu 100 € → écart 50 €, solde 190 €, jamais 240 € ; surpaiement conserve l'écart négatif.

## Incidents / reprise
Webhook aperçu : une réservation doit être confirmed ET liée à la session avant confirmation/pack. Pending, cancelled ou mauvaise session donnent 500 et aucune confirmation.

Non résolus : réclamation permanente reçue mais non terminée ; événement distinct/même session ; complétion perdue ; incident/alerte non atomiques ; pending e-mail sans preuve d'outbox ; Stage replay insuffisamment vérifié ; session de paiement confirmée par RPC insuffisamment liée à la prestation attendue. Conception dans incident-recovery.md ; elle n'est pas une implémentation de reprise. Aucun incident réellement repris, aucune clôture annoncée.

## Tests réellement exécutés
Les 90 précédents = 87 Deno + 3 Bun : simulations uniquement, pas SQL/concurrence réelle.

Nouvelle exécution :
| Suite | Résultat |
|---|---:|
| create-checkout/index_test.ts | 16 |
| create-checkout/origin_test.ts | 14 |
| create-checkout/s3_stage_price_test.ts | 12 |
| stripe-webhook/dedup_test.ts | 6 |
| stripe-webhook/stage_test.ts | 10 |
| stripe-webhook/paid_without_booking_test.ts | 13 |
| stripe-webhook/payment-ledger_test.ts | 19 |
| **Deno total** | **90 réussis, 0 échec** |
| accounting.test.mjs | 3 |
| provenance.test.mjs | 8 |
| checkout-rules.test.mjs | 15 |
| **Bun total** | **26 réussis, 0 échec** |

Premier passage : 82/87 Deno passaient, 5 mocks ne fournissaient pas le statut confirmed nouvellement requis. Fixtures corrigées et 3 tests négatifs ajoutés ; nouvelle exécution complète 90/90. Les tests existants de déduplication ne certifient toujours pas une reprise après crash ni une concurrence SQL.

Commandes : deno test --allow-env --allow-read --no-check sur les 7 fichiers ci-dessus ; bun test src/features/payment/*.test.mjs. Deno check a également réussi pour checkout-operation.ts, stripe-webhook/index.ts, admin-assistant/index.ts et create-checkout/index.ts. Contrôle automatique navigateur : build OK.

Pas de test SQL appliqué, pas de paiement E2E hébergé ; activation interdite et journal non installé. Les tests de parcours confirment 1 séance datée, packs kite 3/5/10, wing 3/5, Stage 1..4 et 250 €/personne ; ils ne créent pas de session Stripe réelle.

## Fichiers modifiés dans cette finalisation
- AGENTS.md, roadmap.md
- src/features/payment/accounting.ts, provenance.test.mjs, checkout-rules.test.mjs
- src/components/admin/crm-types.ts, AssistantFinances.tsx, AssistantBriefing.tsx
- src/services/crm.service.ts, assistant.service.ts
- src/pages/AdminCRM.tsx
- supabase/functions/_shared/financial-provenance.ts
- supabase/functions/admin-assistant/index.ts
- supabase/functions/stripe-webhook/index.ts, dedup_test.ts, paid_without_booking_test.ts
- docs/stripe-preview/financial-reports.sql, incident-recovery.md, rapprochement-14.md, finalisation.md

## Bloqueurs avant validation
1. Prix/règles contractuels historiques et état de remboursement carte non certifiés ; IDs manquants après panne de lecture.
2. Reprise atomique, fencing, verrou session, outbox et vérification Stage complète non implémentés/testés en environnement isolé.
3. Journal des remboursements absent : reçu brut n'est pas reçu net ; aucune couverture historique certifiée.
4. Rapports SQL non appliqués, serveur aperçu non déployé ; E2E connecté du nouveau parcours non disponible sans activation explicitement interdite.

**Conclusion : progrès vérifiés, aucune affirmation de fin de lot ou autorisation de déploiement.**