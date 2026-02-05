import { memo, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Star, Quote, MapPin, CheckCircle, MessageSquarePlus } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewSubmissionForm } from "@/components/ReviewSubmissionForm";
import { Button } from "@/components/ui/button";
export const testimonials = [
  {
    id: 1,
    name: "Marie L.",
    rating: 5,
    date: "2024-09-15",
    dateDisplay: "Septembre 2024",
    text: "Super expérience avec Yoanne ! Très pédagogue et patient. Le bateau d'assistance est vraiment rassurant pour les débutants. J'ai appris les bases en 5 séances. Je recommande à 100% !",
    course: "Stage 100% Glisse",
    location: "Almanarre, Hyères",
    verified: true,
  },
  {
    id: 2,
    name: "Thomas D.",
    rating: 5,
    date: "2024-08-22",
    dateDisplay: "Août 2024",
    text: "Meilleure école de kite du Var ! Le spot de l'Almanarre est parfait et l'équipe est au top. En 5 jours, j'étais autonome. Merci pour cette super semaine !",
    course: "Stage 100% Glisse",
    location: "Almanarre, Hyères",
    verified: true,
  },
  {
    id: 3,
    name: "Sophie M.",
    rating: 5,
    date: "2024-07-18",
    dateDisplay: "Juillet 2024",
    text: "J'ai testé le wingfoil et c'est une révélation ! Yoanne explique tout clairement et on progresse vite. L'école itinérante permet de toujours avoir les meilleures conditions.",
    course: "Stage Wing Foil",
    location: "Almanarre, Hyères",
    verified: true,
  },
  {
    id: 4,
    name: "Pierre R.",
    rating: 5,
    date: "2024-06-10",
    dateDisplay: "Juin 2024",
    text: "École familiale, ambiance détendue mais professionnelle. Le bateau d'assistance change tout pour la progression. Spot magnifique avec une eau turquoise incroyable.",
    course: "Stage 100% Glisse",
    location: "Almanarre, Hyères",
    verified: true,
  },
  {
    id: 5,
    name: "Julie B.",
    rating: 5,
    date: "2024-05-05",
    dateDisplay: "Mai 2024",
    text: "Stage kitesurf offert en cadeau, et quelle découverte ! Yoanne et son équipe sont passionnés et ça se ressent. Vivement l'été prochain pour continuer !",
    course: "Stage 100% Glisse",
    location: "Almanarre, Hyères",
    verified: true,
  },
  {
    id: 6,
    name: "Lucas G.",
    rating: 5,
    date: "2024-09-28",
    dateDisplay: "Septembre 2024",
    text: "Parfait pour un débutant comme moi. L'équipe est super sympa et le matériel est top. Le bateau qui vous récupère, c'est vraiment le plus !",
    course: "Cours Particulier",
    location: "Almanarre, Hyères",
    verified: true,
  },
  {
    id: 7,
    name: "Camille F.",
    rating: 4,
    date: "2024-08-10",
    dateDisplay: "Août 2024",
    text: "Très bonne expérience globale. Le moniteur est patient et pédagogue. Seul petit bémol : beaucoup de monde en août, mais c'est la haute saison !",
    course: "Stage Wing Foil",
    location: "Almanarre, Hyères",
    verified: true,
  },
  {
    id: 8,
    name: "Antoine V.",
    rating: 5,
    date: "2024-07-25",
    dateDisplay: "Juillet 2024",
    text: "Le pumpfoil, quelle découverte ! Même sans vent, on peut voler sur l'eau. Yoanne m'a appris le dock start en 2 séances. Sensation incroyable !",
    course: "Initiation Pump Foil",
    location: "Carqueiranne",
    verified: true,
  },
];

// Calculate aggregate rating
const totalRating = testimonials.reduce((sum, t) => sum + t.rating, 0);
const averageRating = (totalRating / testimonials.length).toFixed(1);
const reviewCount = testimonials.length;

// Item reviewed reference for all reviews
const itemReviewed = {
  "@type": "LocalBusiness",
  "@id": "https://www.kitesurfpassion.fr/#organization",
  name: "KiteSurf Passion",
};

// Schema.org structured data for reviews
export const reviewsStructuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.kitesurfpassion.fr/#organization",
  name: "KiteSurf Passion",
  telephone: "+33672716905",
  priceRange: "€€",
  image: "https://www.kitesurfpassion.fr/og-image.jpg",
  address: {
    "@type": "PostalAddress",
    streetAddress: "52 Avenue Général de Gaulle",
    addressLocality: "Carqueiranne",
    postalCode: "83320",
    addressRegion: "Var",
    addressCountry: "FR",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: averageRating,
    reviewCount: reviewCount,
    bestRating: "5",
    worstRating: "1",
  },
  review: testimonials.map((t) => ({
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
  })),
};

export const TestimonialsSection = memo(function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Note: JSON-LD structured data is now centralized in Index.tsx to avoid
  // "multiple aggregate ratings" error in Google Search Console
  return (
    <>
      <section 
        className="py-24 bg-gradient-to-b from-secondary/30 to-background"
        style={{ contain: 'layout style' }}
      >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary font-semibold mb-4">Témoignages</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ils Ont Appris avec{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-turquoise">
              KiteSurf Passion
            </span>
          </h2>
          
          {/* Aggregate Rating */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <StarRating rating={parseFloat(averageRating)} size="lg" />
              <span className="font-display text-2xl font-bold text-foreground">{averageRating}/5</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="hidden sm:inline">•</span>
              <span>{reviewCount} avis vérifiés</span>
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Basé sur les avis Google et les retours de nos élèves
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          <div 
            className="relative"
            style={{ minHeight: '320px', contain: 'layout' }}
          >
            {testimonials.slice(0, 5).map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`transition-all duration-500 ${
                  index === activeIndex
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 absolute inset-0 translate-y-4 pointer-events-none"
                }`}
                style={{ contain: index === activeIndex ? 'none' : 'strict' }}
              >
                <div className="bg-card rounded-3xl p-8 sm:p-12 shadow-lg border border-border/50 text-center">
                  {/* Quote Icon */}
                  <Quote className="w-12 h-12 text-primary/20 mx-auto mb-6" />

                  {/* Rating */}
                  <div className="flex justify-center mb-6">
                    <StarRating rating={testimonial.rating} size="md" />
                  </div>

                  {/* Text */}
                  <p className="text-foreground text-lg sm:text-xl leading-relaxed mb-8">
                    "{testimonial.text}"
                  </p>

                  {/* Author */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <p className="font-display font-bold text-foreground">{testimonial.name}</p>
                      {testimonial.verified && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-primary text-sm font-medium">{testimonial.course}</p>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                      <MapPin className="w-3 h-3" />
                      <span>{testimonial.location}</span>
                      <span className="mx-1">•</span>
                      <span>{testimonial.dateDisplay}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "bg-primary w-8"
                    : "bg-primary/30 hover:bg-primary/50"
                }`}
                aria-label={`Voir l'avis ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* All Reviews Grid */}
        <div className="mt-16">
          <h3 className="font-display text-2xl font-bold text-foreground text-center mb-8">
            Tous les Avis
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-card rounded-2xl p-5 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <StarRating rating={testimonial.rating} size="sm" />
                  {testimonial.verified && (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-foreground text-sm line-clamp-3 mb-3">
                  "{testimonial.text}"
                </p>
                <div className="pt-3 border-t border-border/50">
                  <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
                  <p className="text-muted-foreground text-xs">{testimonial.course} • {testimonial.dateDisplay}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review Submission Section */}
        <div className="mt-16 max-w-xl mx-auto">
          {!showReviewForm ? (
            <div className="text-center">
              <Button
                size="lg"
                onClick={() => setShowReviewForm(true)}
                className="gap-2"
              >
                <MessageSquarePlus className="w-5 h-5" />
                Laisser votre avis
              </Button>
              <p className="text-muted-foreground text-sm mt-3">
                Vous avez suivi un cours avec nous ? Partagez votre expérience !
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <ReviewSubmissionForm />
              <button
                onClick={() => setShowReviewForm(false)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
              >
                ← Retour aux témoignages
              </button>
            </div>
          )}
        </div>
      </div>
      </section>
    </>
  );
});
