# Exécution des décisions — 3 lots

## Lot 1 — Briefing : aperçu uniquement
- Fonction concernée : le briefing quotidien. Comparer la version en ligne avec la version préparée avant toute remise en ligne.
- Garde-fou côté serveur : quand la demande vient de l'administration, la fonction prépare seulement un aperçu. Elle refuse toute demande d'envoi, même avec un paramètre forcé ou après une erreur. Seul le rôle admin, vérifié côté serveur, peut voir l'aperçu.
- Aucune programmation activée, aucune clé protégée touchée, le bouton « Envoyer » reste désactivé.
- Tests négatifs : une demande d'envoi depuis l'administration est refusée, un appel sans compte admin est refusé, et aucun envoi n'est déclenché.
- Remise en ligne de cette seule fonction, puis affichage de l'aperçu réel dans l'administration.
- Compte rendu : version, modifications exactes, tests, preuves qu'aucun envoi n'est possible et qu'aucune programmation n'existe, aucune donnée modifiée.

## Lot 2 — Stripe : dossier de déploiement (aucun déploiement)
Document dans le dossier du projet contenant :
- les deux fonctions de paiement, la version en ligne et la comparaison avec la version corrigée ;
- les montants vérifiés par le serveur : 50 € par personne pour une journée, prix du pack pour une personne, 250 € par personne pour un Stage ;
- le comportement si le journal des paiements manque ou si l'enregistrement échoue ;
- les résultats des tests, avec l'explication du test F-27 en échec ;
- les prérequis de base (aucun pour le correctif ; journal des paiements optionnel, à approuver séparément) ;
- la restauration : copie de la version actuelle conservée, plan de déploiement et de retour arrière ;
- les contrôles à faire juste après un futur déploiement.
- Recommandation finale, puis attente de votre autorisation.

## Lot 3 — Bouton WhatsApp flottant
- Bouton flottant sur toutes les pages, vers le 06 72 71 69 05 (wa.me/33672716905), avec un message pré-rempli (« Bonjour, je souhaite des informations sur vos cours de kitesurf »).
- Couleurs de la charte, zone tactile de 44 px minimum, libellé accessible, placé pour ne pas recouvrir l'assistant du site ni le menu mobile.
- Clic suivi comme contact dans les statistiques existantes. Aucune migration et aucun envoi automatique.

## Rien d'autre
Aucun paiement, remboursement, envoi d'e-mail ou modification de données. Aucune publication du site.
