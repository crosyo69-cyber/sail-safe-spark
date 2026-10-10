# F-28-27 — Audit avant correction

## Scores desktop, avant correction

Deux passages Lighthouse 13.0.1 par page. Les plages correspondent aux deux résultats, pas à une estimation.

| Page | Local : Performance | Local : Accessibilité | Publié : Performance | Publié : Accessibilité |
|---|---:|---:|---:|---:|
| Accueil | **56–57** | 100 | **94–95** | 100 |
| Tarifs | **57** | 97 | **94–95** | 97 |
| Contact | **57** | 97 | **94–95** | 97 |
| Cours débutant | **57** | 95–99 | 95–97 | 99 |
| Blog | **57** | 97 | 96–97 | 97 |

Gras : au moins un passage sous 95. Aucun score Accessibilité n'est sous 95.

Les mesures locales portent sur le serveur de développement : JavaScript non minifié, nombreux modules séparés, rechargement à chaud. Elles ne reproduisent pas un build de production et ne permettent pas d'attribuer l'échec GitHub aux heros. Les mesures du publié sont un complément utile, mais ne remplacent pas les rapports du job GitHub ayant échoué.

La configuration Lighthouse du dépôt teste actuellement seulement Accueil, Tarifs et Contact. Les cinq pages demandées ont néanmoins été mesurées ; aucune configuration de test ne sera modifiée.

## Audits associés aux scores sous 95

### Mesures locales

| Page | FCP | LCP | Speed Index | Élément LCP |
|---|---:|---:|---:|---|
| Accueil | 3,5 s | 7,1–7,2 s | 3,5–3,7 s | Photo du hero |
| Tarifs | 3,5 s | 7,2–7,3 s | 3,5–3,7 s | Titre principal |
| Contact | 3,5–3,6 s | 8,4 s | 3,6 s | Contenu principal textuel ; élément exact à confirmer avant patch |
| Cours débutant | 3,5 s | 7,2 s | 3,5 s | Hero principal |
| Blog | 3,3–3,4 s | 7,5–7,7 s | 3,5 s | Hero principal |

Autres audits locaux non satisfaits :

- JavaScript non minifié : 2,38 à 2,94 Mio économisables selon la page ; modules Vite. JavaScript inutilisé : 1,47 à 1,87 Mio ; CSS inutilisé : environ 29–30 Kio. Le mode développement amplifie ces résultats.
- Poids total : environ 7,4 à 8,7 Mio ; scripts, images et ressources externes, **pas uniquement les logos**.
- Images sans dimensions : notamment les logos du pied de page, dont Office de Tourisme Carqueiranne et Loisirs.fr.
- Cache : économies estimées de 103 à 723 Kio selon la page ; en-têtes des ressources concernées. Cache arrière/avant : une raison de blocage par page.
- Mise en page forcée : environ 108 ms sur Accueil, 72 ms sur Tarifs, 46 ms sur Contact ; traces Radix Accordion / Header. Chaînes réseau critiques : modules React et routes chargées après le document.
- Accueil : TBT 20–100 ms ; découverte tardive de la photo LCP ; logo FFVL, environ 9 Kio économisables.
- Blog : images, environ 32 Kio économisables ; découverte tardive de la photo LCP.
- JavaScript ancien : environ 13 Kio sur Accueil, Tarifs et Contact.

Ces diagnostics ne sont pas tous des causes indépendantes du score : seuls FCP, LCP, TBT, CLS et Speed Index le pondèrent.

### Défauts pertinents également observés sur le publié

| Page sous 95 | Mesure | Élément / cause observée | Origine |
|---|---|---|---|
| Accueil | FCP ~1,0 s ; LCP ~1,4–1,5 s | Photo du hero découverte après exécution React ; `fetchpriority=high` et chargement eager déjà présents | Mécanisme de découverte tardive antérieur à F-28-24/25, confirmé dans l'historique |
| Accueil | Livraison d'image : ~9 Kio économisables | Logo FFVL, 100 × 100 pixels pour ~48 × 48 affichés | Hors hero ; préexistant |
| Tarifs | LCP ~1,5 s | Titre principal rendu après chargement de la route | Chargement différé de route préexistant ; aucun hero photo sur cette page |
| Contact | LCP ~1,5 s | Contenu textuel rendu après chargement de la route | Chargement différé préexistant ; aucun hero photo sur cette page |
| Pages concernées | Images hors écran chargées immédiatement | Logos partenaires du pied de page, notamment Hyères ~490 Ko et Loisirs.fr ~256 Ko | Préexistant, confirmé dans l'historique |

Le CLS de l'accueil vaut 0,027, mais obtient **100 % à cet audit** : ce n'est pas un échec à corriger. Le rapport n'établit pas que le dégradé du texte en est la cause ; aucune modification visuelle de ce texte n'est proposée.

L'historique permet de confirmer les mécanismes préexistants, pas de reconstruire leurs anciens scores ni de mesurer l'impact exact du changement de hero.

## Accessibilité : défauts mesurés, hors seuil d'échec

Les résultats restent ≥95 ; ces défauts ne justifient donc pas un patch dans le périmètre strict demandé :

- Tarifs / Contact : liens actifs du menu, contraste ~4,19:1 (`#057f94` sur fond bleu clair).
- Tarifs local : encart « Accédez rapidement à nos cours et tarifs », ~4,44:1.
- Blog local : « Installer » ~4,45:1 ; compteur « 52 » ~3,33:1 ; plusieurs étiquettes ~4,2:1.
- Cours local : ordre de titres signalé sur « Bateau d'Assistance » dans un passage.

Les anciennes alertes de contraste 1:1 ne sont **pas qualifiées ici de faux positifs** : les scores Lighthouse seuls ne prouvent pas le contraste réel de ces éléments.

## Correction minimale proposée, après votre validation

1. **Accueil uniquement** : rendre le préchargement de la première photo découvrable dans le document initial, avec le même `srcset/sizes` que l'image pour éviter un téléchargement double ; optimiser sans perte le petit logo FFVL si son audit se confirme.
2. **Accueil, Tarifs et Contact uniquement** : déclarer les dimensions réelles des logos et différer leurs téléchargements hors écran, sans changer leur rendu ; limiter ces changements de chargement à ces routes malgré le composant de pied de page commun.
3. **Tarifs / Contact** : vérifier la contribution exacte des chargements de routes et des polices au LCP avant toute modification ; ne changer que le chargement frontal si un gain est démontré, sans chargement global supplémentaire sur les autres pages.
4. Relancer les cinq mesures dans les mêmes conditions et fournir les scores avant/après, en distinguant développement et production. Sans publication ni build de production mesurable, le passage du CI à ≥95 restera non certifié.
5. Fournir les aperçus desktop et mobile des heros concernés et comparer les photos avant/après.

## Limites et éléments conservés

- Cours débutant et Blog : aucun patch, leurs scores publiés sont ≥95.
- Photos originales, rendu, textes, liens et SEO inchangés ; aucun filtre, voile ou overlay.
- Réservation, paiements, backend et administration intouchés.
- Aucun changement du CI, aucune publication.
- Les deux corrections de contraste précédemment demandées (Header et encadré du Blog) restent présentes dans l'aperçu ; aucun nouveau correctif F-28-27 n'a été appliqué pendant cet audit.