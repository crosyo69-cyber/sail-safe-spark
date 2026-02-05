import { Star, Quote, MapPin, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { StarRating } from "@/components/ui/star-rating";

// Témoignages spécifiques au foil tracté et wakeboard
export const foilWakeboardTestimonials = [
  {
    id: 1,
    name: "Émilie R.",
    rating: 5,
    date: "2024-09-20",
    dateDisplay: "Septembre 2024",
    text: "Le foil tracté, quelle sensation incroyable ! J'avais peur au début mais Yoanne est super rassurant. En 20 min, je volais déjà au-dessus de l'eau. Une expérience magique sur la baie d'Hyères !",
    course: "Foil Tracté",
    location: "Baie d'Hyères",
    verified: true,
  },
  {
    id: 2,
    name: "Maxime T.",
    rating: 5,
    date: "2024-08-15",
    dateDisplay: "Août 2024",
    text: "Super session de wakeboard avec mon fils de 10 ans ! Le moniteur est patient et les sensations sont au rendez-vous. On reviendra cet été pour essayer le foil tracté.",
    course: "Wakeboard",
    location: "Baie d'Hyères",
    verified: true,
  },
  {
    id: 3,
    name: "Clara M.",
    rating: 5,
    date: "2024-07-28",
    dateDisplay: "Juillet 2024",
    text: "Parfait pour découvrir le foil avant de se lancer en wing foil ! La méthode tractée permet de comprendre l'équilibre sans se soucier du vent. Je recommande la session de 40 min.",
    course: "Foil Tracté",
    location: "Baie d'Hyères",
    verified: true,
  },
  {
    id: 4,
    name: "Nicolas B.",
    rating: 5,
    date: "2024-08-05",
    dateDisplay: "Août 2024",
    text: "Le wakeboard à Hyères, c'est top ! Bateau impeccable, eau claire et moniteur au top. 15 minutes de pur bonheur. Idéal pour une activité en famille ou entre amis.",
    course: "Wakeboard",
    location: "Baie d'Hyères",
    verified: true,
  },
];

// Item reviewed reference for all reviews
const itemReviewed = {
  "@type": "LocalBusiness",
  "@id": "https://www.kitesurfpassion.fr/#organization",
  name: "KiteSurf Passion",
};

interface FoilWakeboardTestimonialsProps {
  variant?: "foilTracte" | "wakeboard" | "both";
  title?: string;
}

export function FoilWakeboardTestimonials({ 
  variant = "both",
  title = "Témoignages Clients"
}: FoilWakeboardTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Filter testimonials based on variant
  const filteredTestimonials = variant === "both" 
    ? foilWakeboardTestimonials 
    : foilWakeboardTestimonials.filter(t => 
        variant === "foilTracte" ? t.course === "Foil Tracté" : t.course === "Wakeboard"
      );

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filteredTestimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [filteredTestimonials.length]);

  // Calculate aggregate rating for filtered testimonials
  const totalRating = filteredTestimonials.reduce((sum, t) => sum + t.rating, 0);
  const averageRating = (totalRating / filteredTestimonials.length).toFixed(1);

  const accentColor = variant === "wakeboard" ? "sunset" : "primary";

  // Generate structured data for all testimonials
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://www.kitesurfpassion.fr/#organization",
    name: "KiteSurf Passion",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: averageRating,
      reviewCount: foilWakeboardTestimonials.length,
      bestRating: "5",
      worstRating: "1",
    },
    review: foilWakeboardTestimonials.map((t) => ({
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

  return (
    <>
      <Helmet>
        {/* Inject foil/wakeboard testimonials as Review structured data for Google */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className={`inline-block px-4 py-2 bg-${accentColor}/10 text-${accentColor} rounded-full text-sm font-medium mb-4`}>
            Avis Vérifiés
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
            {title}
          </h2>
          
          {/* Aggregate Rating */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <StarRating rating={parseFloat(averageRating)} size="md" />
              <span className="font-display text-xl font-bold text-foreground">{averageRating}/5</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="hidden sm:inline">•</span>
              <span>{filteredTestimonials.length} avis</span>
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-3xl mx-auto">
          <div className="relative min-h-[280px]">
            {filteredTestimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`transition-all duration-500 ${
                  index === activeIndex
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 absolute inset-0 translate-y-4 pointer-events-none"
                }`}
              >
                <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-lg border border-border/50 text-center">
                  {/* Quote Icon */}
                  <Quote className={`w-10 h-10 text-${accentColor}/20 mx-auto mb-4`} />

                  {/* Rating */}
                  <div className="flex justify-center mb-4">
                    <StarRating rating={testimonial.rating} size="md" />
                  </div>

                  {/* Text */}
                  <p className="text-foreground text-base sm:text-lg leading-relaxed mb-6">
                    "{testimonial.text}"
                  </p>

                  {/* Author */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <p className="font-display font-bold text-foreground">{testimonial.name}</p>
                      {testimonial.verified && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className={`text-${accentColor} text-sm font-medium`}>{testimonial.course}</p>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
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
          <div className="flex justify-center gap-2 mt-6">
            {filteredTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? `bg-${accentColor} w-6`
                    : `bg-${accentColor}/30 hover:bg-${accentColor}/50`
                }`}
                aria-label={`Voir l'avis ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* All Reviews Grid */}
        <div className="mt-12">
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {filteredTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-card rounded-xl p-5 border border-border/50 hover:border-primary/30 transition-colors"
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
      </div>
      </section>
    </>
  );
}
