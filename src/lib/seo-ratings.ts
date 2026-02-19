/**
 * Centralized SEO structured data for ratings and reviews
 * Based on real testimonials from TestimonialsSection
 * 
 * These values should only be updated when real reviews are added/modified
 */

// Real testimonials data from the site
const REAL_TESTIMONIALS = [
  {
    name: "Marie L.",
    rating: 5,
    date: "2024-09-15",
    text: "Super expérience avec Yoanne ! Très pédagogue et patient. Le bateau d'assistance est vraiment rassurant pour les débutants. J'ai appris les bases en 5 séances. Je recommande à 100% !",
  },
  {
    name: "Thomas D.",
    rating: 5,
    date: "2024-08-22",
    text: "Meilleure école de kite du Var ! Le spot de l'Almanarre est parfait et l'équipe est au top. En 5 jours, j'étais autonome. Merci pour cette super semaine !",
  },
  {
    name: "Sophie M.",
    rating: 5,
    date: "2024-07-18",
    text: "J'ai testé le wingfoil et c'est une révélation ! Yoanne explique tout clairement et on progresse vite. L'école itinérante permet de toujours avoir les meilleures conditions.",
  },
  {
    name: "Pierre R.",
    rating: 5,
    date: "2024-06-10",
    text: "École familiale, ambiance détendue mais professionnelle. Le bateau d'assistance change tout pour la progression. Spot magnifique avec une eau turquoise incroyable.",
  },
  {
    name: "Julie B.",
    rating: 5,
    date: "2024-05-05",
    text: "Stage kitesurf offert en cadeau, et quelle découverte ! Yoanne et son équipe sont passionnés et ça se ressent. Vivement l'été prochain pour continuer !",
  },
  {
    name: "Lucas G.",
    rating: 5,
    date: "2024-09-28",
    text: "Parfait pour un débutant comme moi. L'équipe est super sympa et le matériel est top. Le bateau qui vous récupère, c'est vraiment le plus !",
  },
  {
    name: "Camille F.",
    rating: 4,
    date: "2024-08-10",
    text: "Très bonne expérience globale. Le moniteur est patient et pédagogue. Seul petit bémol : beaucoup de monde en août, mais c'est la haute saison !",
  },
  {
    name: "Antoine V.",
    rating: 5,
    date: "2024-07-25",
    text: "Le pumpfoil, quelle découverte ! Même sans vent, on peut voler sur l'eau. Yoanne m'a appris le dock start en 2 séances. Sensation incroyable !",
  },
];

// Calculate aggregate values from real data
const totalRating = REAL_TESTIMONIALS.reduce((sum, t) => sum + t.rating, 0);
const averageRating = (totalRating / REAL_TESTIMONIALS.length).toFixed(1);
const reviewCount = REAL_TESTIMONIALS.length;

/**
 * Schema.org AggregateRating for Product structured data
 * Only includes real verified reviews
 */
export const productAggregateRating = {
  "@type": "AggregateRating",
  ratingValue: averageRating,
  reviewCount: reviewCount,
  bestRating: "5",
  worstRating: "1",
};

// Item reviewed reference for all reviews
const itemReviewed = {
  "@type": "LocalBusiness",
  "@id": "https://www.kitesurfpassion.fr/#organization",
  name: "KiteSurf Passion",
  url: "https://www.kitesurfpassion.fr",
  telephone: "+33672716905",
  priceRange: "€€",
  image: "https://www.kitesurfpassion.fr/og-image.jpg",
};

/**
 * Schema.org Review array for Product structured data
 * Contains actual customer reviews (limited to 3 most recent for SEO)
 * Each review includes itemReviewed to satisfy Google validation
 */
export const productReviews = REAL_TESTIMONIALS.slice(0, 3).map((t) => ({
  "@type": "Review",
  author: {
    "@type": "Person",
    name: t.name,
  },
  datePublished: t.date,
  reviewBody: t.text,
  reviewRating: {
    "@type": "Rating",
    ratingValue: t.rating.toString(),
    bestRating: "5",
    worstRating: "1",
  },
  itemReviewed: itemReviewed,
}));

/**
 * Helper to get complete Product rating data for JSON-LD
 * Includes both aggregateRating and review array
 */
export function getProductRatingData() {
  return {
    aggregateRating: productAggregateRating,
    review: productReviews,
  };
}

/**
 * SEO rating metadata for display
 */
export const ratingMetadata = {
  averageRating: parseFloat(averageRating),
  reviewCount: reviewCount,
  ratingValue: averageRating,
};
