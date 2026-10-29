# Correction 1024 px — boutons flottants

## Cause
Les deux boutons flottants sont fixés en bas à droite à partir de 768 px. À 1024 px, le bouton téléphone de l'accueil s'arrête à 49 px du bord droit, alors qu'un bouton flottant mesure 56 px de large. Un chevauchement est donc inévitable en bas à droite.

## Correction (aperçu uniquement)
- **Entre 768 et 1279 px** : les deux boutons passent en bas à gauche, sur la photo. WhatsApp reste à gauche de l'assistant, avec le même écart entre eux. La fenêtre de l'assistant, une fois ouverte, s'ouvre aussi à gauche, pour ne pas sortir de l'écran.
- **À partir de 1280 px** : bas à droite, comme validé.
- **Sous 768 px** (mobile) : inchangé.
- Fichiers : le bouton WhatsApp et la position du bouton de l'assistant. Taille, couleur, lien, message et suivi inchangés. Aucun autre élément touché.

## Vérification
Largeurs 360, 390, 430, 719, 768, 900, 1024, 1100, 1280, 1440 et 1920 px :
- aucun chevauchement avec le bouton téléphone ni avec un autre texte ou bouton de l'accueil ;
- WhatsApp et l'assistant ne se touchent pas ;
- la barre « Réserver » reste libre sur mobile ;
- le mobile est identique à avant.

Statut final attendu : CORRECTION VALIDÉE EN PRÉVISUALISATION — SITE NON PUBLIÉ.
