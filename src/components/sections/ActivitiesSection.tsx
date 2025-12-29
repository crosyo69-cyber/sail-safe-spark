import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import kitesurfImage from "@/assets/kitesurf-lesson.jpg";
import wingfoilImage from "@/assets/wingfoil.jpg";
import pumpfoilImage from "@/assets/pumpfoil.jpg";
import downwindImage from "@/assets/downwind.jpg";

const activities = [
  {
    id: "kitesurf",
    title: "Cours de Kitesurf",
    description: "Du débutant à l'expert. Stage 5 jours = autonomie garantie sur le spot de l'Almanarre.",
    price: "À partir de 399€",
    image: kitesurfImage,
    link: "/cours-kitesurf-hyeres-debutant",
    featured: true,
  },
  {
    id: "wingfoil",
    title: "Stage Wing Foil",
    description: "Sport tendance 2024. Plus accessible que le kite, sensations pures de vol sur l'eau.",
    price: "À partir de 90€",
    image: wingfoilImage,
    link: "/stage-wingfoil-hyeres-almanarre",
    featured: false,
  },
  {
    id: "pumpfoil",
    title: "Initiation Pump Foil",
    description: "Sans vent, sans vagues. Dock start et progression rapide pour voler sur l'eau.",
    price: "50€",
    image: pumpfoilImage,
    link: "/cours-pumpfoil-dock-start-hyeres",
    featured: false,
  },
  {
    id: "downwind",
    title: "Aventure Downwind Foil",
    description: "Parcourez 10-20km de l'Almanarre à Porquerolles. Expérience unique pour riders confirmés.",
    price: "Sur devis",
    image: downwindImage,
    link: "/contact-reservation-kitesurf-hyeres",
    featured: false,
  },
];

export function ActivitiesSection() {
  return (
    <section id="activites" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary font-semibold mb-4">Nos activités</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Nos Activités de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-sunset-light">
              Glisse
            </span>{" "}
            à Hyères
          </h2>
          <p className="text-muted-foreground text-lg">
            Kitesurf, wingfoil ou pumpfoil : trouvez l'activité qui vous correspond et vivez des sensations uniques sur la Méditerranée.
          </p>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {activities.map((activity, index) => (
            <Link
              key={activity.id}
              to={activity.link}
              className={`group relative rounded-3xl overflow-hidden ${
                activity.featured ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="aspect-[4/3] relative">
                {/* Image */}
                <img
                  src={activity.image}
                  alt={`${activity.title} à Hyères - KiteSurf Passion`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                  {/* Price Badge */}
                  <div className="absolute top-6 right-6 bg-sunset text-accent-foreground px-4 py-2 rounded-full font-bold text-sm">
                    {activity.price}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground mb-3">
                    {activity.title}
                  </h3>
                  <p className="text-primary-foreground/80 mb-4 max-w-md">
                    {activity.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-sunset font-semibold group-hover:gap-4 transition-all duration-300">
                    <span>En savoir plus</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
