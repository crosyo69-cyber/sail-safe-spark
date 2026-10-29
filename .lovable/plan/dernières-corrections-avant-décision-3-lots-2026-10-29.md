# Dernières corrections avant décision — 3 lots

## Lot A — Texte IA du briefing fiable
- Les chiffres envoyés à l'IA sont séparés en deux blocs clairement nommés :
  - **Pendant la période** (la veille, heure de Paris) : paiements Stripe, nouvelles réservations, packs achetés. Chaque bloc porte la mention « disponible » ou « indisponible ».
  - **Stock actuel** : nombre d'alertes non lues, avec la date de la plus ancienne et de la plus récente, ainsi que les actions à valider et la liste d'attente. Ce bloc est marqué « ne décrit pas la veille ».
- Consignes ajoutées à l'IA :
  - une alerte ne prouve jamais une réservation de la veille ;
  - s'il n'y a eu aucune réservation, la phrase doit dire « 0 réservation » ;
  - ne jamais confondre le nombre d'alertes et le nombre de réservations ;
  - une donnée indisponible est dite indisponible.
- Garde-fou après rédaction : un contrôle simple vérifie le texte de l'IA. Si la période compte 0 réservation et que le texte parle de « nouvelles réservations » ou cite une alerte comme une réservation, le texte est écarté. L'aperçu, comme l'e-mail, montre alors un résumé fixe, écrit sans IA à partir des chiffres.
- **Coût** : ouvrir l'écran n'appelle jamais l'IA. Le bouton « Préparer l'aperçu » donne d'abord les chiffres seuls. Un second bouton, « Rédiger avec l'IA », lance la rédaction, et le texte est réutilisé tant que la page reste ouverte. Le fonctionnement est documenté dans le dossier du projet.
- Tests :
  - 0 réservation avec des alertes anciennes ;
  - des réservations récentes avec des alertes anciennes ;
  - aucune alerte ;
  - des données indisponibles ;
  - un texte trompeur rejeté.
  Ils portent sur la préparation des chiffres et sur le contrôle du texte, sans appel réel à l'IA.
- Remise en ligne de la fonction du briefing seulement (aperçu toujours seul possible depuis l'administration). Aucun e-mail, aucune programmation. Vérification à l'écran avec votre compte admin : chiffres d'abord, puis une seule rédaction par l'IA.

## Lot B — Stripe : contrôle final (rien de déployé)
- Recenser tous les endroits du site qui ouvrent un paiement, et vérifier que chacun indique le type d'achat (journée, pack, Stage). Tout parcours qui ne l'indique pas serait signalé, pas corrigé dans ce lot.
- Garder le test ancien sans type d'achat tel quel, avec l'explication de son échec.
- Empreintes des versions candidates (déjà relevées) revérifiées.
- Limites : le code en ligne ne peut pas être lu, et aucun journal n'existe pour ces fonctions. Rien ne garantit que la version précédente du projet correspond à la version en ligne.
- Restauration : chercher si une version en ligne peut être retrouvée. Sinon, le documenter comme un risque : la seule restauration possible serait la version du projet jugée la plus proche, à valider par un paiement test sans paiement réel.
- Vérifier la présence des clés nécessaires (paiement, signature des événements Stripe, accès à la base) sans afficher leur valeur, les dépendances, et l'absence de prérequis de base.
- Contrôles après déploiement et conditions d'arrêt (montant incorrect, réservation absente, erreur au premier paiement), puis retour arrière.
- Rapport final ajouté au dossier de déploiement. En attente d'une autorisation distincte.

## Lot C — WhatsApp : contrôle final (aperçu)
- Aucun changement. Vérifier :
  - le numéro (06 72 71 69 05) ;
  - le lien et le message pré-rempli ;
  - l'affichage à 360, 390, 430 et 719 px de large et sur ordinateur ;
  - l'absence de chevauchement avec la barre « Réserver » ;
  - le comptage du clic après acceptation des cookies, et son absence en cas de refus.
- Compte rendu, puis attente de votre autorisation de publier.

## Hors périmètre
Aucune publication, aucun déploiement Stripe, aucun e-mail réel, aucune programmation, aucune modification de données.
