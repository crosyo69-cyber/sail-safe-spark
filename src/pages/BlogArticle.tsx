import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Link, useParams, Navigate } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogArticles } from "./Blog";

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
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
            </div>
          </header>

          {/* Article Image */}
          <div className="max-w-4xl mx-auto mb-12">
            <img
              src={`/src/assets/${article.image}`}
              alt={article.title}
              className="w-full rounded-2xl"
            />
          </div>

          {/* Article Content */}
          <div className="max-w-3xl mx-auto prose prose-lg prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary prose-strong:text-foreground">
            <div dangerouslySetInnerHTML={{ __html: content.content.replace(/\n/g, '<br />') }} />
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
                        alt={related.title}
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
