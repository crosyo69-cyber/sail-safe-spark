# Contrôles avant prochaine autorisation — 3 points

## 1. Briefing (vérification, aucun envoi)
- Se connecter à l'aperçu avec un compte admin et ouvrir « Briefing du jour ». Capture d'écran, puis relevé de la période, du destinataire, des chiffres, du texte IA et de l'état du bouton « Envoyer ».
- Tests :
  - un aperçu ne passe jamais par l'étape d'envoi (aucune ligne de journal d'e-mail créée : comptage avant/après) ;
  - un envoi forcé depuis l'administration reste un aperçu ;
  - aucun envoi programmé n'existe pour le briefing ;
  - le bouton est désactivé (test d'écran + capture).
- Si l'aperçu génère le texte IA, cela consomme un petit appel IA, mais n'envoie rien.

## 2. Stripe (document seulement, aucun déploiement)
- Compléter le dossier de déploiement :
  - références exactes (empreintes des fichiers des deux fonctions dans la version préparée) ;
  - différences fonctionnelles par type d'achat (journée, pack, Stage) ;
  - liste des tests par type d'achat ;
  - procédure de retour arrière.
- Section « limites » explicite : la version en ligne est déduite de l'historique et des paiements Stripe, ce n'est pas une comparaison directe.
- Documenter le test F-27 en échec (laissé inchangé) et les tests qui couvrent le nouveau comportement.
- Listes de contrôles avant et après déploiement. Puis attente de votre autorisation.

## 3. Boutons flottants sur mobile (aperçu uniquement)
- Sur les petits écrans où la barre « Réserver » est visible, remonter l'assistant et le bouton WhatsApp au-dessus de cette barre, empilés sans se chevaucher. Sur ordinateur, rien ne change.
- Lien et message WhatsApp inchangés, barre « Réserver » et parcours de réservation inchangés.
- Vérification à 360, 390, 430 et 719 px de large : les deux boutons cliquables, la barre entièrement visible, rien de recouvert, le clic WhatsApp toujours compté.

## Hors périmètre
Aucune publication, aucun e-mail, remboursement, annulation, ni modification de données. Aucun déploiement Stripe.
