import { MapPin, Navigation, Anchor } from "lucide-react";

const meetingPoints = [
  {
    name: "Port de Carqueiranne",
    address: "Port de Carqueiranne, 83320 Carqueiranne",
    description: "Point de départ principal pour les activités tractées et les déposes en mer.",
    coordinates: { lat: 43.0817, lng: 6.1366 },
    icon: Anchor,
  },
  {
    name: "Port d'Hyères - Quai Milou Conio",
    address: "Quai Milou Conio, 83400 Hyères",
    description: "Rendez-vous pour les stages kitesurf et wingfoil sur l'Almanarre.",
    coordinates: { lat: 43.0779, lng: 6.1508 },
    icon: Navigation,
  },
];

export function MeetingPointsSection() {
  return (
    <section 
      className="py-16 bg-muted/30"
      style={{ contain: 'layout style' }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
              <MapPin className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Points de <span className="text-primary">Rendez-vous</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Retrouvez-nous directement sur l'un de nos points de départ. Pensez à arriver 15 minutes avant le début de votre cours.
            </p>
          </div>

          {/* Meeting Points Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {meetingPoints.map((point, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary/20 to-turquoise/20 rounded-xl flex items-center justify-center">
                    <point.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg text-foreground mb-1">
                      {point.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {point.address}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {point.description}
                    </p>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${point.coordinates.lat},${point.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm font-medium mt-3 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      Itinéraire
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Google Maps Embed - Optimized with explicit dimensions */}
          <div 
            className="rounded-2xl overflow-hidden border border-border/50 shadow-lg"
            style={{ aspectRatio: '16 / 9', minHeight: '350px' }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d23434.145234567!2d6.13!3d43.08!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m3!3e0!4m0!4m0!5e0!3m2!1sfr!2sfr!4v1699000000000!5m2!1sfr!2sfr&markers=color:red%7C43.0817,6.1366&markers=color:blue%7C43.0779,6.1508"
              width="100%"
              height="350"
              style={{ border: 0, width: '100%', height: '100%' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Points de rendez-vous kitesurf Hyères Carqueiranne"
              aria-label="Carte des points de rendez-vous kitesurf Hyères Carqueiranne"
            />
          </div>
          
          <p className="text-center text-muted-foreground text-sm mt-4">
            📍 <strong>Port de Carqueiranne</strong> (rouge) — <strong>Port d'Hyères, Quai Milou Conio</strong> (bleu)
          </p>
        </div>
      </div>
    </section>
  );
}
