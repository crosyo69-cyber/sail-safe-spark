# Audit de sécurité post-publication — 29/10/2026, version 83e8c5f (lecture seule)

## A. Résumé
Aucune vulnérabilité critique ou élevée constatée. Scan approfondi lancé, résultats en attente.

## B/C. Critiques / élevées constatées
Aucune.

## D. Moyennes
- Dépendances : `bun audit` signale 136 alertes (1 critique `proxy-addr`, via express ← @modelcontextprotocol/sdk ← @lovable.dev/mcp-js). Ces paquets sont côté serveur et ne sont pas exécutés dans le site publié ; risque réel faible. Recommandation : mise à jour groupée des dépendances dans un lot dédié, avec tests.

## E. Faibles / recommandations
- Pas d'en-tête Content-Security-Policy ni X-Frame-Options sur le site public (HSTS, nosniff, Referrer-Policy présents). Risque : clickjacking théorique. Recommandation : ajouter une CSP via balise meta, lot séparé.
- `waitlist_free_seats` exécutable par tout compte connecté : ne renvoie qu'un nombre de places, aucune donnée personnelle.
- Bucket `email-assets` listable : déjà ignoré par vous.
- Linter : 25 fonctions publiques et 67 pour comptes connectés signalées ; les 25 publiques sont les parcours voulus (session/jeton/OTP, disponibilités, journal 404/analytics), toutes avec search_path fixé.

## F. Contrôles réussis (exécutés pendant l'audit)
- Scan rapide : aucun constat actif. RLS activée sur toutes les tables ; aucun droit direct anonyme sur les tables.
- Lecture anonyme refusée : réservations, packs, fiches CRM, rôles.
- Fonctions sans compte : briefing 403, assistant admin 401, SMS 401, webhook Stripe 400 (signature exigée).
- Toutes les fonctions serveur contiennent un contrôle d'accès ou de signature.
- Fonctions réservées aux comptes connectés : les 4 sans `has_role` explicite sont protégées autrement (e-mail du compte, contrôle interne marketing) ou sans donnée personnelle.
- Aucune clé secrète (Stripe, Resend, Brevo, service) dans les fichiers publiés.
- Briefing : 0 e-mail envoyé, aucune programmation (contrôle du même soir).

## G. Non vérifié
- Version en ligne des fonctions Stripe (non lisible).
- Résultats du scan approfondi (en cours).
- Routes admin non retestées dans le navigateur ce soir (validées plus tôt).

## H. Priorités
1. Intégrer le scan approfondi. 2. CSP / anti-iframe. 3. Mise à jour des dépendances.

## Statut : SÉCURITÉ VALIDÉE AVEC RÉSERVES (scan approfondi en attente).

---
# Complément — 29/10/2026 23:18 Paris

## Scan approfondi
Non terminé au moment du complément (état « inconnu », aucun résultat publié). Non intégré : reste à faire.

## Analyse des dépendances de production (62 paquets contrôlés)
| Dépendance | Version | Sévérité outil | Dans le site public | Exposition réelle | Recommandation | Risque de régression |
|---|---|---|---|---|---|---|
| @lovable.dev/mcp-js (express, proxy-addr, MCP SDK, fast-uri, body-parser, hono) | 0.23.0 | 1 critique + hauts | Non : sert au connecteur assistant (MCP), hors pages | Faible : la faille proxy-addr exige un réglage « proxy de confiance » ; serveur MCP en lecture (infos école, réservations de l'utilisateur connecté) | Mettre à jour mcp-js quand une version corrigée existe | Moyen (connecteur MCP) |
| xlsx | 0.18.5 | haut | Non : importé nulle part | Nulle | Retirer la dépendance | Nul |
| dompurify | 3.3.1 | haut | Oui (articles de blog) | Faible : la faille concerne le mode IN_PLACE, non utilisé | Mettre à jour vers ≥3.4.17 | Faible |
| jspdf (dompurify) | 4.2.1 | haut | Admin seulement (export PDF) | Faible | Mise à jour | Faible |
| recharts (lodash `_.template`) | 2.15.4 | haut | Admin seulement | Nulle : `_.template` non utilisé | Mise à jour mineure | Faible |
| @supabase/supabase-js (ws) | 2.89.0 | haut | ws sert côté serveur Node, pas au navigateur | Très faible | Mise à jour mineure | Faible |
| zod | 3.25.76 | haut | Oui (validation formulaires) | Faible : données saisies de petite taille | Correction en v4 = changement majeur, à évaluer | Élevé |
| vite-imagetools (sharp, picomatch) | 9.0.2 | haut | Non : outil de construction | Nulle en production | Mise à jour | Faible |

Aucune alerte de dépendance ne constitue une faille critique du site public.

## Réserves confirmées
CSP / anti-iframe absents ; dépendances à mettre à jour.

## Limites maintenues
- Version des fonctions Stripe en production non vérifiable.
- Pages admin non retestées dans un navigateur pendant le premier audit.
- Liste des images des e-mails : réserve connue, non traitée (décision précédente).
- Scan approfondi non terminé.

## Plan priorisé (sur autorisation)
1. Intégrer le scan approfondi dès sa fin.
2. Retirer xlsx ; mettre à jour dompurify, jspdf, recharts, supabase-js, vite-imagetools (risque faible).
3. CSP et protection anti-iframe.
4. mcp-js dès version corrigée ; zod v4 dans un lot dédié et testé.

## Statut : inchangé — SÉCURITÉ VALIDÉE AVEC RÉSERVES (révisable selon le scan approfondi).
