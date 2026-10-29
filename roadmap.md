# F-28-22

# Correction Stripe — acomptes et fiabilité comptable

- [x] 29/10 : version actuelle retestée — 90 tests Deno + 26 tests Bun réussis ; typage serveur checkout/webhook validé sans --no-check.
- [ ] 29/10 : rapprochement 14 commandes, incidents, Stage remboursée, CRM/assistant — bloqués : base de données inaccessible (« Database is possibly not accessible »).

- [ ] Finalisation demandée le 23 octobre : tableau des 14 commandes, lectures CRM/assistant vérifiées, reprise idempotente préparée, tests et dossier de validation ; aperçu uniquement, aucune activation.
- [x] Distinguer réservation datée et achat individuel : utilisateur confirme pack sans journée automatique.
- [x] Préparer checkout explicite, montants Stripe réels, brouillon du journal non appliqué et affichages revenus/fiche CRM ; 90 tests simulés passent et deux états visibles vérifiés.
- [ ] Compléter les lectures comptables CRM globales/assistant et la reprise atomique des événements indéterminés : attend validation du périmètre des RPC F-28 gelées et du brouillon de journal, sans appliquer de migration.
- [ ] Certifier le rapprochement exact des 14 commandes : liste de l'ancien audit absente ; 12 écarts rapprochés de Stripe, rapport préparé sans régularisation.
- [ ] Vérifier le parcours hébergé complet : bloqué par le journal et les RPC non appliqués, activation non autorisée.

# Confirmation après paiement — QA

- [x] Ajouter la référence Stripe au retour et la vérification en lecture seule : migration active sur le backend partagé.
- [x] Réessayer brièvement pendant le traitement du paiement et tester les états réels et simulés : 42 tests checkout et 3 tests navigateur réussis ; réservation réelle confirmée via la page, références invalides/inconnues non confirmées, aucune erreur navigateur. Aucun paiement créé, aucune publication ni déploiement checkout.

- [x] Inspect photo overlays and compare local gradient candidates.
- [x] Apply homepage-only lighter photos with soft copy protection.
- [x] Validate all slides on desktop/mobile, measure backgrounds, rerun Lighthouse accessibility (100 desktop/mobile).
- [x] Deliver measured report and confirm no publication; document unchanged gradient-button contrast and mobile accessible-name findings for a separate authorized correction.
- [x] F-28-25 Heros des 13 pages intérieures : photo seule + panneau bleu nuit (non publié)

# F-28-29 — Formulations factuelles

- [x] Remplacer les deux colonnes et les deux formules restantes de « Notre expertise locale » sur l’accueil.
- [x] Reformuler les affirmations comparatives de Spot Almanarre, Stage Wingfoil et Déposes en mer.
- [x] Vérifier les quatre pages dans l’aperçu sans publication.

# F-28-27 — Suivi

- [x] Audit des cinq pages et validation du périmètre minimal.
- [x] Préchargement accueil et logos hors écran, sans changement visuel.
- [x] Vérification ciblée du LCP Tarifs / Contact : titres principaux, pas de modification globale des chargements.
- [x] Mesures locales avant/après et aperçus ordinateur/mobile ; aucune publication.
- [ ] Certification Performance ≥95 en production : bloquée par l'absence de mesure d'une version de production contenant ces corrections, sans publication autorisée.

# F-28-30 — Menu mobile

- [x] Audit validé du panneau mobile.
- [x] Panneau opaque, liens et sous-menus accessibles, défilement interne et blocage de la page derrière, uniquement sous 1024 px.
- [x] Vérifier accueil et Tarifs à 360/390 px, mesures et aperçus des trois états, sans publication : fond rgb(15,23,42), alpha 1, aucun flou, contraste 17,85:1 (sous-menus 14,63:1), liens 18px et ≥48px, Échap et navigation rétablissent le défilement.

# F-28-31 — Licence FFVL

- [x] Phase 0 : inventaire présenté et audit validé ; assurance conservée, périmètre Kitesurf/Wingfoil, gabarits de confirmation autorisés uniquement.
- [x] Ajouter les mentions sous les prix et avant paiement, corriger les FAQ visibles sans changer le SEO.
- [x] Préparer les seuls textes des confirmations, sans déploiement ni modification de logique ; confirmation des journées préparée hors migrations actives.
- [x] Vérifier contrastes (17,87:1 sous les prix), prix/SEO inchangés et aperçus à 1280/390/360 px ; 285 tests réussis, aucune publication.

# F-29-06 — Lecture horaire des seuils météo et licence structurée

- [x] Afficher toutes les heures par activité : dans/hors seuils ou indéterminé, avec lien de réservation ; aucune décision automatique.
- [x] Préciser la licence FFVL exclue des offres Tarifs, Stage 100 % Glisse et Cours débutant ; conserver séparément les droits des images et les prix.
- [x] Tester limites, données périmées/manquantes : 292 tests réussis ; admin connecté vérifié (24 heures, 4 activités), lien /reserver et 6 offres JSON-LD contrôlés ; sans publication ni déploiement.

## SMS rendez-vous manuels (Brevo) — Phase 2
- [x] Journal d'envoi en base avec anti-doublon et états explicites
- [x] Fonction d'envoi admin + tests simulés (15/15, aucun SMS réel)
- [x] Fenêtre de prévisualisation/confirmation dans Gestion des journées
- [ ] Déploiement de la fonction et activation réelle : uniquement sur autorisation explicite

- [x] Rapport rapprochement Stripe (14 commandes, cas récents, correctif acompte) — lecture seule
- [ ] Briefing IA quotidien 9h : fonction prête et en ligne ; planification bloquée (accès aux secrets refusé par les réglages du projet)
- [ ] Assistant WhatsApp (leads 24/7, devis, réservation, transfert) — bloqué : réception des messages impossible sur cette version du site
