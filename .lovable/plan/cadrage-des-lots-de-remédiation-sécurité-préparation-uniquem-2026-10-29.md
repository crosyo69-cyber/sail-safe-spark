# Cadrage des lots de remédiation sécurité — préparation uniquement

Aucune modification du site, des dépendances, du fichier de protections, des données ou de Stripe ; aucune publication. Seul livrable écrit : le rapport complété dans le dossier du projet (docs/audit-securite-2026-10-29.md), si vous l'acceptez ; sinon rapport en chat seulement.

Constat préalable vérifié : IONOS ne gère que le nom de domaine (serveurs DNS ui-dns). Le site est servi par l'hébergement Lovable (adresse 185.158.133.1, derrière Cloudflare, identifiant de déploiement présent). Les protections HTTP relèvent donc de l'hébergement Lovable, pas d'IONOS.

## Lot 0 — Scan approfondi
- Relire l'état du scan (outil + vue Sécurité). S'il est toujours « inconnu » sans résultat, le considérer bloqué et le relancer une seule fois.
- Intégrer les résultats au rapport et réévaluer les priorités. Si le scan n'a pas fini en fin de tour, le signaler comme en attente.

## Lot 1 — Plan détaillé (aucune installation)
Pour xlsx (retrait), dompurify, jspdf, recharts, @supabase/supabase-js, vite-imagetools : version actuelle, version cible (consultée dans le registre), alertes corrigées, dépendances indirectes (arbre du lockfile), risques, tests (build, blog, export PDF, graphiques, connexion, réservation, tests existants), retour arrière (version précédente).

## Lot 2 — Investigation hébergement
- Documentation Lovable : prise en charge réelle des en-têtes personnalisés (_headers ou réglage). Preuve en ligne : en-têtes servis aujourd'hui (seul nosniff/HSTS/Referrer).
- Fichier `public/_headers` : contenu, protections déclarées vs appliquées, pourquoi ignoré, conflits.
- Liste complète des domaines utilisés (code + chargement réel des pages accueil, contact, spot, réservation, blog, admin après consentement), y compris Meta Pixel et Google Ads absents de la CSP actuelle.
- Comparaison A (hébergement), B (proxy/Cloudflare via DNS IONOS — changement d'architecture, avec limites), C (balise meta CSP sans frame-ancestors ; garde-fou JavaScript présenté comme non équivalent).

## Lot 3 — Plan de migration des 6 formulaires
Par formulaire : règles actuelles relevées dans le code, saisies valides/invalides, messages attendus, anti-robots, tests de non-régression, ordre de bascule.

## Lot 4
Report confirmé, analyse conservée au rapport.

## Rapport
Points 1 à 7 du document, avec la liste des autorisations à donner.
