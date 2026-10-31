# Lot 1B — Remix de test et audit d'isolation

## Limite importante
Je ne peux pas créer un Remix moi-même : aucun outil ne me le permet depuis ce projet. Depuis ici, je peux seulement lire le **code** d'un autre projet de l'espace de travail, pas sa base, ses secrets ni ses réglages. L'audit de la base doit donc se faire **dans le fil du Remix**.

## Étape 1 — Vous (2 minutes)
1. Nom du projet (en haut à gauche) → Settings → « Remix this project ».
2. Nom : **KiteSurf Passion — Environnement de test Lot 1B**.
3. N'activez aucune option de partage de données ou de secrets si on vous en propose une.
4. Ne lancez aucun message de construction dans le Remix pour le moment.

## Étape 2 — Moi, depuis ce projet (lecture seule)
Après approbation, et une fois le Remix créé :
- Retrouver le Remix dans l'espace de travail et en lire le code.
- Comparer son fichier de configuration du backend (identifiant du projet de base) avec celui de la production : identique = alerte immédiate, arrêt.
- Vérifier qu'aucun fichier ne contient d'identifiant de production en dur.
- Production : aucune écriture, migration, publication, email, SMS ni action Stripe.

## Étape 3 — Prompt d'audit à coller dans le fil du Remix
Je vous fournirai un texte prêt à coller qui demande, en lecture seule :
- identifiant de base et serveur différents de la production (comparaison avec la valeur que je donnerai) ;
- liste des secrets présents/absents (noms seulement, jamais les valeurs) : Stripe, Brevo, Resend, envoi d'emails, autres ;
- présence de la table des abonnements météo, de ses fonctions, contraintes, index, règles d'accès, extensions et fonctions serveur liées ;
- nombre de lignes par table sensible (sans contenu) pour confirmer l'absence de données réelles ;
- tableau des 9 contrôles et verdict (validée / avec réserves / non validée), puis arrêt.

## Points à surveiller (connus, non vérifiés sur ce Remix)
- Un Remix crée normalement un nouveau backend vide, sans données ni secrets ; à prouver par l'audit.
- Les migrations sont rejouées : la structure devrait exister, mais certaines étapes pourraient échouer.
- Tant que le Remix est vide de secrets, Stripe et les emails sont inaccessibles ; ne jamais y ajouter les clés de production.
- La suppression du Remix ne touche pas la production s'il a son propre backend.

## Arrêt
Aucun transfert du Lot 1B, aucune migration, aucun test, aucun abonné fictif, aucune suppression avant votre autorisation.
