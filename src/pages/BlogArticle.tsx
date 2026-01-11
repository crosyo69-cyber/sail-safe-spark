import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { BlogComments } from "@/components/BlogComments";
import { Link, useParams, Navigate } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, ArrowRight, User, Tag, Facebook, Twitter, Linkedin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogArticles } from "./Blog";
import DOMPurify from "dompurify";

// Image imports for article pages
import blogKitesurfDebut from "@/assets/blog-kitesurf-debut.jpg";
import blogWingfoil from "@/assets/blog-wingfoil.jpg";
import blogKitesurfAction from "@/assets/blog-kitesurf-action.jpg";
import blogBateauGroupe from "@/assets/blog-bateau-groupe.jpg";
import blogPumpfoil from "@/assets/blog-pumpfoil.jpg";
import blogKiteDuotone from "@/assets/blog-kite-duotone.jpg";
import blogPumpfoilDock from "@/assets/blog-pumpfoil-dock.jpg";

const imageMap: Record<string, string> = {
  "blog-kitesurf-debut.jpg": blogKitesurfDebut,
  "blog-wingfoil.jpg": blogWingfoil,
  "blog-kitesurf-action.jpg": blogKitesurfAction,
  "blog-bateau-groupe.jpg": blogBateauGroupe,
  "blog-pumpfoil.jpg": blogPumpfoil,
  "blog-kite-duotone.jpg": blogKiteDuotone,
  "blog-pumpfoil-dock.jpg": blogPumpfoilDock,
};

const getArticleImage = (imageName: string): string => {
  return imageMap[imageName] || blogKitesurfAction;
};

// Article content data
const articleContent: Record<string, { content: string; tags: string[] }> = {
  "debuter-kitesurf-hyeres-guide-complet": {
    content: `
## Pourquoi Choisir Hyères pour Débuter le Kitesurf ?

Hyères et son célèbre spot de l'Almanarre offrent des conditions idéales pour l'apprentissage du kitesurf. Voici pourquoi cette destination est plébiscitée par les débutants du monde entier.

### Un Spot Adapté aux Débutants

L'Almanarre présente plusieurs avantages uniques :

- **Eau peu profonde** sur plusieurs centaines de mètres, permettant de se relever facilement
- **Vent régulier** (Mistral ou Levant) offrant des conditions stables
- **Large zone de navigation** sans obstacles
- **Température de l'eau agréable** de mai à octobre

### Le Matériel Adapté

Pour débuter, vous n'avez pas besoin d'investir immédiatement. Notre école fournit tout le matériel :

- Aile de kitesurf adaptée à votre gabarit
- Planche twin-tip pour débutant
- Harnais, gilet et casque de sécurité
- Combinaison adaptée à la saison

### Les Étapes de l'Apprentissage

Un stage de 5 jours se décompose généralement ainsi :

1. **Jour 1** : Découverte du matériel, règles de sécurité, pilotage de l'aile au sol
2. **Jour 2** : Premiers pas dans l'eau, bodydrag
3. **Jour 3** : Mise en place de la planche, waterstart
4. **Jour 4** : Premiers bords, maintien de trajectoire
5. **Jour 5** : Autonomie, remontée au vent

### L'Importance du Bateau d'Assistance

Notre bateau d'assistance fait toute la différence dans votre progression :

- Récupération rapide en cas de dérive
- Retour au point de départ sans effort
- Intervention immédiate en cas de problème
- Gain de temps considérable sur chaque session

### Conseils pour Bien Préparer Votre Stage

- **Condition physique** : Pas besoin d'être athlète, mais une bonne condition générale aide
- **Savoir nager** : Indispensable pour pratiquer en toute sécurité
- **Protection solaire** : Crème solaire, lunettes, casquette pour les pauses
- **Hydratation** : Prévoir de l'eau en quantité

Prêt à vous lancer ? Notre équipe vous accompagne à chaque étape de votre apprentissage.
    `,
    tags: ["Débutant", "Hyères", "Almanarre", "Stage Kitesurf"],
  },
  "wingfoil-sport-tendance-2024": {
    content: `
## Le Wing Foil : La Révolution des Sports de Glisse

Le wingfoil s'est imposé comme LE sport tendance de ces dernières années. Plus accessible que le kitesurf, il offre des sensations uniques de vol au-dessus de l'eau.

### Qu'est-ce que le Wing Foil ?

Le wingfoil combine trois éléments :

- **Une wing** (aile gonflable) tenue à la main
- **Un foil** (hydroptère) fixé sous la planche
- **Une planche** spécifique au foil

La wing capte le vent tandis que le foil vous fait décoller de l'eau, créant cette sensation unique de vol.

### Pourquoi le Wingfoil est Plus Accessible

Contrairement au kitesurf, le wingfoil présente plusieurs avantages pour les débutants :

- **Pas de lignes** à gérer (l'aile se tient directement à la main)
- **Démarrage plus intuitif** 
- **Praticable avec peu de vent** (dès 12 nœuds)
- **Zone de pratique plus compacte**
- **Progression rapide** pour les premières sensations de vol

### Les Conditions Idéales à l'Almanarre

L'Almanarre offre des conditions parfaites pour le wingfoil :

- Vent régulier de mars à novembre
- Eau plate idéale pour l'apprentissage
- Large zone sans obstacles
- Communauté wingfoil active

### Notre Programme d'Initiation

Notre stage wingfoil de 5 jours vous amène à l'autonomie :

1. Découverte de la wing et du foil
2. Équilibre et pumping sur le foil
3. Premiers vols en ligne droite
4. Virages et transitions
5. Navigation autonome

### Équipement Fourni

Tout est inclus dans nos cours :

- Wing adaptée à votre gabarit
- Planche foil stable pour débutant
- Foil progressif
- Combinaison et gilet

Le wingfoil est accessible à tous, que vous ayez de l'expérience en sports de glisse ou non !
    `,
    tags: ["Wing Foil", "Tendance 2024", "Sport de Glisse", "Hyères"],
  },
  "conditions-meteo-almanarre-guide": {
    content: `
## Décrypter les Conditions Météo de l'Almanarre

Comprendre les conditions météo est essentiel pour optimiser vos sessions de kitesurf ou wingfoil. Voici notre guide complet du spot de l'Almanarre.

### Les Deux Vents Dominants

L'Almanarre bénéficie de deux régimes de vent principaux :

#### Le Mistral (Nord-Ouest)

- **Direction** : Nord-Ouest (300-330°)
- **Caractéristiques** : Vent fort, rafales possibles, ciel dégagé
- **Meilleur pour** : Riders intermédiaires à confirmés
- **Période** : Toute l'année, plus fréquent en hiver

#### Le Levant (Sud-Est)

- **Direction** : Sud-Est (120-150°)
- **Caractéristiques** : Vent plus constant, moins de rafales
- **Meilleur pour** : Débutants et progression
- **Période** : Printemps et été principalement

### La Marée et ses Effets

Bien que la Méditerranée ait des marées faibles, elles influencent le spot :

- **Marée basse** : Zone de navigation plus large, eau moins profonde
- **Marée haute** : Moins d'espace mais conditions souvent meilleures

### Comment Prévoir les Conditions

Nos outils de prévision recommandés :

1. **Windguru** : Prévisions détaillées heure par heure
2. **Windy** : Visualisation des systèmes météo
3. **Météo France** : Bulletins côtiers officiels

### Les Signaux à Observer sur le Spot

Une fois sur place, observez :

- Les moutons sur l'eau (indication de la force du vent)
- Les autres riders (leur taille d'aile vous guide)
- Les drapeaux et manches à air
- L'orientation de la houle

### Tableau des Conditions par Mois

| Mois | Vent Dominant | Force Moyenne | Recommandation |
|------|--------------|---------------|----------------|
| Mars-Avril | Mistral | 15-25 nœuds | Intermédiaire |
| Mai-Juin | Mixte | 12-20 nœuds | Idéal débutant |
| Juillet-Août | Levant | 15-22 nœuds | Tous niveaux |
| Sept-Oct | Mixte | 12-25 nœuds | Meilleure période |
| Nov-Fév | Mistral | 20-35 nœuds | Confirmé |

L'équipe de KiteSurf Passion surveille les conditions quotidiennement pour vous proposer les meilleures sessions !
    `,
    tags: ["Météo", "Almanarre", "Mistral", "Conditions"],
  },
  "pourquoi-bateau-assistance-essentiel": {
    content: `
## Le Bateau d'Assistance : Un Atout Majeur pour Votre Progression

Chez KiteSurf Passion, nous disposons d'un bateau d'assistance permanent. Découvrez pourquoi c'est un avantage décisif pour votre apprentissage.

### Sécurité Maximale

Le bateau d'assistance assure votre sécurité à tout moment :

- **Intervention rapide** en cas de problème technique
- **Récupération immédiate** si vous dérivez trop loin
- **Surveillance constante** par notre équipe
- **Communication radio** avec le moniteur

### Progression Accélérée

Le bateau fait gagner un temps précieux :

- Plus de temps à naviguer, moins de temps à nager
- Retour au point de départ en quelques minutes
- Possibilité de recommencer immédiatement après une chute
- Conseils en temps réel depuis le bateau

### Comparaison Avec/Sans Bateau

| Sans Bateau | Avec Bateau |
|------------|-------------|
| 20-30 min de nage par session | Récupération en 2 minutes |
| 3-4 départs par session | 8-10 départs par session |
| Fatigue importante | Énergie préservée |
| Zone de navigation limitée | Toute la baie accessible |

### Ce que Permet le Bateau

Grâce au bateau d'assistance, nous pouvons :

- Vous amener au large pour des conditions optimales
- Récupérer votre matériel si vous le perdez
- Vous donner des conseils par radio
- Filmer votre progression pour analyse

### Témoignages de Nos Élèves

> "J'avais peur de dériver mais le bateau m'a rassuré. J'ai pu me concentrer sur ma technique." - Marie, 28 ans

> "En 5 jours, j'ai fait plus de progrès qu'un ami en 10 jours ailleurs." - Thomas, 35 ans

### Notre Engagement Sécurité

Notre bateau est équipé de :

- Matériel de premiers secours
- Radio VHF
- GPS et téléphone satellite
- Équipement de récupération

Le bateau d'assistance est inclus dans tous nos stages, sans supplément.
    `,
    tags: ["Sécurité", "Bateau", "Apprentissage", "Progression"],
  },
  "pumpfoil-dock-start-initiation": {
    content: `
## Pumpfoil & Dock Start : Voler Sans Vent

Le pumpfoil ouvre de nouvelles possibilités : pratiquer le foil même les jours sans vent ! Découvrez cette discipline accessible et ludique.

### Qu'est-ce que le Pumpfoil ?

Le pumpfoil consiste à propulser un foil par un mouvement de pompage :

- **Départ du ponton** (dock start) ou tracté
- **Mouvement de balancier** pour générer de la vitesse
- **Vol au-dessus de l'eau** grâce à la portance du foil

### Avantages du Pumpfoil

Cette discipline présente de nombreux atouts :

- **Aucun vent nécessaire** : praticable par tous temps calmes
- **Travail musculaire complet** : cuisses, abdos, équilibre
- **Sensations uniques** de vol
- **Idéal pour progresser** en foil avant de passer au wingfoil ou kitefoil

### Le Dock Start

Le dock start est la technique de départ depuis un ponton :

1. Positionnement sur le ponton avec la planche
2. Impulsion en courant vers l'eau
3. Saut sur la planche
4. Premiers coups de pompe pour décoller

### Notre Initiation Dock Start

Notre programme d'initiation comprend :

- **Découverte du matériel** et des principes du foil
- **Exercices d'équilibre** sur foil tracté
- **Apprentissage du dock start** étape par étape
- **Premiers vols autonomes** en pumping

### Tarifs et Formules

| Formule | Durée | Tarif |
|---------|-------|-------|
| Découverte | 1h | 50€ |
| Initiation | 2h | 90€ |
| Perfectionnement | 2h | 90€ |

### Pour Qui ?

Le pumpfoil est accessible à :

- Débutants en foil (dès 14 ans)
- Kitesurfeurs/Wingfoilers voulant s'entraîner sans vent
- Sportifs cherchant une nouvelle activité
- Toute personne curieuse de découvrir le vol sur l'eau

C'est aussi une excellente préparation avant de se lancer dans le wingfoil !
    `,
    tags: ["Pumpfoil", "Dock Start", "Sans Vent", "Initiation"],
  },
  "meilleure-periode-kitesurf-var": {
    content: `
## Quelle est la Meilleure Période pour le Kitesurf dans le Var ?

Le Var bénéficie d'un climat exceptionnel pour les sports de glisse. Analyse détaillée des conditions mois par mois.

### Vue d'Ensemble de la Saison

La saison de kitesurf dans le Var s'étend principalement de mars à novembre, avec des conditions variables selon les mois.

### Printemps (Mars - Mai)

**Mars-Avril** : Réveil de la saison
- Mistral fréquent et puissant
- Eau encore fraîche (14-17°C)
- Moins de monde sur le spot
- Idéal pour les riders expérimentés

**Mai** : Transition idéale
- Vent plus régulier
- Eau qui se réchauffe (18-20°C)
- Parfait pour les stages débutants
- Journées qui s'allongent

### Été (Juin - Août)

**Juin** : Le mois parfait
- Vent thermique régulier
- Eau agréable (21-23°C)
- Conditions stables
- Excellente période pour apprendre

**Juillet-Août** : Haute saison
- Levant prédominant
- Eau chaude (24-26°C)
- Affluence sur les spots
- Sessions possibles tous les jours

### Automne (Septembre - Novembre)

**Septembre-Octobre** : La période dorée
- **Notre recommandation** pour les stages
- Vent parfait, eau encore chaude
- Moins de touristes
- Conditions exceptionnelles

**Novembre** : Fin de saison
- Retour du Mistral
- Eau qui refroidit
- Sessions intenses

### Tableau Récapitulatif

| Période | Vent | Eau | Affluence | Notre Note |
|---------|------|-----|-----------|------------|
| Mars-Avril | ⭐⭐⭐ | 🌡️ | 👥 | ⭐⭐⭐ |
| Mai-Juin | ⭐⭐⭐⭐ | 🌡️🌡️ | 👥👥 | ⭐⭐⭐⭐⭐ |
| Juil-Août | ⭐⭐⭐⭐ | 🌡️🌡️🌡️ | 👥👥👥 | ⭐⭐⭐⭐ |
| Sept-Oct | ⭐⭐⭐⭐⭐ | 🌡️🌡️🌡️ | 👥👥 | ⭐⭐⭐⭐⭐ |
| Nov | ⭐⭐⭐ | 🌡️🌡️ | 👥 | ⭐⭐⭐ |

### Notre Conseil

Pour un premier stage, privilégiez **mai-juin** ou **septembre-octobre**. Vous bénéficierez de conditions optimales, d'une eau agréable et de tarifs hors saison.

Réservez votre stage dès maintenant pour profiter des meilleures conditions !
    `,
    tags: ["Période", "Saison", "Var", "Conditions"],
  },
  "choisir-aile-wingfoil-debutant": {
    content: `
## Comment Choisir son Aile de Wingfoil : Le Guide Complet

Choisir sa première aile de wingfoil peut sembler complexe. Voici tous les critères pour faire le bon choix et progresser rapidement.

### Les Critères Essentiels

#### La Taille de l'Aile

La taille de votre wing dépend principalement de deux facteurs :

- **Votre poids** : Plus vous êtes lourd, plus vous avez besoin de surface
- **La force du vent** : Plus le vent est faible, plus l'aile doit être grande

| Poids | Vent Léger (10-15 nœuds) | Vent Moyen (15-20 nœuds) | Vent Fort (20+ nœuds) |
|-------|-------------------------|-------------------------|----------------------|
| 60-70 kg | 5-6 m² | 4-5 m² | 3-4 m² |
| 70-85 kg | 6-7 m² | 5-6 m² | 4-5 m² |
| 85-100 kg | 7-8 m² | 6-7 m² | 5-6 m² |

#### La Forme de l'Aile

Deux profils principaux existent :

- **Profil plat** : Plus stable, idéal pour débuter
- **Profil creux** : Plus de puissance, pour riders avancés

### Les Poignées : Rigides ou Souples ?

Pour débuter, privilégiez les **poignées rigides** :

- Meilleur contrôle
- Position des mains fixe
- Apprentissage facilité

Les handles souples (boom) viendront avec l'expérience.

### Les Fenêtres Transparentes

Les fenêtres sur l'aile sont essentielles :

- **Visibilité** des autres usagers
- **Sécurité** accrue sur l'eau
- Préférez une aile avec 2-3 fenêtres minimum

### Notre Recommandation pour Débuter

Pour un débutant de 75 kg :

- **Taille** : 5-6 m²
- **Type** : Gonflable à profil stable
- **Poignées** : Rigides
- **Fenêtres** : 2-3 fenêtres

### Les Marques de Référence

Plusieurs marques proposent d'excellentes wings pour débutants :

- Duotone
- F-One
- Naish
- North
- Ozone

### L'Avantage de Tester Avant d'Acheter

Chez KiteSurf Passion, nous vous permettons de tester différentes ailes pendant vos cours. C'est la meilleure façon de trouver celle qui vous convient avant d'investir.
    `,
    tags: ["Wing Foil", "Matériel", "Débutant", "Conseils"],
  },
  "wingfoil-vs-kitesurf-differences": {
    content: `
## Wingfoil vs Kitesurf : Le Comparatif Complet

Vous hésitez entre le wingfoil et le kitesurf ? Voici une analyse détaillée pour vous aider à choisir la discipline qui vous correspond.

### Vue d'Ensemble

| Critère | Kitesurf | Wingfoil |
|---------|----------|----------|
| Apprentissage | 5-8 jours | 3-5 jours |
| Vent minimum | 12-14 nœuds | 10-12 nœuds |
| Équipement | Aile + lignes + planche | Wing + foil + planche |
| Sensations | Puissance, sauts | Vol, glisse |
| Espace nécessaire | Large zone | Zone compacte |

### L'Apprentissage

#### Kitesurf
- Pilotage de l'aile à maîtriser d'abord
- Gestion des lignes (20-25m)
- Coordination complexe
- 5-8 jours pour l'autonomie

#### Wingfoil
- Aile tenue à la main directement
- Pas de lignes à gérer
- Équilibre sur le foil à travailler
- 3-5 jours pour les premiers vols

### Les Sensations

#### Kitesurf
- **Puissance** : tracté par l'aile
- **Sauts** : possibilité de s'envoler
- **Vitesse** : pointes à 40+ nœuds
- **Adrénaline** : sensations fortes

#### Wingfoil
- **Vol silencieux** au-dessus de l'eau
- **Légèreté** : sensation de voler
- **Connexion** avec les éléments
- **Méditation** en mouvement

### Les Conditions Requises

#### Pour le Kitesurf
- Zone dégagée importante
- Vent stable 12+ nœuds
- Pas d'obstacles sous le vent
- Espace pour décollage/atterrissage

#### Pour le Wingfoil
- Zone plus compacte suffisante
- Vent dès 10 nœuds
- Praticable près des côtes
- Plus de spots accessibles

### Le Matériel

#### Kitesurf
- Investissement : 2000-3500€
- Encombrement : sac volumineux
- Préparation : 15-20 min
- Entretien : lignes à vérifier

#### Wingfoil
- Investissement : 2500-4000€
- Encombrement : moyen
- Préparation : 5-10 min
- Entretien : foil à rincer

### Pour Qui ?

**Choisissez le Kitesurf si :**
- Vous aimez les sensations fortes
- Vous voulez sauter
- Vous disposez de temps pour apprendre
- Vous avez accès à de grands spots

**Choisissez le Wingfoil si :**
- Vous cherchez la glisse pure
- Vous voulez progresser vite
- Vous naviguez sur des spots variés
- Vous aimez les sensations de vol

### Notre Conseil

Pourquoi choisir ? Essayez les deux ! Chez KiteSurf Passion, nous proposons des initiations aux deux disciplines pour vous aider à trouver votre préférence.
    `,
    tags: ["Wing Foil", "Kitesurf", "Comparatif", "Choix"],
  },
  "technique-pumping-foil-progresser": {
    content: `
## Maîtriser la Technique du Pumping en Foil

Le pumping est l'art de propulser votre foil sans traction externe. Découvrez les techniques pour progresser et voler plus longtemps.

### Qu'est-ce que le Pumping ?

Le pumping consiste à générer de la vitesse par un mouvement de balancier :

- **Flexion/extension** des jambes
- **Transfert de poids** avant/arrière
- **Coordination** du haut et bas du corps
- **Rythme** régulier et efficace

### Les Fondamentaux

#### La Position de Base

- Pieds écartés largeur d'épaules
- Genoux légèrement fléchis
- Dos droit, regard vers l'avant
- Bras le long du corps (ou tenant la wing)

#### Le Mouvement

1. **Charge** : Fléchir les genoux, appui sur l'avant
2. **Poussée** : Extension, transfert vers l'arrière
3. **Vol** : Profiter de la portance générée
4. **Préparation** : Revenir en position de charge

### Les Erreurs à Éviter

❌ Pomper trop vite et de façon saccadée
❌ Négliger la phase de glisse
❌ Se pencher trop en avant ou en arrière
❌ Oublier de respirer !

### Exercices de Progression

#### Niveau 1 : Sur le sable
- Simuler le mouvement sans planche
- Travailler le rythme
- 10 séries de 20 mouvements

#### Niveau 2 : En tracté
- Se faire tracter par le bateau
- Maintenir le foil levé
- Ajouter quelques pumps

#### Niveau 3 : Dock Start
- Départ du ponton
- Premiers mètres autonomes
- Augmenter la distance progressivement

### Le Matériel Adapté

Pour le pumping efficace :

- **Foil** : Grande surface d'aile (1500-2000 cm²)
- **Mât** : 70-85 cm
- **Planche** : Volume adapté à votre poids

### Tableau de Progression

| Niveau | Objectif | Temps estimé |
|--------|----------|--------------|
| Débutant | 10 pumps | 2-3 sessions |
| Intermédiaire | 50m | 5-6 sessions |
| Avancé | 200m+ | 10+ sessions |
| Expert | Sans limite | Pratique régulière |

### L'Entraînement Physique

Le pumping sollicite :

- **Quadriceps** et ischio-jambiers
- **Core** (abdominaux/lombaires)
- **Cardio** pour l'endurance

Exercices complémentaires recommandés :
- Squats
- Gainage
- Corde à sauter

### Nos Cours de Pumpfoil

Chez KiteSurf Passion, nous proposons des sessions dédiées au pumpfoil avec accompagnement personnalisé et matériel adapté.
    `,
    tags: ["Pump Foil", "Technique", "Progression", "Entraînement"],
  },
  "premiers-vols-wingfoil-conseils": {
    content: `
## Vos Premiers Vols en Wingfoil : 5 Conseils Essentiels

Le moment où vous décollez pour la première fois en wingfoil est magique. Voici 5 conseils pour y arriver plus rapidement et en toute sécurité.

### Conseil 1 : Maîtriser la Wing au Sol d'Abord

Avant même de toucher l'eau, prenez le temps de :

- **Gonfler et dégonfler** l'aile plusieurs fois
- **Sentir la puissance** du vent dans l'aile
- **Pratiquer les transitions** de bord à bord
- **Marcher avec l'aile** face au vent

Cette étape souvent négligée vous fera gagner un temps précieux sur l'eau.

### Conseil 2 : Commencer Sans le Foil

Les premières sessions devraient se faire sur une planche classique :

- Apprenez à **gérer la wing dans l'eau**
- Travaillez le **waterstart** avec l'aile
- Habituez-vous à la **position de navigation**
- Comprenez la **gestion de la puissance**

Une fois ces bases acquises, passez au foil.

### Conseil 3 : Le Bon Moment pour Décoller

Le décollage ne doit pas être forcé. Attendez que :

- Vous ayez **suffisamment de vitesse**
- La wing soit **correctement positionnée**
- Votre poids soit **centré sur la planche**
- Vous vous sentiez **stable et confiant**

Signes que vous êtes prêt :
- La planche accélère naturellement
- Le nez veut se lever
- Vous sentez la portance du foil

### Conseil 4 : Gérer l'Altitude

Une fois en vol, la clé est la **subtilité** :

#### Pour Monter
- Léger transfert de poids vers l'arrière
- Augmenter la puissance dans la wing
- Mouvement progressif

#### Pour Descendre
- Léger transfert vers l'avant
- Réduire la puissance (wing vers le haut)
- Ne jamais sur-corriger

#### L'Erreur Classique
Trop de corrections = oscillations = chute
Restez calme, faites des micro-ajustements.

### Conseil 5 : Accepter les Chutes

Les chutes font partie de l'apprentissage :

- **Lâchez la wing** en cas de déséquilibre
- **Protégez votre tête** (casque obligatoire)
- **Éloignez-vous du matériel** en tombant
- **Analysez** ce qui s'est passé avant de repartir

Chaque chute vous apprend quelque chose !

### Récapitulatif

| Étape | Focus | Durée moyenne |
|-------|-------|---------------|
| Wing au sol | Maniement | 30 min |
| Wing dans l'eau | Waterstart | 1-2 sessions |
| Planche + wing | Navigation | 1-2 sessions |
| Premiers vols | Décollage | 2-3 sessions |
| Stabilisation | Maintien | 3-5 sessions |

### Notre Accompagnement

Chez KiteSurf Passion, nos moniteurs vous guident pas à pas vers vos premiers vols. Le bateau d'assistance permet de multiplier les tentatives et d'accélérer votre progression.
    `,
    tags: ["Wing Foil", "Premiers Vols", "Conseils", "Débutant"],
  },
  "pumpfoil-entrainement-sans-vent": {
    content: `
## Pumpfoil : L'Entraînement Idéal les Jours Sans Vent

Pas de vent ? C'est l'occasion parfaite pour une session de pumpfoil ! Découvrez comment transformer les jours calmes en sessions productives.

### Pourquoi le Pumpfoil Sans Vent ?

Les avantages sont nombreux :

- **Aucune dépendance météo** : pratiquez quand vous voulez
- **Progression en foil** : améliorez votre équilibre
- **Cardio intense** : excellent entraînement physique
- **Sensations uniques** : le vol à l'état pur

### Les Conditions Idéales

Le pumpfoil sans vent est optimal quand :

- **Eau plate** : pas de clapot
- **Pas de courant** fort
- **Zone dégagée** : sans obstacles
- **Température agréable** : pour le confort

### Types de Sessions

#### Session Courte (30 min)
- Échauffement : 5 min de natation
- Technique : 15 min de pumping fractionné
- Cool down : 10 min de glisse douce

#### Session Longue (1h)
- Échauffement complet
- Travail de distance
- Exercices de virages
- Récupération active

### Le Matériel Recommandé

Pour le pumping pur, optimisez votre setup :

| Élément | Spécification | Pourquoi |
|---------|---------------|----------|
| Foil | 1800-2200 cm² | Plus de portance |
| Mât | 75-85 cm | Stabilité |
| Planche | 80-120L | Facilité de départ |
| Stab | Grand | Stabilité en vol |

### Programme d'Entraînement

#### Semaine 1-2 : Fondations
- 3 sessions de 30 min
- Focus : régularité du mouvement
- Objectif : 20 pumps consécutifs

#### Semaine 3-4 : Endurance
- 3 sessions de 45 min
- Focus : distance
- Objectif : 50 mètres

#### Semaine 5+ : Performance
- 2-3 sessions de 1h
- Focus : efficacité
- Objectif : 100+ mètres

### Les Bénéfices Physiques

Le pumpfoil développe :

- **Cuisses** : quadriceps et ischio-jambiers
- **Core** : gainage permanent
- **Cardio** : effort soutenu
- **Équilibre** : proprioception

C'est un entraînement complet équivalent à :
- 30 min de course
- 45 min de vélo
- 1h de natation

### Combiner avec le Wingfoil

Le pumpfoil améliore directement votre wingfoil :

- Meilleur contrôle du foil
- Récupération plus facile après les chutes
- Capacité à pumper pour reprendre de la vitesse
- Transitions plus fluides

### Nos Offres Pumpfoil

| Formule | Durée | Tarif |
|---------|-------|-------|
| Découverte | 1h | 50€ |
| Initiation | 2h | 90€ |
| Pack 5 sessions | 5x1h | 200€ |

Profitez des jours sans vent pour progresser avec nous !
    `,
    tags: ["Pump Foil", "Sans Vent", "Entraînement", "Fitness"],
  },
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const article = blogArticles.find((a) => a.slug === slug);
  const content = slug ? articleContent[slug] : null;
  
  if (!article || !content) {
    return <Navigate to="/blog-kitesurf-hyeres" replace />;
  }

  const breadcrumbItems = [
    { label: "Blog", href: "/blog-kitesurf-hyeres" },
    { label: article.title }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      "@type": "Person",
      name: "Yohan Cros",
      jobTitle: "Moniteur Diplômé d'État",
    },
    publisher: {
      "@type": "Organization",
      name: "KiteSurf Passion",
      logo: {
        "@type": "ImageObject",
        url: "https://www.kitesurfpassion.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.kitesurfpassion.com/blog/${slug}`,
    },
  };

  // Find related articles
  const relatedArticles = blogArticles
    .filter((a) => a.slug !== slug && a.category === article.category)
    .slice(0, 2);

  return (
    <>
      <Helmet>
        <title>{article.title} | Blog KiteSurf Passion</title>
        <meta name="description" content={article.excerpt} />
        <link rel="canonical" href={`https://www.kitesurfpassion.com/blog/${slug}`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.com/" },
            { "@type": "ListItem", "position": 2, "name": "Blog & Actualités", "item": "https://www.kitesurfpassion.com/blog-kitesurf-hyeres" },
            { "@type": "ListItem", "position": 3, "name": article.title, "item": `https://www.kitesurfpassion.com/blog/${slug}` }
          ]
        })}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4">
          {/* Article Header */}
          <header className="max-w-3xl mx-auto mb-12">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                {article.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(article.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.readTime}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              {article.title}
            </h1>

            <p className="text-xl text-muted-foreground mb-6">
              {article.excerpt}
            </p>

            <div className="flex items-center justify-between border-t border-b border-border py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="block font-medium text-foreground">Yohan Cros</span>
                  <span className="text-sm text-muted-foreground">Moniteur Diplômé d'État</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground mr-2 hidden sm:inline">Partager :</span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.kitesurfpassion.com/blog/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full text-muted-foreground hover:text-[#1877F2] hover:bg-[#1877F2]/10 transition-colors"
                  aria-label="Partager sur Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://www.kitesurfpassion.com/blog/${slug}`)}&text=${encodeURIComponent(article.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Partager sur X"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`https://www.kitesurfpassion.com/blog/${slug}`)}&title=${encodeURIComponent(article.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full text-muted-foreground hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-colors"
                  aria-label="Partager sur LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + `https://www.kitesurfpassion.com/blog/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full text-muted-foreground hover:text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                  aria-label="Partager sur WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>
          </header>

          {/* Article Image */}
          <div className="max-w-4xl mx-auto mb-12">
            <img
              src={getArticleImage(article.image)}
              alt={article.alt || `${article.title} - École KiteSurf Passion Hyères Almanarre`}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full rounded-2xl"
            />
          </div>

          {/* Article Content */}
          <div className="max-w-3xl mx-auto prose prose-lg prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary prose-strong:text-foreground">
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.content.replace(/\n/g, '<br />')) }} />
          </div>

          {/* Tags */}
          <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {content.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="max-w-3xl mx-auto mt-12 bg-gradient-to-br from-primary/10 to-turquoise/10 rounded-3xl p-8 text-center">
            <h3 className="font-display text-2xl font-bold text-foreground mb-4">
              Prêt à Passer à l'Action ?
            </h3>
            <p className="text-muted-foreground mb-6">
              Réservez votre stage et venez vivre ces sensations sur le spot de l'Almanarre.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="sunset" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  Réserver un Stage
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">Voir les Tarifs</Link>
              </Button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="max-w-3xl mx-auto mt-12">
            <BlogComments articleSlug={slug || ""} />
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="max-w-4xl mx-auto mt-16">
              <h3 className="font-display text-2xl font-bold text-foreground mb-8">
                Articles Similaires
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    to={`/blog/${related.slug}`}
                    className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={`/src/assets/${related.image}`}
                        alt={`${related.title} - Blog kitesurf Hyères Almanarre école KiteSurf Passion Var`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <h4 className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
                        {related.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to Blog */}
          <div className="max-w-3xl mx-auto mt-12 text-center">
            <Button variant="ghost" asChild>
              <Link to="/blog-kitesurf-hyeres">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au Blog
              </Link>
            </Button>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
};

export default BlogArticle;
