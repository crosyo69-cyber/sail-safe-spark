# Lot sécurité 1 — Rapport d'analyse (lecture seule) et proposition de mise en oeuvre

Rien n'a été modifié. Aucun e-mail, SMS, paiement ni déploiement. Approuver ce plan n'autorise que la livraison du rapport détaillé dans les Fichiers (`/mnt/documents/lot-securite-1-analyse.md`) ; chaque lot de correction demandera ensuite votre autorisation séparée.

## Risque 1 — Notes admin dans l'e-mail « dernière minute »

1. Chemin : admin saisit la note (EditGroupDialog / GroupCard, écran Journées) → enregistrée dans `daily_groups.notes` via la fonction admin de mise à jour → `last-minute-notify` (appel admin ou tâche interne) relit `notes` → `buildHtml()` l'insère telle quelle (`<strong>Météo :</strong> ${opts.note}`) → `enqueue_email` → envoi par le fournisseur.
2. Fichiers : `supabase/functions/last-minute-notify/index.ts` (buildHtml, l. 18-37) ; écrans admin Journées (saisie seule, pas de changement requis).
3. Cause : aucune mise en forme sûre. Toute balise saisie (lien, image, formulaire, style masquant) part chez tous les abonnés confirmés. Également non échappés mais à faible risque : libellé d'activité (valeur d'une liste fermée) et date. La version texte n'inclut pas la note.
4. Solution : petit module partagé `escapeHtml` + `textToHtml` (échappe `& < > " '`, convertit les retours à la ligne en `<br>`, aucune balise ni lien rendu cliquable depuis la note) ; appliqué à note, activité, date. Les liens de l'e-mail (réservation, désabonnement) restent construits uniquement par le serveur sur `https://www.kitesurfpassion.fr`. Note ajoutée aussi en texte brut dans la version texte, longueur plafonnée (ex. 500 caractères).
5. Modifications : nouveau `supabase/functions/_shared/html-escape.ts` ; `last-minute-notify/index.ts` (buildHtml + texte).
6. Tests : note contenant `<a href>`, `<img onerror>`, `<script>`, `javascript:`, guillemets, accents, retours à la ligne → aucun élément actif dans le HTML produit, texte intact et lisible ; test de construction sans envoi réel.
7. Régression : une note admin qui utilisait volontairement du HTML s'affichera en texte. Aucun impact sur réservations.
8. Complexité : faible (environ 1 h).

## Risque 2 — Seuils de vent (alertes météo)

1. Chemin : formulaire public → `weather-subscribe` (sans compte) → recherche par e-mail dans `weather_alert_subscriptions` → si la ligne existe, `UPDATE min_wind/max_wind` immédiat, avant tout e-mail.
2. Fichiers : `supabase/functions/weather-subscribe/index.ts` (bloc « existing », l. ~165-175) ; RPC `confirm_weather_subscription`, `issue_link_token` ; page `/desabonnement-alertes`.
3. Cause : l'e-mail sert d'identifiant ET d'autorisation. Connaître l'adresse d'un abonné suffit pour changer ses seuils (abonné confirmé : modifié en silence, sans e-mail). Protections actuelles : limites par IP (5/15 min), par e-mail (3/h), quota global, réponse uniforme — donc pas d'énumération par la réponse, mais usurpation possible.
4. Solution : ne plus jamais modifier une ligne existante directement. La demande enregistre des seuils « en attente » et envoie un lien de validation à l'adresse ; seuls les clics valides appliquent le changement. Jeton : haché en base (modèle `public_link_tokens` existant), but dédié `weather_update`, expiration 48 h, usage unique, lié aux valeurs demandées. Nouvel abonné : parcours actuel inchangé (double opt-in). Réponse toujours identique.
5. Modifications : migration — colonnes `pending_min_wind`, `pending_max_wind`, `pending_requested_at` ; RPC `confirm_weather_update(token)` (vérifie hash, expiration, révocation, applique, consomme) ; `weather-subscribe` (écrit en attente + envoie e-mail « confirmez la modification ») ; page `/desabonnement-alertes` (gère `?update=`), limite de tentatives sur la validation (réutilise `public_rate_guard`).
6. Tests : modification d'un abonné sans clic → valeurs inchangées ; jeton expiré, réutilisé, faux, d'un autre but → refus ; réponse identique pour adresse connue/inconnue ; limites 429 ; nouvel abonné inchangé ; désabonnement inchangé. Tous les envois testés en file simulée, aucun e-mail réel.
7. Régression : un abonné qui change ses seuils devra cliquer un lien ; un abonné non confirmé qui renvoie le formulaire garde le comportement actuel.
8. Complexité : moyenne (migration + fonction + page, environ une demi-journée).

## Risque 3 — Activités « dernière minute »

1. Chemin : formulaire public → `last-minute-subscribe` → recherche par e-mail dans `last_minute_subscribers` → `UPDATE activities` immédiat, que l'abonné soit confirmé ou non.
2. Fichiers : `supabase/functions/last-minute-subscribe/index.ts` (bloc « existing ») ; `confirm_last_minute_subscription` ; page `/alerte-derniere-minute`.
3. Cause : identique au risque 2. En plus : un e-mail de confirmation est renvoyé à chaque demande non confirmée et les anciens jetons de confirmation restent valides sans expiration (`p_expires_at: null`).
4. Solution : même mécanisme que la météo — colonne `pending_activities`, but de jeton `last_minute_update`, 48 h, usage unique, haché ; RPC `confirm_last_minute_update`. Ajouter une expiration aux nouveaux jetons de confirmation.
5. Modifications : migration (colonne + RPC) ; `last-minute-subscribe/index.ts` ; page `/alerte-derniere-minute` (`?update=`).
6. Tests : mêmes cas que le risque 2, plus envoi d'alerte (`last-minute-notify`) qui ne cible que les activités validées.
7. Régression : jetons de confirmation existants sans expiration conservés (non révoqués) pour ne pas casser des liens en attente.
8. Complexité : moyenne (environ une demi-journée, partagée avec le risque 2).

## Proposition de lots indépendants

```text
Lot 1A  Échappement de la note dernière minute     faible   code serveur seul, sans migration
Lot 1B  Validation par e-mail des seuils météo      moyenne  migration + fonction + page
Lot 1C  Validation par e-mail des activités DM      moyenne  migration + fonction + page (réutilise 1B)
```

Ordre conseillé : 1A, puis 1B, puis 1C. Chaque lot : aperçu, tests, rapport, votre autorisation avant publication.

## Contrôles non réalisés

Pas lu le détail SQL des fonctions de confirmation existantes (usage unique déjà assuré ou non) : à vérifier au début du lot 1B. Aucun essai d'écriture réel.
