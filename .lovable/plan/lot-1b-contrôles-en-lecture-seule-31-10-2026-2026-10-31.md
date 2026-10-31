# Lot 1B — Contrôles en lecture seule (31/10/2026)

Rien n'a été appliqué, déployé, envoyé ni accepté. migration.sql = migration-2.sql et rollback.sql = rollback-2.sql (mêmes empreintes SHA-256 461d2d0c… et b8357d11…).

## 1. Nouvelles fonctions absentes en production — confirmé
Aucune des cinq n'existe dans le site en ligne : confirm_weather_update, preview_weather_update, preview_weather_subscription, request_weather_subscription, request_weather_pending. Seules issue_link_token et confirm_weather_subscription existent.

## 2. Les deux fonctions actuelles et les droits
- Texte exact relevé avec pg_get_functiondef : **identique, ligne pour ligne**, aux blocs 3 et 4 de rollback.sql (même signature, SECURITY DEFINER, search_path = public, même corps).
- Empreintes actuelles du texte : issue_link_token 8b3481ef…afde ; confirm_weather_subscription eb619016…6e41e6e.
- Droits actuels (les deux) : propriétaire postgres, service_role, et le compte de lecture technique de Lovable ; aucun droit pour les visiteurs (anon) ni les comptes connectés. rollback.sql retire les droits des visiteurs et comptes connectés et redonne service_role : résultat **identique** à l'état actuel. Le compte technique n'est pas touché par les scripts et le reste.
- Colonnes actuelles de la table des abonnés météo : 11 colonnes (id, email, min_wind, max_wind, enabled, created_at, updated_at, unsubscribe_token_hash, confirmed, confirmed_at, last_alert_sent_at). Le retour arrière ne retire que les 4 colonnes « pending_* » ajoutées par la migration.

## 3. Essai migration + retour arrière dans une transaction annulée — non réalisable sans votre accord
- Mon accès à la base est en lecture seule : il ne peut pas créer de colonnes ni de fonctions, même dans une transaction ensuite annulée.
- Le seul outil qui peut le faire applique la modification **réellement** au site en ligne (aucune annulation possible par ce biais).
- De plus, rollback.sql contient son propre BEGIN/COMMIT : intégré tel quel dans une transaction d'essai, il la validerait au lieu de l'annuler. Il faudrait retirer ces deux lignes pour l'essai.
- Options :
  a. Base de test isolée (brouillon avec sa propre base) : essai complet, aucun risque pour le site.
  b. Accepter l'essai réel en production (migration puis retour arrière immédiat, sans données fictives dans la table réelle) : non recommandé.
  c. S'en tenir à la comparaison des textes (point 2), déjà concluante pour les fonctions et les droits.

## 4. Effet du retour arrière sur un abonné avec une modification en attente
- Ses seuils actifs restent ceux d'avant la demande ; abonnement, confirmation et lien de désabonnement conservés.
- Sa demande en attente est abandonnée : les 4 champs « pending » sont supprimés.
- Le lien reçu par e-mail pour valider la modification est annulé (liens « weather_update » et lien de confirmation lié à la demande). S'il clique, il voit « lien invalide ». Aucun e-mail ne le prévient.
- Pour changer ses seuils, il devra refaire la demande avec l'ancienne version du formulaire. Le retour arrière doit donc se faire après avoir remis l'ancienne fonction d'inscription météo, comme l'indique l'en-tête du script.

## Décision attendue
Choisir a, b ou c pour le point 3. Aucune action avant votre autorisation.
