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
  "erreurs-debutant-kitesurf-eviter": {
    content: `
## 10 Erreurs de Débutant en Kitesurf : Comment les Éviter

L'apprentissage du kitesurf est passionnant, mais certaines erreurs peuvent ralentir votre progression ou compromettre votre sécurité. Voici les 10 erreurs les plus fréquentes et nos conseils pour les éviter.

### Erreur 1 : Négliger la Phase Théorique

Beaucoup de débutants veulent aller dans l'eau immédiatement. Pourtant, comprendre la théorie est essentiel :

- **La fenêtre de vent** : zone de puissance vs zone neutre
- **Les règles de priorité** : qui passe en premier ?
- **Les systèmes de sécurité** : quick release, leash, chicken loop

**Notre conseil** : Prenez le temps d'écouter attentivement les briefings. Cette base théorique vous évitera bien des problèmes sur l'eau.

### Erreur 2 : Choisir une Aile Trop Grande

L'excès de puissance est dangereux pour un débutant :

- Difficulté à contrôler l'aile
- Risque d'être tiré violemment
- Impossibilité de relâcher la tension

**Notre conseil** : Faites confiance à votre moniteur pour le choix de la taille. Mieux vaut une aile trop petite que trop grande au début.

### Erreur 3 : Regarder l'Aile au Lieu de l'Horizon

C'est l'erreur la plus courante :

❌ Regarder constamment l'aile → perte d'équilibre, mauvaise trajectoire

✅ Regarder l'horizon → meilleur équilibre, pilotage instinctif

**Notre conseil** : Une fois l'aile lancée, ne la regardez plus. Pilotez par les sensations dans la barre.

### Erreur 4 : Se Crisper sur la Barre

La tension excessive fatigue et réduit le contrôle :

- Bras tendus = fatigue rapide
- Mains serrées = réactions brutales
- Épaules crispées = douleurs

**Notre conseil** : Gardez les bras légèrement fléchis, les mains souples. Laissez le harnais faire le travail.

### Erreur 5 : Négliger le Bodydrag

Le bodydrag (nage tractée) n'est pas optionnel :

- Permet de récupérer sa planche
- Développe le pilotage dans l'eau
- Prépare au waterstart

**Notre conseil** : Maîtrisez parfaitement le bodydrag avant de passer à la planche. C'est votre assurance-vie sur l'eau.

### Erreur 6 : Vouloir Aller Trop Vite

La précipitation est l'ennemi de la progression :

| Approche précipitée | Approche progressive |
|---------------------|---------------------|
| Frustration | Confiance |
| Mauvaises habitudes | Bases solides |
| Risques accrus | Sécurité optimale |

**Notre conseil** : Respectez les étapes. Chaque compétence acquise construit la suivante.

### Erreur 7 : Sortir par Conditions Inadaptées

Naviguer dans des conditions trop fortes ou instables :

- Vent trop fort pour votre niveau
- Rafales imprévisibles
- Courants forts

**Notre conseil** : Écoutez les conseils de votre moniteur et apprenez à lire les conditions. Le spot de [l'Almanarre](/spot-kitesurf-almanarre-hyeres-var) offre des conditions idéales pour débuter.

### Erreur 8 : Oublier les Règles de Priorité

Les règles de navigation existent pour la sécurité de tous :

- **Tribord amure prioritaire** sur bâbord
- **Rider qui saute** doit avoir l'espace libre sous le vent
- **Celui qui remonte au vent** s'écarte de celui qui descend

**Notre conseil** : Apprenez ces règles par cœur avant d'être autonome.

### Erreur 9 : Sous-estimer l'Importance de l'Échauffement

Le kitesurf sollicite tout le corps :

- Épaules et bras (pilotage)
- Core (équilibre)
- Jambes (position sur la planche)

**Notre conseil** : 10 minutes d'échauffement avant chaque session. Votre corps vous remerciera.

### Erreur 10 : Apprendre Seul Sans Encadrement

L'apprentissage autodidacte est risqué :

- Acquisition de mauvaises habitudes
- Risques de sécurité accrus
- Progression plus lente
- Danger pour les autres usagers

**Notre conseil** : Investissez dans un [stage encadré](/cours-kitesurf-hyeres-debutant) avec des professionnels. C'est le meilleur investissement pour votre progression et votre sécurité.

### En Résumé

| Erreur | Solution |
|--------|----------|
| Négliger la théorie | Écouter les briefings |
| Aile trop grande | Faire confiance au moniteur |
| Regarder l'aile | Fixer l'horizon |
| Se crisper | Rester souple |
| Sauter le bodydrag | Le maîtriser parfaitement |
| Aller trop vite | Respecter les étapes |
| Mauvaises conditions | Apprendre à lire le spot |
| Ignorer les priorités | Connaître les règles |
| Pas d'échauffement | 10 min avant chaque session |
| Apprendre seul | Prendre des cours |

Chez KiteSurf Passion, notre [bateau d'assistance](/blog/pourquoi-bateau-assistance-essentiel) et nos 25 ans d'expérience vous garantissent une progression en toute sécurité.
    `,
    tags: ["Débutant", "Erreurs", "Conseils", "Progression", "Sécurité"],
  },
  "regles-securite-kitesurf-wingfoil": {
    content: `
## Règles de Sécurité en Kitesurf et Wingfoil : Le Guide Complet

La sécurité est la base de toute pratique réussie. Chez KiteSurf Passion, nous mettons l'accent sur la sécurité depuis 1999. Voici toutes les règles essentielles à connaître.

### Avant la Session : La Préparation

#### Vérification du Matériel

Avant chaque sortie, contrôlez systématiquement :

- **Aile/Wing** : pas de déchirure, coutures intactes
- **Lignes** : pas de nœuds, longueurs égales, pas d'usure
- **Barre** : chicken loop fonctionnel, quick release opérationnel
- **Harnais** : crochet sécurisé, pas d'usure
- **Leash** : attache solide, longueur adaptée

#### Analyse des Conditions

Avant de vous mettre à l'eau :

| Élément | Ce qu'il faut vérifier |
|---------|----------------------|
| Vent | Force, direction, régularité |
| Courant | Sens et intensité |
| Marée | Montante ou descendante |
| Obstacles | Baigneurs, rochers, bouées |
| Zone de repli | Où atterrir en cas de problème |

### Les Systèmes de Sécurité

#### Le Quick Release (Largage Rapide)

Le système le plus important de votre équipement :

1. **Pousse** le chicken loop pour se détacher de l'aile
2. **L'aile se met en drapeau** et perd toute puissance
3. **Le leash** maintient le contact avec l'aile

**Exercice obligatoire** : Pratiquez le largage à sec avant chaque session.

#### Le Leash de Sécurité

- Relie le rider à l'aile après largage
- Permet de ne pas perdre le matériel
- **Attention** : savoir le larguer aussi en cas d'urgence

### Les Règles de Navigation

#### Priorités sur l'Eau

Les règles internationales s'appliquent :

1. **Tribord amure** (vent venant de droite) est prioritaire sur bâbord amure
2. **Celui qui remonte au vent** s'écarte de celui qui descend
3. **Le rider en l'air** doit avoir l'espace libre sous lui
4. **Le débutant** doit céder le passage aux autres

#### Distances de Sécurité

Maintenez toujours :

- **50 mètres** des baigneurs et plages surveillées
- **100 mètres** des embarcations à moteur
- **200 mètres** des zones de baignade balisées
- **Distance de lignes** entre riders (2x la longueur des lignes)

### Sécurité Spécifique au Wingfoil

Le wingfoil présente des risques particuliers :

#### Le Foil

- **Bords tranchants** : attention lors des manipulations
- **Mât rigide** : danger en cas de chute
- **Casque obligatoire** : protège des impacts

#### La Chute

- **Lâchez la wing** immédiatement
- **Éloignez-vous** du matériel en tombant
- **Protégez votre tête** avec les bras
- **Localisez le foil** avant de remonter sur la planche

### Les Conditions Dangereuses à Éviter

#### Ne naviguez JAMAIS :

❌ **Vent offshore** (qui pousse vers le large)
❌ **Orage** à proximité (risque de foudre)
❌ **Vent instable** avec fortes rafales
❌ **Visibilité réduite** (brouillard, nuit)
❌ **Seul** sans surveillance

#### Conditions Limites

- **Vent > 25 nœuds** pour débutants : à éviter
- **Courant fort** : risque de dérive
- **Eau froide** : risque d'hypothermie

### L'Importance du Bateau d'Assistance

Notre [bateau d'assistance](/blog/pourquoi-bateau-assistance-essentiel) fait la différence :

| Sans Bateau | Avec Bateau |
|------------|-------------|
| Récupération longue | Intervention en 2 min |
| Fatigue importante | Énergie préservée |
| Zone limitée | Toute la baie accessible |
| Stress en cas de problème | Sérénité totale |

### Auto-Sauvetage

Si vous êtes loin du bord, maîtrisez l'auto-sauvetage :

1. **Larguez** votre aile (quick release)
2. **Enroulez les lignes** sur la barre
3. **Remontez sur l'aile** à plat ventre
4. **Pagayez** vers le rivage

**Notre conseil** : Pratiquez cette technique régulièrement en conditions calmes.

### Équipements de Sécurité Obligatoires

Pour toute session :

- ✅ **Casque** : protection contre les impacts
- ✅ **Gilet** : flottabilité et protection
- ✅ **Combinaison** : adaptée à la température
- ✅ **Leash** : connexion avec le matériel

### Communication et Signaux

Connaissez les signaux de base :

- **Bras levé** : besoin d'aide
- **Bras croisés au-dessus de la tête** : tout va bien
- **Taper sur la tête** : OK, pas de problème

### Check-list Avant Session

✅ Météo vérifiée (force et direction du vent)
✅ Matériel contrôlé
✅ Systèmes de sécurité testés
✅ Zone de navigation identifiée
✅ Point de repli prévu
✅ Quelqu'un sait où vous êtes
✅ Téléphone étanche ou VHF

### Notre Engagement Sécurité

Chez KiteSurf Passion, la sécurité n'est pas négociable :

- Moniteur diplômé d'État (BPJEPS)
- Bateau d'assistance permanent
- Ratio élève/moniteur limité
- Matériel vérifié quotidiennement
- 25 ans d'expérience sans accident grave

Découvrez nos [stages encadrés](/cours-kitesurf-hyeres-debutant) pour apprendre en toute sécurité.
    `,
    tags: ["Sécurité", "Règles", "Navigation", "Kitesurf", "Wingfoil"],
  },
  "guide-equipement-kitesurf-debutant": {
    content: `
## Guide Équipement Kitesurf : Tout Savoir pour Bien S'Équiper

Choisir son matériel de kitesurf peut sembler complexe. Ce guide complet vous explique tout sur les ailes, planches, harnais et accessoires pour faire les bons choix.

### L'Aile de Kitesurf

L'aile est le moteur de votre progression. Voici ce qu'il faut savoir.

#### Les Types d'Ailes

| Type | Caractéristiques | Pour qui ? |
|------|-----------------|------------|
| **Hybride** | Polyvalente, stable | Débutants à intermédiaires |
| **C-Kite** | Puissante, réactive | Riders confirmés, freestyle |
| **Delta/Bow** | Dépuissance importante | Débutants, lightwind |
| **Foil Kite** | Légère, vol bas | Kitefoil, vent léger |

#### Quelle Taille Choisir ?

La taille dépend de votre poids et du vent :

| Poids | 10-15 nœuds | 15-20 nœuds | 20-25 nœuds | 25+ nœuds |
|-------|------------|------------|------------|----------|
| 55-65 kg | 12-14 m² | 10-12 m² | 8-10 m² | 6-8 m² |
| 65-75 kg | 14-16 m² | 12-14 m² | 9-11 m² | 7-9 m² |
| 75-85 kg | 16-18 m² | 14-16 m² | 10-12 m² | 8-10 m² |
| 85+ kg | 18+ m² | 16-18 m² | 12-14 m² | 10-12 m² |

#### Notre Recommandation Débutant

Pour commencer, privilégiez :

- **Type** : Hybride ou Delta
- **Taille** : 12-14 m² (pour 75 kg)
- **Marque** : Duotone, North, Core, Eleveight

### La Barre de Contrôle

La barre est votre interface avec l'aile.

#### Éléments Essentiels

- **Barre** : aluminium ou carbone, 45-55 cm
- **Lignes** : 4 ou 5 lignes, 20-27 m
- **Chicken loop** : système de connexion au harnais
- **Quick release** : largage rapide de sécurité
- **Trim/Depower** : réglage de puissance

#### Compatibilité

Chaque marque a son système propre. Restez cohérent :
- Aile Duotone → Barre Duotone
- Aile North → Barre North

### La Planche (Board)

#### Twin-Tip : Le Standard

La twin-tip est symétrique et idéale pour débuter :

- **Longueur** : 130-145 cm selon votre poids
- **Largeur** : 38-45 cm (plus large = plus stable)
- **Pads et straps** : réglables pour le confort

| Poids | Longueur recommandée |
|-------|---------------------|
| 50-65 kg | 130-136 cm |
| 65-80 kg | 136-142 cm |
| 80-95 kg | 142-148 cm |
| 95+ kg | 148+ cm |

#### Autres Types de Planches

- **Directionnelle** : pour les vagues
- **Foilboard** : pour le kitefoil
- **Strapless** : pour le surf kite

### Le Harnais

Le harnais répartit la traction de l'aile sur votre corps.

#### Harnais Culotte vs Ceinture

| Harnais Culotte | Harnais Ceinture |
|-----------------|------------------|
| Plus de maintien | Plus de liberté |
| Idéal débutant | Pour riders confirmés |
| Évite de remonter | Peut remonter |
| Moins d'amplitude | Plus d'amplitude |

#### Notre Conseil

**Débutant** : Harnais culotte avec bon maintien dorsal
**Intermédiaire** : Harnais ceinture rigide

### La Combinaison

Adaptez votre combinaison à la saison :

| Température eau | Type de combinaison |
|-----------------|---------------------|
| 22°C+ | Shorty 2mm ou lycra |
| 18-22°C | Intégrale 3/2mm |
| 15-18°C | Intégrale 4/3mm |
| <15°C | Intégrale 5/4mm + accessoires |

#### Accessoires

- **Chaussons** : protection et chaleur
- **Gants** : pour l'hiver
- **Cagoule** : températures froides

### Équipements de Sécurité

Obligatoires pour votre protection :

#### Casque

- Protection contre les impacts (planche, foil)
- Indispensable pour les débutants
- Modèles spécifiques sports nautiques

#### Gilet d'Impact

- Flottabilité (50N minimum)
- Protection des côtes
- Aide au waterstart

### Budget et Investissement

#### Pack Complet Neuf

| Niveau | Budget | Ce que ça comprend |
|--------|--------|-------------------|
| Débutant | 1800-2500€ | Aile + barre + planche |
| Intermédiaire | 2500-3500€ | Quiver 2 ailes + planche |
| Confirmé | 3500-5000€ | Quiver complet + foil |

#### L'Option Occasion

Pour débuter, le marché de l'occasion offre de bonnes opportunités :

- **Économie** : 30-50% par rapport au neuf
- **Points de vigilance** : état des coutures, lignes, valves

### Tester Avant d'Acheter

Chez KiteSurf Passion, nous vous permettons de :

- **Tester différentes tailles** d'ailes pendant les cours
- **Essayer plusieurs planches** pour trouver la bonne
- **Bénéficier de conseils** personnalisés sur votre équipement

### Où Acheter ?

- **Pro shops locaux** : conseils personnalisés
- **Sites spécialisés** : large choix, prix compétitifs
- **Occasion** : leboncoin, groupes Facebook spécialisés

### Check-list Équipement Débutant

✅ Aile hybride/delta 12-14 m²
✅ Barre compatible avec l'aile
✅ Twin-tip 136-142 cm
✅ Harnais culotte
✅ Combinaison adaptée à la saison
✅ Casque nautique
✅ Gilet d'impact
✅ Leash de sécurité

Besoin de conseils personnalisés ? Contactez-nous pour discuter de votre projet d'équipement après votre [stage de kitesurf](/stage-kitesurf-100-glisse-hyeres).
    `,
    tags: ["Équipement", "Matériel", "Aile", "Planche", "Harnais", "Débutant"],
  },
  "progression-pumpfoil-debutant-expert": {
    content: `
## Progression Pumpfoil : Du Débutant à l'Expert en 8 Semaines

Le pumpfoil est une discipline complète qui permet de pratiquer le foil sans dépendre du vent. Suivez notre programme structuré pour progresser efficacement.

### Semaine 1-2 : Les Fondamentaux

#### Objectifs

- Comprendre le fonctionnement du foil
- Maîtriser l'équilibre statique
- Réussir ses premiers pumps

#### Exercices au Sol

Avant l'eau, travaillez les bases :

1. **Squats rythmés** : 3 séries de 15 répétitions
2. **Gainage dynamique** : 30 secondes, 3 répétitions
3. **Simulation du mouvement** : visualisez le pumping

#### Premières Sessions Tractées

Le bateau vous tracte pour comprendre le foil :

- **Position de base** : pieds écartés, genoux fléchis
- **Équilibre** : maintenir le foil stable sous l'eau
- **Décollage** : sentir la portance du foil

| Session | Objectif | Durée |
|---------|----------|-------|
| 1 | Équilibre tracté | 45 min |
| 2 | Premiers décollages | 45 min |
| 3 | Maintien en vol | 45 min |

### Semaine 3-4 : Le Dock Start

#### Technique du Dock Start

Le départ du ponton est la clé de l'autonomie :

1. **Position de départ** : planche perpendiculaire au ponton
2. **Course d'élan** : 3-4 pas rapides
3. **Impulsion** : saut vers l'avant
4. **Atterrissage** : pieds sur les pads, genoux fléchis
5. **Premier pump** : immédiatement après le contact

#### Les Erreurs à Éviter

❌ Sauter trop haut (vous perdez de la vitesse)
❌ Regarder la planche (vous déséquilibre)
❌ Pomper trop tôt (le foil n'a pas assez de vitesse)

#### Objectif Semaine 4

- Réussir le dock start 1 fois sur 3
- Maintenir 3-5 pumps après le départ
- Distance : 5-10 mètres

### Semaine 5-6 : L'Endurance

#### Augmenter la Distance

Le travail d'endurance commence :

| Semaine | Distance objectif | Pumps consécutifs |
|---------|------------------|-------------------|
| 5 | 20-30 mètres | 15-20 |
| 6 | 40-50 mètres | 25-30 |

#### Optimiser le Mouvement

Pour aller plus loin avec moins d'effort :

- **Amplitude** : mouvements amples mais fluides
- **Rythme** : régulier, pas trop rapide
- **Respiration** : synchronisée avec le pumping
- **Regard** : vers l'horizon, pas vers les pieds

#### Exercices Spécifiques

1. **Pumping lent** : focus sur l'amplitude
2. **Pumping rapide** : travail du cardio
3. **Pumping mixte** : alternance lent/rapide

### Semaine 7-8 : La Performance

#### Objectifs Avancés

- Distance : 100+ mètres
- Virages de base
- Récupération après perte de vitesse

#### Technique de Virage

Pour changer de direction :

1. **Réduire légèrement l'altitude** du foil
2. **Transférer le poids** vers le nouveau bord
3. **Accompagner** avec les hanches
4. **Reprendre** le pumping dans la nouvelle direction

#### Programme Semaine Type

| Jour | Session | Focus |
|------|---------|-------|
| Lundi | 45 min | Distance |
| Mercredi | 30 min | Technique |
| Vendredi | 1h | Virages |
| Dimanche | 45 min | Libre |

### Au-delà : Niveau Expert

#### Objectifs Long Terme

- Distance : 500+ mètres
- Virages enchaînés
- Downwind en pumpfoil
- Combinaison avec le wingfoil

#### Statistiques de Progression

| Niveau | Distance | Temps de vol | Virages |
|--------|----------|--------------|---------|
| Débutant | 10-20m | 10-15 sec | 0 |
| Intermédiaire | 50-100m | 30-60 sec | 1-2 |
| Avancé | 200-500m | 2-5 min | 3-5 |
| Expert | 1km+ | 10+ min | Illimité |

### Le Matériel Adapté à Chaque Niveau

#### Débutant

- **Foil** : Grande surface (2000+ cm²), aspect ratio faible
- **Planche** : Grande (100+ L), stable
- **Mât** : Court (60-70 cm)

#### Intermédiaire

- **Foil** : Surface moyenne (1500-2000 cm²)
- **Planche** : Moyenne (70-90 L)
- **Mât** : Standard (70-80 cm)

#### Expert

- **Foil** : Surface réduite (1200-1500 cm²), aspect ratio élevé
- **Planche** : Compacte (50-70 L)
- **Mât** : Long (80-90 cm)

### Bénéfices du Pumpfoil

Le pumpfoil améliore :

- ✅ **Équilibre** : proprioception en conditions instables
- ✅ **Cardio** : effort soutenu, excellente condition physique
- ✅ **Technique foil** : transferable au wingfoil et kitefoil
- ✅ **Mental** : concentration et persévérance

### Notre Programme de Cours

Chez KiteSurf Passion, nous proposons :

| Formule | Durée | Contenu | Tarif |
|---------|-------|---------|-------|
| Découverte | 1h | Initiation tractée | 50€ |
| Dock Start | 2h | Apprentissage autonome | 90€ |
| Pack Progression | 5x1h | Programme complet | 200€ |

### Conseils pour Progresser Plus Vite

1. **Régularité** : 2-3 sessions par semaine minimum
2. **Patience** : chaque session apporte du progrès
3. **Analyse** : filmez-vous pour corriger vos erreurs
4. **Récupération** : le corps a besoin de repos
5. **Plaisir** : le pumpfoil doit rester ludique

Prêt à vous lancer ? Découvrez nos [cours de pumpfoil](/cours-pumpfoil-dock-start-hyeres) à Hyères !
    `,
    tags: ["Pumpfoil", "Progression", "Dock Start", "Entraînement", "Programme"],
  },
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
  "ecole-kitesurf-hyeres-almanarre-cours": {
    content: `
## Découvrez le Kitesurf à Hyères avec KiteSurf Passion

**L'Almanarre vous attend pour une expérience de glisse inoubliable**

Vous rêvez de glisser sur les eaux turquoise de la Méditerranée ? Notre **école de kitesurf Hyères** vous accompagne depuis 1999 dans la découverte de ce sport spectaculaire. Située sur le **spot de kitesurf Almanarre**, reconnu comme l'un des meilleurs spots de **kitesurf Var**, notre école offre des conditions idéales pour apprendre et progresser en toute sécurité.

### Des Cours Adaptés à Tous les Niveaux

Que vous soyez totalement novice ou pratiquant confirmé, nos **cours de kitesurf débutant** sont conçus pour une progression rapide et sécurisée. Notre moniteur diplômé d'État (BPJEPS) vous guide pas à pas, de la découverte de l'aile jusqu'à vos premières navigations autonomes.

Ce qui distingue notre approche pédagogique :

- **Bateau d'assistance permanent** pour une sécurité maximale
- **Petits groupes** de 4 élèves maximum
- **Matériel récent** Duotone adapté à votre niveau
- **École itinérante** : nous choisissons le meilleur spot selon les conditions météo

### Location et Équipement Premium

Vous êtes déjà autonome ? Notre service de **location de kitesurf Hyères** met à votre disposition un équipement complet et performant. Ailes, planches, harnais et combinaisons : tout est inclus pour profiter pleinement de votre session sur l'Almanarre.

Le spot bénéficie de vents réguliers (Mistral et Levant) de mars à novembre, avec une eau peu profonde idéale pour l'apprentissage et le perfectionnement.

### Passez à l'Action

Rejoignez les **2 500 élèves** déjà formés par notre école et vivez l'expérience du kitesurf sur la côte varoise. Réservez dès maintenant votre [stage 100% Glisse](/stage-kitesurf-100-glisse-hyeres) ou votre [cours particulier](/cours-particulier-kitesurf-hyeres) et laissez-vous porter par le vent méditerranéen.

**Contactez-nous au 06 72 71 69 05** ou [réservez directement en ligne](/contact-reservation-kitesurf-hyeres) !
    `,
    tags: ["Kitesurf", "Hyères", "Almanarre", "Débutant", "Cours"],
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
      name: "Yoanne Cros",
      jobTitle: "Moniteur Diplômé d'État",
    },
    publisher: {
      "@type": "Organization",
      name: "KiteSurf Passion",
      logo: {
        "@type": "ImageObject",
        url: "https://www.kitesurfpassion.com/logo.png",
        creator: {
          "@type": "Organization",
          name: "KiteSurf Passion",
          url: "https://www.kitesurfpassion.com",
        },
        license: "https://www.kitesurfpassion.com/mentions-legales",
        acquireLicensePage: "https://www.kitesurfpassion.com/contact-reservation-kitesurf-hyeres",
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
                  <span className="block font-medium text-foreground">Yoanne Cros</span>
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
