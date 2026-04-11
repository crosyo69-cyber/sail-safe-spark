import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, Clock, ArrowRight, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareButtons } from "@/components/ShareButtons";
// WebP optimized images for better LCP performance
import heroImage from "@/assets/blog-hero.jpg?webp";
import blogCtaImage from "@/assets/blog-kitesurf-sunset-cta.jpg?webp";
import blogKitesurfDebut from "@/assets/blog-kitesurf-debut.jpg?webp";
import blogWingfoil from "@/assets/blog-wingfoil.jpg?webp";
import blogKitesurfAction from "@/assets/blog-kitesurf-action.jpg?webp";
import blogBateauGroupe from "@/assets/blog-bateau-groupe.jpg?webp";
import blogPumpfoil from "@/assets/blog-pumpfoil.jpg?webp";
import blogKiteDuotone from "@/assets/blog-kite-duotone.jpg?webp";
import blogPumpfoilDock from "@/assets/blog-pumpfoil-dock.jpg?webp";
import blogWakeboardHyeres from "@/assets/wakeboard-hyeres-glisse-nautique.jpg?webp";
import blogLocationMateriel from "@/assets/blog-location-materiel.jpg?webp";
import blogFoilTracteHyeres from "@/assets/blog-foil-tracte-hyeres.jpg?webp";
import blogKitesurfActionEau from "@/assets/blog-kitesurf-action-eau.jpg?webp";
import blogKitesurfCoursPlage from "@/assets/blog-kitesurf-cours-plage.jpg?webp";
import blogKitesurfCoursGroupe from "@/assets/blog-kitesurf-cours-groupe.jpg?webp";
import blogKitesurfMarchePlage from "@/assets/blog-kitesurf-marche-plage.jpg?webp";
import blogKitesurfPreparation from "@/assets/blog-kitesurf-preparation.jpg?webp";
import blogKitesurfCoursIndividuel from "@/assets/blog-kitesurf-cours-individuel.jpg?webp";
import blogWakeboardEvgEvjf from "@/assets/blog-wakeboard-evg-evjf.jpg?webp";
import blogKitesurfWaterstart from "@/assets/blog-kitesurf-waterstart.jpg?webp";
import blogKitesurfGlisseTurquoise from "@/assets/blog-kitesurf-glisse-turquoise.jpg?webp";
import blogKitesurfEauClaire from "@/assets/blog-kitesurf-eau-claire.jpg?webp";
import blogKitesurfSunset from "@/assets/blog-kitesurf-sunset.jpg?webp";
import blogKitesurfSautAction from "@/assets/blog-kitesurf-saut-action.jpg?webp";
import blogKitesurfAilesColorees from "@/assets/blog-kitesurf-ailes-colorees.jpg?webp";
import blogKitesurfSurfeusePlanche from "@/assets/blog-kitesurf-kitesurfeuse-planche.jpg?webp";
import blogKitesurfSprayTurquoise from "@/assets/blog-kitesurf-spray-turquoise.jpg?webp";
import blogKitesurfGrabColoree from "@/assets/blog-kitesurf-grab-coloree.jpg?webp";
import blogKitesurfBackloopSunset from "@/assets/blog-kitesurf-backloop-sunset.jpg?webp";
import blogKitesurfGlisseFille from "@/assets/blog-kitesurf-glisse-fille.jpg?webp";
import blogKitesurfPlageRose from "@/assets/blog-kitesurf-plage-rose.jpg?webp";
import blogKitesurfFreestylePink from "@/assets/blog-kitesurf-freestyle-pink.jpg?webp";
import blogKitesurfSautVagues from "@/assets/blog-kitesurf-saut-vagues.jpg?webp";
import blogWingfoilDuoLagon from "@/assets/blog-wingfoil-duo-lagon-turquoise.jpg?webp";
import blogWingfoilVolEau from "@/assets/blog-wingfoil-vol-eau-cristalline.jpg?webp";
import blogWingfoilVolFoilJaune from "@/assets/blog-wingfoil-vol-foil-jaune.jpg?webp";
import blogWingfoilMontagnesMaui from "@/assets/blog-wingfoil-montagnes-maui.jpg?webp";

// Image mapping for dynamic resolution
const imageMap: Record<string, string> = {
  "blog-kitesurf-debut.jpg": blogKitesurfDebut,
  "blog-wingfoil.jpg": blogWingfoil,
  "blog-kitesurf-action.jpg": blogKitesurfAction,
  "blog-bateau-groupe.jpg": blogBateauGroupe,
  "blog-pumpfoil.jpg": blogPumpfoil,
  "blog-kite-duotone.jpg": blogKiteDuotone,
  "blog-pumpfoil-dock.jpg": blogPumpfoilDock,
  "blog-wakeboard-hyeres.jpg": blogWakeboardHyeres,
  "blog-location-materiel.jpg": blogLocationMateriel,
  "blog-foil-tracte-hyeres.jpg": blogFoilTracteHyeres,
  "blog-kitesurf-action-eau.jpg": blogKitesurfActionEau,
  "blog-kitesurf-cours-plage.jpg": blogKitesurfCoursPlage,
  "blog-kitesurf-cours-groupe.jpg": blogKitesurfCoursGroupe,
  "blog-kitesurf-marche-plage.jpg": blogKitesurfMarchePlage,
  "blog-kitesurf-preparation.jpg": blogKitesurfPreparation,
  "blog-kitesurf-cours-individuel.jpg": blogKitesurfCoursIndividuel,
  "blog-wakeboard-evg-evjf.jpg": blogWakeboardEvgEvjf,
  "blog-kitesurf-waterstart.jpg": blogKitesurfWaterstart,
  "blog-kitesurf-glisse-turquoise.jpg": blogKitesurfGlisseTurquoise,
  "blog-kitesurf-eau-claire.jpg": blogKitesurfEauClaire,
  "blog-kitesurf-sunset.jpg": blogKitesurfSunset,
  "blog-kitesurf-saut-action.jpg": blogKitesurfSautAction,
  "blog-kitesurf-ailes-colorees.jpg": blogKitesurfAilesColorees,
  "blog-kitesurf-kitesurfeuse-planche.jpg": blogKitesurfSurfeusePlanche,
  "blog-kitesurf-spray-turquoise.jpg": blogKitesurfSprayTurquoise,
  "blog-kitesurf-grab-coloree.jpg": blogKitesurfGrabColoree,
  "blog-kitesurf-backloop-sunset.jpg": blogKitesurfBackloopSunset,
  "blog-kitesurf-glisse-fille.jpg": blogKitesurfGlisseFille,
  "blog-kitesurf-plage-rose.jpg": blogKitesurfPlageRose,
  "blog-kitesurf-freestyle-pink.jpg": blogKitesurfFreestylePink,
  "blog-kitesurf-saut-vagues.jpg": blogKitesurfSautVagues,
  "blog-wingfoil-duo-lagon-turquoise.jpg": blogWingfoilDuoLagon,
  "blog-wingfoil-vol-eau-cristalline.jpg": blogWingfoilVolEau,
};

const getArticleImage = (imageName: string): string => {
  return imageMap[imageName] || blogKitesurfAction;
};

const breadcrumbItems = [
  { label: "Blog & Actualités" }
];

export const blogArticles = [
  {
    slug: "erreurs-debutant-kitesurf-eviter",
    title: "10 Erreurs de Débutant en Kitesurf et Comment les Éviter",
    excerpt: "Découvrez les erreurs les plus fréquentes des débutants en kitesurf et nos conseils d'experts pour les éviter. Progressez plus vite et en toute sécurité.",
    category: "Kitesurf",
    date: "2025-01-12",
    readTime: "7 min",
    image: "blog-kitesurf-eau-claire.jpg",
    alt: "Erreurs débutant kitesurf Hyères - Conseils progression école KiteSurf Passion",
    featured: true,
  },
  {
    slug: "regles-securite-kitesurf-wingfoil",
    title: "Règles de Sécurité en Kitesurf et Wingfoil : Le Guide Complet",
    excerpt: "La sécurité est notre priorité. Découvrez toutes les règles essentielles pour pratiquer le kitesurf et le wingfoil en toute sérénité à Hyères.",
    category: "Sécurité",
    date: "2025-01-08",
    readTime: "8 min",
    image: "blog-bateau-groupe.jpg",
    alt: "Sécurité kitesurf wingfoil Hyères - Règles navigation école KiteSurf Passion",
    featured: true,
  },
  {
    slug: "guide-equipement-kitesurf-debutant",
    title: "Guide Équipement Kitesurf : Ailes, Planches et Harnais pour Débuter",
    excerpt: "Tout savoir sur le matériel de kitesurf : comment choisir son aile, sa planche et son harnais. Conseils d'experts pour bien s'équiper.",
    category: "Kitesurf",
    date: "2025-01-05",
    readTime: "9 min",
    image: "blog-kite-duotone.jpg",
    alt: "Guide équipement kitesurf débutant - Matériel aile planche harnais Hyères",
  },
  {
    slug: "progression-pumpfoil-debutant-expert",
    title: "Progression Pumpfoil : Du Débutant à l'Expert en 8 Semaines",
    excerpt: "Programme complet pour progresser en pumpfoil. Du dock start aux longues distances, suivez notre méthode éprouvée pour maîtriser le pumping.",
    category: "Pump Foil",
    date: "2025-01-02",
    readTime: "6 min",
    image: "blog-pumpfoil-dock.jpg",
    alt: "Progression pumpfoil Hyères - Programme entraînement dock start école KiteSurf Passion",
  },
  {
    slug: "debuter-kitesurf-hyeres-guide-complet",
    title: "Débuter le Kitesurf à Hyères : Guide Complet 2026",
    excerpt: "Tout ce que vous devez savoir pour commencer le kitesurf à Hyères. Quel matériel choisir, comment se préparer, et pourquoi l'Almanarre est le spot idéal pour les débutants.",
    category: "Kitesurf",
    date: "2026-02-15",
    readTime: "8 min",
    image: "blog-kitesurf-sunset.jpg",
    alt: "Débuter kitesurf Hyères Almanarre - Guide débutant école KiteSurf Passion Var",
  },
  {
    slug: "wingfoil-sport-tendance-2024",
    title: "Wing Foil : Le Sport de Glisse Tendance en 2026",
    excerpt: "Découvrez pourquoi le wingfoil conquiert la Méditerranée. Plus accessible que le kitesurf, le wingfoil offre des sensations uniques de vol sur l'eau.",
    category: "Wing Foil",
    date: "2026-02-10",
    readTime: "6 min",
    image: "blog-wingfoil-duo-lagon-turquoise.jpg",
    alt: "Wingfoil Hyères tendance 2026 - Stage wing foil école KiteSurf Passion Almanarre",
  },
  {
    slug: "conditions-meteo-almanarre-guide",
    title: "Comprendre les Conditions Météo à l'Almanarre",
    excerpt: "Mistral ou Levant ? Apprenez à décrypter les conditions météo du spot de l'Almanarre pour naviguer dans les meilleures conditions possibles.",
    category: "Le Spot",
    date: "2026-02-05",
    readTime: "5 min",
    image: "blog-kitesurf-backloop-sunset.jpg",
    alt: "Conditions météo kitesurf Almanarre Hyères - Vent Mistral spot Var",
  },
  {
    slug: "pourquoi-bateau-assistance-essentiel",
    title: "Pourquoi un Bateau d'Assistance est Essentiel pour Apprendre",
    excerpt: "L'importance du bateau d'assistance dans l'apprentissage du kitesurf. Sécurité, progression rapide et gain de temps : découvrez tous les avantages.",
    category: "Sécurité",
    date: "2026-01-28",
    readTime: "4 min",
    image: "blog-bateau-groupe.jpg",
    alt: "Bateau assistance kitesurf Hyères - Sécurité école KiteSurf Passion Var",
  },
  {
    slug: "pumpfoil-dock-start-initiation",
    title: "Pumpfoil & Dock Start : L'Initiation au Foil Sans Vent",
    excerpt: "Pas de vent ? Pas de problème ! Le pumpfoil permet de voler sur l'eau par tous les temps. Découvrez cette discipline accessible à tous.",
    category: "Pump Foil",
    date: "2026-01-20",
    readTime: "5 min",
    image: "blog-pumpfoil.jpg",
    alt: "Pumpfoil dock start Hyères Giens - Initiation foil école KiteSurf Passion Var",
  },
  {
    slug: "meilleure-periode-kitesurf-var",
    title: "Quelle est la Meilleure Période pour le Kitesurf dans le Var ?",
    excerpt: "De mars à novembre, le Var offre des conditions exceptionnelles. Analyse mois par mois des meilleures périodes pour pratiquer le kitesurf et le wingfoil.",
    category: "Le Spot",
    date: "2026-01-15",
    readTime: "7 min",
    image: "blog-kite-duotone.jpg",
    alt: "Meilleure période kitesurf Var Hyères - Saison spot Almanarre",
  },
  {
    slug: "choisir-aile-wingfoil-debutant",
    title: "Comment Choisir son Aile de Wingfoil : Guide Débutant",
    excerpt: "Taille, forme, nombre de fenêtres... Tous les critères pour bien choisir votre première aile de wingfoil et progresser rapidement.",
    category: "Wing Foil",
    date: "2026-01-10",
    readTime: "6 min",
    image: "blog-wingfoil.jpg",
    alt: "Choisir aile wingfoil débutant - Conseil matériel école KiteSurf Passion Hyères",
  },
  {
    slug: "wingfoil-vs-kitesurf-differences",
    title: "Wingfoil vs Kitesurf : Quelles Différences et Lequel Choisir ?",
    excerpt: "Deux disciplines, deux sensations différentes. Comparatif complet pour vous aider à choisir entre le wingfoil et le kitesurf selon votre profil.",
    category: "Wing Foil",
    date: "2025-12-25",
    readTime: "7 min",
    image: "blog-kitesurf-ailes-colorees.jpg",
    alt: "Wingfoil vs kitesurf comparatif - Différences glisse école Hyères Var",
  },
  {
    slug: "technique-pumping-foil-progresser",
    title: "Maîtriser la Technique du Pumping en Foil",
    excerpt: "Le pumping est la clé pour voler sans traction. Découvrez les exercices et conseils pour perfectionner votre technique et gagner en endurance.",
    category: "Pump Foil",
    date: "2025-12-15",
    readTime: "5 min",
    image: "blog-pumpfoil.jpg",
    alt: "Technique pumping foil Hyères - Progresser pumpfoil école KiteSurf Passion Var",
  },
  {
    slug: "premiers-vols-wingfoil-conseils",
    title: "Vos Premiers Vols en Wingfoil : 5 Conseils Essentiels",
    excerpt: "Réussir ses premiers décollages en wingfoil demande technique et patience. Voici les 5 conseils clés pour décoller en toute confiance.",
    category: "Wing Foil",
    date: "2025-12-05",
    readTime: "4 min",
    image: "blog-wingfoil.jpg",
    alt: "Premiers vols wingfoil conseils - Apprendre wing foil Hyères Almanarre Var",
  },
  {
    slug: "pumpfoil-entrainement-sans-vent",
    title: "Pumpfoil : L'Entraînement Idéal les Jours Sans Vent",
    excerpt: "Transformez les jours sans vent en sessions productives. Le pumpfoil développe votre équilibre et votre cardio tout en vous faisant progresser en foil.",
    category: "Pump Foil",
    date: "2025-11-28",
    readTime: "4 min",
    image: "blog-pumpfoil-dock.jpg",
  },
  {
    slug: "ecole-kitesurf-hyeres-almanarre-cours",
    title: "École de Kitesurf à Hyères : Découvrez l'Almanarre",
    excerpt: "Cours de kitesurf débutant, location de matériel et spot mythique de l'Almanarre. Découvrez pourquoi Hyères est la destination kitesurf du Var.",
    category: "Kitesurf",
    date: "2025-01-28",
    readTime: "3 min",
    image: "blog-kitesurf-glisse-fille.jpg",
    alt: "École de kitesurf Hyères Almanarre - Cours débutant spot Var KiteSurf Passion",
    featured: true,
  },
  {
    slug: "stage-wingfoil-hyeres-apprendre-voler",
    title: "Stage Wingfoil à Hyères : Apprenez à Voler sur l'Eau",
    excerpt: "Cours de wingfoil débutant à Hyères avec moniteur diplômé. Découvrez le sport tendance sur le spot de l'Almanarre dans le Var.",
    category: "Wing Foil",
    date: "2025-01-27",
    readTime: "3 min",
    image: "blog-wingfoil-vol-eau-cristalline.jpg",
    alt: "Stage wingfoil Hyères Almanarre - Cours débutant école KiteSurf Passion Var",
    featured: true,
  },
  {
    slug: "pumpfoil-hyeres-dock-start-initiation",
    title: "Pumpfoil à Hyères : Initiez-vous au Dock Start",
    excerpt: "Cours de pumpfoil et dock start à Hyères. Sport sans vent accessible à tous sur la presqu'île de Giens dans le Var.",
    category: "Pump Foil",
    date: "2025-01-26",
    readTime: "3 min",
    image: "blog-pumpfoil.jpg",
    alt: "Pumpfoil dock start Hyères Giens - Initiation foil école KiteSurf Passion Var",
    featured: true,
  },
  {
    slug: "foil-tracte-hyeres-sensations-vol",
    title: "Foil Tracté à Hyères : Vivez les Sensations du Vol",
    excerpt: "Découvrez le foil tracté par bateau à Hyères. Idéal pour s'initier au vol sans vent sur la baie de Giens dans le Var.",
    category: "Kitesurf",
    date: "2025-01-25",
    readTime: "3 min",
    image: "blog-bateau-groupe.jpg",
    alt: "Foil tracté bateau Hyères - Initiation vol école KiteSurf Passion Var",
  },
  {
    slug: "foil-tracte-hyeres-initiation-vol",
    title: "Foil Tracté à Hyères : Initiez-vous au Vol Sans Vent",
    excerpt: "Découvrez le foil tracté par bateau à Hyères sur la baie de Giens. Vivez les sensations du vol au-dessus de l'eau sans dépendre du vent, accessible à tous dès 12 ans.",
    category: "Kitesurf",
    date: "2026-02-02",
    readTime: "9 min",
    image: "blog-foil-tracte-hyeres.jpg",
    alt: "Foil tracté Hyères Giens - Initiation vol bateau école KiteSurf Passion Var",
    featured: true,
  },
  {
    slug: "wakeboard-hyeres-glisse-nautique",
    title: "Wakeboard à Hyères : La Glisse Nautique Accessible à Tous",
    excerpt: "Découvrez le wakeboard à Hyères sur la baie de Giens. Activité nautique fun et accessible dès 8 ans, encadrée par notre moniteur diplômé.",
    category: "Wakeboard",
    date: "2026-02-01",
    readTime: "8 min",
    image: "blog-wakeboard-hyeres.jpg",
    alt: "Wakeboard Hyères Giens - Glisse nautique école KiteSurf Passion Var",
    featured: true,
  },
  {
    slug: "location-kitesurf-hyeres-almanarre-guide",
    title: "Location Matériel Kitesurf à Hyères : Guide Complet",
    excerpt: "Louez votre matériel de kitesurf à Hyères sur le spot de l'Almanarre. Ailes, planches, combinaisons : équipement premium Duotone pour riders autonomes.",
    category: "Kitesurf",
    date: "2026-01-31",
    readTime: "7 min",
    image: "blog-location-materiel.jpg",
    alt: "Location matériel kitesurf Hyères Almanarre - Équipement Duotone école Var",
  },
  {
    slug: "kitesurf-autonome-combien-seances",
    title: "Kitesurf : Combien de Séances pour Devenir Autonome ?",
    excerpt: "De la première leçon au waterstart, découvrez les étapes clés et le nombre de séances nécessaires pour naviguer seul en kitesurf à Hyères.",
    category: "Kitesurf",
    date: "2026-03-01",
    readTime: "8 min",
    image: "blog-kitesurf-waterstart.jpg",
    alt: "Progression kitesurf autonomie Hyères - Nombre séances cours école KiteSurf Passion",
    featured: true,
  },
  {
    slug: "kitesurf-enfant-hyeres-age-ideal",
    title: "Kitesurf Enfant à Hyères : À Quel Âge Commencer ?",
    excerpt: "Votre enfant rêve de kitesurf ? Découvrez l'âge idéal, les conditions de sécurité et nos formules adaptées aux juniors à l'Almanarre.",
    category: "Kitesurf",
    date: "2026-02-28",
    readTime: "7 min",
    image: "blog-kitesurf-kitesurfeuse-planche.jpg",
    alt: "Kitesurf enfant Hyères Almanarre - Cours junior école KiteSurf Passion Var",
  },
  {
    slug: "almanarre-meilleur-spot-kitesurf-france",
    title: "L'Almanarre : Pourquoi C'est le Meilleur Spot de Kitesurf en France",
    excerpt: "Vent régulier, eau plate, cadre exceptionnel : découvrez pourquoi le spot de l'Almanarre à Hyères est considéré comme le meilleur de France.",
    category: "Kitesurf",
    date: "2026-02-25",
    readTime: "9 min",
    image: "blog-kite-duotone.jpg",
    alt: "Almanarre meilleur spot kitesurf France - École Hyères KiteSurf Passion Var",
  },
  {
    slug: "cours-kitesurf-hyeres-guide-complet",
    title: "Cours de Kitesurf à Hyères : Tout ce qu'il Faut Savoir pour se Lancer",
    excerpt: "Vous rêvez de cours de kitesurf à Hyères ? Guide complet : spot, formules, tarifs et conseils pour débuter sur l'Almanarre avec un moniteur diplômé.",
    category: "Kitesurf",
    date: "2026-03-02",
    readTime: "8 min",
    image: "blog-kitesurf-action-eau.jpg",
    alt: "Cours kitesurf Hyères Almanarre - École KiteSurf Passion moniteur diplômé Var",
    featured: true,
  },
  {
    slug: "spot-kitesurf-almanarre-meilleur-var",
    title: "Le Spot de l'Almanarre à Hyères : Pourquoi c'est le Meilleur Spot Kitesurf du Var",
    excerpt: "Vent fiable, eau plate, cadre unique : découvrez pourquoi le spot kitesurf de l'Almanarre à Hyères est la référence incontournable du Var.",
    category: "Le Spot",
    date: "2026-02-27",
    readTime: "9 min",
    image: "blog-kitesurf-freestyle-pink.jpg",
    alt: "Spot kitesurf Almanarre Hyères - Meilleur spot Var école KiteSurf Passion",
  },
  {
    slug: "kitesurf-ou-wingfoil-choisir-hyeres",
    title: "Kitesurf ou Wingfoil : Lequel Choisir pour Débuter à Hyères ?",
    excerpt: "Kitesurf vs wingfoil : comparatif complet pour choisir la discipline idéale selon votre profil. Conseils d'expert depuis l'Almanarre à Hyères.",
    category: "Wing Foil",
    date: "2026-02-22",
    readTime: "8 min",
    image: "blog-wingfoil.jpg",
    alt: "Kitesurf vs wingfoil comparatif Hyères - Choisir discipline école KiteSurf Passion",
  },
  {
    slug: "stage-kitesurf-hyeres-progresser-almanarre",
    title: "Stage Kitesurf à Hyères : Comment Progresser Rapidement sur l'Almanarre ?",
    excerpt: "Stage kitesurf à Hyères : formules intensives, programme jour par jour et conseils pour progresser vite sur le spot de l'Almanarre dans le Var.",
    category: "Kitesurf",
    date: "2026-02-18",
    readTime: "9 min",
    image: "blog-kite-duotone.jpg",
    alt: "Stage kitesurf Hyères Almanarre - Progresser rapidement école KiteSurf Passion Var",
  },
  {
    slug: "meteo-vent-kitesurf-hyeres-saisons",
    title: "Quand Pratiquer le Kitesurf à Hyères ? Météo, Vents et Meilleures Saisons",
    excerpt: "Mistral, marin, thermique : guide complet de la météo et des vents pour le kitesurf à Hyères. Découvrez les meilleures saisons mois par mois.",
    category: "Le Spot",
    date: "2026-02-15",
    readTime: "8 min",
    image: "blog-kitesurf-plage-rose.jpg",
    alt: "Météo vent kitesurf Hyères - Saisons Mistral Almanarre école KiteSurf Passion",
  },
  {
    slug: "activites-nautiques-hyeres-famille",
    title: "Activités Nautiques à Hyères en Famille : Le Guide Complet",
    excerpt: "Kitesurf, wingfoil, wakeboard, foil tracté : découvrez toutes les activités nautiques à faire en famille à Hyères et sur la presqu'île de Giens.",
    category: "Kitesurf",
    date: "2026-03-10",
    readTime: "8 min",
    image: "blog-bateau-groupe.jpg",
    alt: "Activités nautiques famille Hyères Giens - Sports glisse enfants école KiteSurf Passion",
    featured: true,
  },
  {
    slug: "bon-cadeau-kitesurf-wingfoil-hyeres",
    title: "Bon Cadeau Kitesurf et Wingfoil à Hyères : Offrez des Sensations",
    excerpt: "Offrez un bon cadeau kitesurf, wingfoil ou foil tracté à Hyères. Idée cadeau originale pour un anniversaire, Noël ou toute occasion spéciale.",
    category: "Kitesurf",
    date: "2026-03-08",
    readTime: "6 min",
    image: "blog-kitesurf-grab-coloree.jpg",
    alt: "Bon cadeau kitesurf wingfoil Hyères - Idée cadeau école KiteSurf Passion Var",
  },
  {
    slug: "preparation-physique-kitesurf-exercices",
    title: "Préparation Physique pour le Kitesurf : 10 Exercices Essentiels",
    excerpt: "Renforcez votre corps pour le kitesurf avec ces 10 exercices ciblés. Gainage, explosivité et souplesse pour progresser plus vite sur l'eau.",
    category: "Kitesurf",
    date: "2026-03-05",
    readTime: "7 min",
    image: "blog-kitesurf-saut-action.jpg",
    alt: "Préparation physique kitesurf exercices - Entraînement école KiteSurf Passion Hyères",
  },
  {
    slug: "evg-evjf-activite-nautique-hyeres",
    title: "EVG et EVJF à Hyères : Activités Nautiques pour un Enterrement de Vie Mémorable",
    excerpt: "Organisez un EVG ou EVJF inoubliable à Hyères avec des activités nautiques : wakeboard, foil tracté, kitesurf. Sensations fortes garanties.",
    category: "Wakeboard",
    date: "2026-03-06",
    readTime: "6 min",
    image: "blog-wakeboard-evg-evjf.jpg",
    alt: "EVG EVJF activité nautique Hyères - Enterrement vie groupe école KiteSurf Passion",
  },
  {
    slug: "hebergement-kitesurf-hyeres-ou-dormir",
    title: "Où Dormir pour un Séjour Kitesurf à Hyères ? Guide Hébergement",
    excerpt: "Les meilleurs hébergements près du spot de l'Almanarre à Hyères : hôtels, campings, locations. Conseils pratiques pour votre séjour kitesurf.",
    category: "Le Spot",
    date: "2026-03-04",
    readTime: "7 min",
    image: "blog-kite-duotone.jpg",
    alt: "Hébergement kitesurf Hyères Almanarre - Où dormir séjour école KiteSurf Passion Var",
  },
  {
    slug: "apprendre-kitesurf-hyeres-guide-debutant",
    title: "Apprendre le Kitesurf à Hyères : Guide Complet pour Débutants",
    excerpt: "Vous voulez apprendre le kitesurf à Hyères ? Découvrez notre guide complet : matériel, sécurité, durée d'apprentissage et pourquoi choisir le spot de l'Almanarre.",
    category: "Kitesurf",
    date: "2025-03-10",
    readTime: "5 min",
    image: "blog-kitesurf-glisse-turquoise.jpg",
    alt: "Apprendre kitesurf Hyères Almanarre - Guide débutant école KiteSurf Passion Var",
    featured: true,
  },
  {
    slug: "spot-kitesurf-almanarre-hyeres",
    title: "Spot Kitesurf Almanarre Hyères : Tout Savoir sur le Meilleur Spot du Var",
    excerpt: "L'Almanarre à Hyères est le spot kitesurf incontournable de Méditerranée. Vent, conditions, accès, carte : tout ce qu'il faut savoir pour rider.",
    category: "Le Spot",
    date: "2025-02-24",
    readTime: "5 min",
    image: "blog-kitesurf-saut-vagues.jpg",
    alt: "Spot kitesurf Almanarre Hyères Var - Guide complet meilleur spot Méditerranée",
    featured: true,
  },
  {
    slug: "wingfoil-vs-kitesurf-quelle-discipline-choisir",
    title: "Wingfoil vs Kitesurf : Quelle Discipline Choisir à Hyères ?",
    excerpt: "Wingfoil ou kitesurf : laquelle choisir pour débuter à Hyères ? Comparatif complet : matériel, niveau requis, sensations, vent minimum.",
    category: "Wing Foil",
    date: "2025-03-18",
    readTime: "6 min",
    image: "blog-wingfoil.jpg",
    alt: "Wingfoil vs kitesurf comparatif Hyères - Quelle discipline choisir école KiteSurf Passion",
    featured: true,
  },
  {
    slug: "quand-faire-kitesurf-hyeres-saisons",
    title: "Quand Partir Faire du Kitesurf à Hyères ? Guide Saison par Saison",
    excerpt: "Printemps, été, automne : quelle est la meilleure période pour faire du kitesurf à Hyères ? Analyse des vents, températures et conditions mois par mois sur l'Almanarre.",
    category: "Le Spot",
    date: "2026-03-28",
    readTime: "12 min",
    image: "blog-kitesurf-almanarre-action.jpg",
    alt: "Quand faire kitesurf Hyères saisons - Guide périodes vent Almanarre école KiteSurf Passion",
    featured: true,
  },
  {
    slug: "mistral-vent-est-almanarre-conditions-niveau",
    title: "Mistral ou Vent d'Est à l'Almanarre : Quelles Conditions Selon Votre Niveau ?",
    excerpt: "Mistral side-shore ou vent d'Est on-shore : découvrez quel vent choisir à l'Almanarre selon votre niveau de kitesurf. Analyse experte du spot de Hyères.",
    category: "Le Spot",
    date: "2026-03-25",
    readTime: "11 min",
    image: "blog-kite-duotone.jpg",
    alt: "Mistral vent Est Almanarre kitesurf conditions - Guide niveau spot Hyères KiteSurf Passion",
    featured: true,
  },
  {
    slug: "stage-kitesurf-hyeres-formule-choisir",
    title: "Stage Kitesurf à Hyères : 5 Jours, Semi-Privé ou Cours Particulier ?",
    excerpt: "Stage 5 jours, cours semi-privé ou leçon particulière : quelle formule de kitesurf choisir à Hyères ? Comparatif complet pour trouver l'option idéale.",
    category: "Kitesurf",
    date: "2026-03-22",
    readTime: "11 min",
    image: "blog-kitesurf-cours-groupe.jpg",
    alt: "Stage kitesurf Hyères formule choisir - Cours particulier semi-privé école KiteSurf Passion",
    featured: true,
  },
  {
    slug: "prix-stage-kitesurf-hyeres",
    title: "Prix d'un stage de kitesurf à Hyères : quel budget prévoir pour débuter ?",
    excerpt: "Quel budget prévoir pour apprendre le kitesurf à Hyères ? Tarifs, options, hébergement et conseils pour choisir la bonne formule.",
    category: "Kitesurf",
    date: "2026-03-30",
    readTime: "9 min",
    image: "blog-kitesurf-marche-plage.jpg",
    alt: "Prix stage kitesurf Hyères budget - Tarifs cours école KiteSurf Passion Almanarre",
    featured: true,
  },
  {
    slug: "cours-particulier-ou-collectif-kitesurf-hyeres",
    title: "Cours particulier ou collectif kitesurf Hyères : que choisir ?",
    excerpt: "Hésitez-vous entre un cours particulier et un stage collectif de kitesurf à Hyères ? Découvrez les avantages de chaque formule pour apprendre à l'Almanarre.",
    category: "Kitesurf",
    date: "2026-04-01",
    readTime: "10 min",
    image: "blog-cours-particulier-kitesurf.jpg",
    alt: "Cours particulier ou collectif kitesurf Hyères - Comparatif formules école KiteSurf Passion Almanarre",
    featured: true,
  },
  {
    slug: "stage-kitesurf-debutant-hyeres",
    title: "Stage kitesurf débutant à Hyères : le guide pour bien commencer",
    excerpt: "Vous cherchez un stage de kitesurf débutant à Hyères ? Découvrez le programme, le déroulé sur 5 jours, les conditions à l'Almanarre et comment progresser en sécurité.",
    category: "Kitesurf",
    date: "2026-04-03",
    readTime: "10 min",
    image: "blog-kitesurf-cours-individuel.jpg",
    alt: "Stage kitesurf débutant Hyères Almanarre - Programme 5 jours école KiteSurf Passion Var",
    featured: true,
  },
  {
    slug: "stage-kitesurf-hyeres-3-jours-ou-5-jours",
    title: "Stage kitesurf Hyères : 3 jours ou 5 jours ?",
    excerpt: "Vous hésitez entre un stage kitesurf de 3 jours ou 5 jours à Hyères ? Comparez les deux formats selon votre niveau, votre temps disponible et votre objectif de progression.",
    category: "Kitesurf",
    date: "2026-04-04",
    readTime: "10 min",
    image: "blog-kitesurf-spray-turquoise.jpg",
    alt: "Stage kitesurf 3 jours ou 5 jours Hyères - Comparatif durée école KiteSurf Passion Almanarre",
    featured: true,
  },
  {
    slug: "premier-stage-kitesurf-hyeres-checklist",
    title: "Premier stage de kitesurf à Hyères : checklist complète pour débuter sereinement",
    excerpt: "Préparez votre premier stage de kitesurf à Hyères avec la checklist complète : équipement, mental, sécurité, spot de l'Almanarre, déroulé sur 5 jours et conseils débutant.",
    category: "Kitesurf",
    date: "2026-04-06",
    readTime: "12 min",
    image: "blog-kitesurf-preparation.jpg",
    alt: "Premier stage kitesurf Hyères checklist débutant - École KiteSurf Passion Almanarre",
    featured: true,
  },
  {
    slug: "apprendre-kitesurf-40-50-60-ans",
    title: "Apprendre le kitesurf à 40, 50 ou 60 ans à Hyères",
    excerpt: "Oui, il est possible d'apprendre le kitesurf à 40, 50 ou 60 ans à Hyères. Découvrez pourquoi l'Almanarre est un spot idéal, quelle formule choisir et comment progresser en confiance.",
    category: "Kitesurf",
    date: "2026-04-10",
    readTime: "10 min",
    image: "blog-kitesurf-cours-plage.jpg",
    alt: "Apprendre kitesurf adulte 40 50 60 ans Hyères - Stage débutant école KiteSurf Passion Almanarre",
    featured: true,
  },
];

const categories = ["Tous", "Kitesurf", "Wing Foil", "Pump Foil", "Wakeboard", "Le Spot", "Sécurité"];

// Map URL-friendly slugs to display names
const categorySlugMap: Record<string, string> = {
  "kitesurf": "Kitesurf",
  "wingfoil": "Wing Foil", 
  "pumpfoil": "Pump Foil",
  "wakeboard": "Wakeboard",
  "le-spot": "Le Spot",
  "securite": "Sécurité",
};

const getCategorySlug = (category: string): string => {
  return category.toLowerCase().replace(/ /g, "").replace("é", "e");
};

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const categoryParam = searchParams.get("categorie");
  
  // Get selected category from URL or default to "Tous"
  const selectedCategory = categoryParam 
    ? (categorySlugMap[categoryParam] || "Tous")
    : "Tous";

  const handleCategoryChange = (category: string) => {
    setSearchQuery(""); // Reset search when changing category
    setIsLoading(true);
    if (category === "Tous") {
      setSearchParams({});
    } else {
      setSearchParams({ categorie: getCategorySlug(category) });
    }
  };

  // Simulate loading effect
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, selectedCategory, searchQuery]);

  // Filter articles based on selected category and search query
  const filteredArticles = blogArticles.filter(article => {
    const matchesCategory = selectedCategory === "Tous" || article.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = searchLower === "" || 
      article.title.toLowerCase().includes(searchLower) ||
      article.excerpt.toLowerCase().includes(searchLower) ||
      article.category.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = filteredArticles.filter(article => article.featured);

  // Pagination
  const ARTICLES_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  // Reset page when filters change
  const handleCategoryChangeWithReset = (category: string) => {
    setCurrentPage(1);
    handleCategoryChange(category);
  };

  // Count articles per category
  const getCategoryCount = (category: string): number => {
    if (category === "Tous") return blogArticles.length;
    return blogArticles.filter(article => article.category === category).length;
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog KiteSurf Passion",
    description: "Actualités, conseils et guides sur le kitesurf, wingfoil et sports de glisse à Hyères",
    url: "https://www.kitesurfpassion.fr/blog-kitesurf-hyeres",
    publisher: {
      "@type": "Organization",
      name: "KiteSurf Passion",
      logo: {
        "@type": "ImageObject",
        url: "https://www.kitesurfpassion.fr/logo.png",
        creditText: "KiteSurf Passion",
        copyrightNotice: "© KiteSurf Passion",
        creator: {
          "@type": "Organization",
          name: "KiteSurf Passion",
          url: "https://www.kitesurfpassion.fr",
        },
        license: "https://www.kitesurfpassion.fr/mentions-legales",
        acquireLicensePage: "https://www.kitesurfpassion.fr/contact-reservation-kitesurf-hyeres",
      },
    },
    blogPost: blogArticles.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      datePublished: `${article.date}T08:00:00+01:00`,
      dateModified: `${article.date}T08:00:00+01:00`,
      url: `https://www.kitesurfpassion.fr/blog/${article.slug}`,
      image: `https://www.kitesurfpassion.fr/images/${article.image}`,
      author: {
        "@type": "Person",
        name: "Yoanne Cros",
        url: "https://www.kitesurfpassion.fr/a-propos-ecole-kitesurf-hyeres",
      },
    })),
  };

  return (
    <>
      <Helmet>
        <title>Blog Kitesurf Hyères | Conseils & Guides</title>
        <meta
          name="description"
          content="Conseils d'experts, guides pratiques et actualités sur le kitesurf, wingfoil et sports de glisse à Hyères. Apprenez avec KiteSurf Passion depuis 1999."
        />
        <meta
          name="keywords"
          content="blog kitesurf hyères, conseils wingfoil, guide débutant kitesurf, conditions almanarre, météo kitesurf var"
        />
        <link rel="canonical" href="https://www.kitesurfpassion.fr/blog-kitesurf-hyeres" />
        <link rel="alternate" hrefLang="fr-FR" href="https://www.kitesurfpassion.fr/blog-kitesurf-hyeres" />
        <link rel="alternate" hrefLang="x-default" href="https://www.kitesurfpassion.fr/blog-kitesurf-hyeres" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Blog Kitesurf Hyères | Conseils & Guides d'Experts" />
        <meta property="og:description" content="25 ans d'expérience partagée : conseils pour débuter, guides des spots, conditions météo et actualités kitesurf à Hyères." />
        <meta property="og:type" content="blog" />
        <meta property="og:url" content="https://www.kitesurfpassion.fr/blog-kitesurf-hyeres" />
        <meta property="og:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Blog kitesurf wingfoil - Conseils et guides pratiques Hyères" />
        <meta property="og:site_name" content="KiteSurf Passion" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog Kitesurf Hyères | Conseils d'Experts" />
        <meta name="twitter:description" content="Guides pratiques et conseils pour progresser en kitesurf et wingfoil à Hyères." />
        <meta name="twitter:image" content="https://www.kitesurfpassion.fr/og-image.jpg" />
        <meta name="twitter:image:alt" content="Blog kitesurf wingfoil Hyères" />
        
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.kitesurfpassion.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Blog & Actualités", "item": "https://www.kitesurfpassion.fr/blog-kitesurf-hyeres" }
          ]
        })}</script>
      </Helmet>

      <Header />
      <PageBreadcrumb items={breadcrumbItems} className="bg-background/80 backdrop-blur-sm" />

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Blog kitesurf wingfoil pumpfoil - Presqu'île de Giens"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-navy/20" />
          </div>

          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-2xl">
              <span className="inline-block text-sunset font-semibold mb-4">Blog & Actualités</span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
                Conseils d'Experts & Guides Pratiques
              </h1>
              <p className="text-primary-foreground/80 text-lg mb-8">
                25 ans d'expérience partagée : conseils pour débuter, guides des spots, conditions météo et actualités du kitesurf à Hyères.
              </p>
            </div>
          </div>
        </section>

        {/* Search & Categories Filter */}
        <section className="py-8 bg-muted/30 border-b border-border/50">
          <div className="container mx-auto px-4">
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); setIsLoading(true); }}
                  className="pl-10 pr-10 py-2 rounded-full border-border/50 focus:border-primary"
                  maxLength={100}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChangeWithReset(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    category === selectedCategory
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/50"
                  }`}
                >
                  {category}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    category === selectedCategory
                      ? "bg-primary-foreground/20"
                      : "bg-muted"
                  }`}>
                    {getCategoryCount(category)}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Results Info */}
            {searchQuery && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {filteredArticles.length} résultat{filteredArticles.length !== 1 ? 's' : ''} pour "{searchQuery}"
              </p>
            )}
          </div>
        </section>

        {/* Featured Articles */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            {featuredArticles.length > 0 && (
              <>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-10">
                  Articles à la Une
                </h2>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                  {featuredArticles.map((article) => (
                  <Link
                    key={article.slug}
                    to={`/blog/${article.slug}`}
                    className="group bg-card rounded-3xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={getArticleImage(article.image)}
                        alt={article.alt || article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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
                      <h3 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2 mb-4">
                        {article.excerpt}
                      </p>
                      <span className="inline-flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                        Lire l'article
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
            )}

            {/* All Articles */}
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-10">
              {selectedCategory === "Tous" ? "Tous les Articles" : `Articles ${selectedCategory}`}
            </h2>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border/50">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-5 space-y-3">
                      <div className="flex gap-3">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-2xl">
                <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Aucun article trouvé</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery 
                    ? `Aucun résultat pour "${searchQuery}"${selectedCategory !== "Tous" ? ` dans la catégorie ${selectedCategory}` : ""}.`
                    : `Aucun article dans la catégorie ${selectedCategory} pour le moment.`
                  }
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchQuery(""); handleCategoryChangeWithReset("Tous"); }}
                >
                  Voir tous les articles
                </Button>
              </div>
            ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedArticles.map((article) => (
                <div
                  key={article.slug}
                  className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-md relative"
                >
                  <Link to={`/blog/${article.slug}`}>
                    <div className="aspect-video overflow-hidden relative">
                      <img
                        src={getArticleImage(article.image)}
                        alt={article.alt || article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ShareButtons 
                          url={`https://www.kitesurfpassion.fr/blog/${article.slug}`}
                          title={article.title}
                        />
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          {article.category}
                        </span>
                        <span>{article.readTime}</span>
                      </div>
                      <h3 className="font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                      page === currentPage
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Page suivante"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <NewsletterForm />
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={blogCtaImage} 
              alt="Kitesurf au coucher de soleil à Hyères" 
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-navy/60" />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="font-display text-3xl font-bold text-white mb-4">
              Prêt à Vous Lancer ?
            </h2>
            <p className="text-white/90 mb-8 max-w-xl mx-auto">
              Passez de la théorie à la pratique avec nos stages encadrés par des professionnels.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="heroFilled" size="lg" asChild>
                <Link to="/contact-reservation-kitesurf-hyeres">
                  Réserver un Stage
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <Link to="/tarifs-cours-kitesurf-wingfoil-hyeres">Voir les Tarifs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Blog;
