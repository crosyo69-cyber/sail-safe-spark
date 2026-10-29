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
