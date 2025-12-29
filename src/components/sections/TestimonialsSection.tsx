import { Star, Quote } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
  {
    id: 1,
    name: "Marie L.",
    rating: 5,
    date: "Septembre 2024",
    text: "Super expérience avec Yohan ! Très pédagogue et patient. Le bateau d'assistance est vraiment rassurant pour les débutants. J'ai appris les bases en 5 séances. Je recommande à 100% !",
  },
  {
    id: 2,
    name: "Thomas D.",
    rating: 5,
    date: "Août 2024",
    text: "Meilleure école de kite du Var ! Le spot de l'Almanarre est parfait et l'équipe est au top. En 5 jours, j'étais autonome. Merci pour cette super semaine !",
  },
  {
    id: 3,
    name: "Sophie M.",
    rating: 5,
    date: "Juillet 2024",
    text: "J'ai testé le wingfoil et c'est une révélation ! Yohan explique tout clairement et on progresse vite. L'école itinérante permet de toujours avoir les meilleures conditions.",
  },
  {
    id: 4,
    name: "Pierre R.",
    rating: 5,
    date: "Juin 2024",
    text: "École familiale, ambiance détendue mais professionnelle. Le bateau d'assistance change tout pour la progression. Spot magnifique avec une eau turquoise incroyable.",
  },
  {
    id: 5,
    name: "Julie B.",
    rating: 5,
    date: "Mai 2024",
    text: "Stage kitesurf offert en cadeau, et quelle découverte ! Yohan et son équipe sont passionnés et ça se ressent. Vivement l'été prochain pour continuer !",
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-gradient-to-b from-secondary/30 to-background">
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
          <div className="flex items-center justify-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-sunset fill-sunset" />
            ))}
            <span className="ml-2 text-foreground font-bold text-lg">4.9/5</span>
            <span className="text-muted-foreground">sur Google</span>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`transition-all duration-500 ${
                  index === activeIndex
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 absolute inset-0 translate-y-4"
                }`}
              >
                <div className="bg-card rounded-3xl p-8 sm:p-12 shadow-lg border border-border/50 text-center">
                  {/* Quote Icon */}
                  <Quote className="w-12 h-12 text-primary/20 mx-auto mb-6" />

                  {/* Rating */}
                  <div className="flex justify-center gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-sunset fill-sunset" />
                    ))}
                  </div>

                  {/* Text */}
                  <p className="text-foreground text-lg sm:text-xl leading-relaxed mb-8">
                    "{testimonial.text}"
                  </p>

                  {/* Author */}
                  <div>
                    <p className="font-display font-bold text-foreground">{testimonial.name}</p>
                    <p className="text-muted-foreground text-sm">{testimonial.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "bg-primary w-8"
                    : "bg-primary/30 hover:bg-primary/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
