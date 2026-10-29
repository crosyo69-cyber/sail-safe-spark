# Audit de sécurité post-publication (version 83e8c5f) — lecture seule

Aucune modification de fichier, donnée, secret, fonction ou configuration ; aucune publication, paiement, réservation ni e-mail. Seul ajout : le rapport final dans le dossier du projet.

## 1. Base de données
- Scan de sécurité rapide + linter de la base.
- Requêtes en lecture : tables sans RLS, policies par opération, droits anonymes (GRANT anon), fonctions SECURITY DEFINER exécutables par anon/authenticated, search_path, contrôles `has_role`.
- Revue des accès clients/réservations/paiements (isolation, jetons de session).

## 2. Fonctions serveur
- Revue du code : authentification, rôle admin vérifié côté serveur, validation des entrées, erreurs, signature Stripe du webhook.
- Appels en ligne sans compte vers les fonctions sensibles (réponse attendue : refus), sans corps destructif.

## 3. Briefing
- Relance des tests, appel sans admin (refus), journal e-mails = 0, aucune programmation, bouton « Envoyer » désactivé dans le code.

## 4. Stripe (observation seulement)
- Revue du code d'aperçu et des protections ; limite signalée : version en ligne non lisible.

## 5. Site public
- Recherche de secrets dans les fichiers publiés du site, en-têtes de sécurité, routes admin (redirection sans session), formulaires (anti-robot), analyse des dépendances.

## 6. Scan approfondi
- Lancement du scan approfondi (5 à 15 min, en arrière-plan) ; ses résultats sont intégrés au rapport s'ils arrivent, sinon signalés comme en attente.

## 7. Rapport
Rubriques A à H, chaque anomalie avec fichier, risque, scénario, recommandation et priorité ; constats distincts des recommandations ; statut final et limites.
