import { useState, useEffect } from "react";
import { Wind, RefreshCw, MapPin } from "lucide-react";

interface SpotWidget {
  name: string;
  location: string;
  windfinderSpot: string;
}

const spots: SpotWidget[] = [
  {
    name: "Almanarre",
    location: "Hyères",
    windfinderSpot: "almanarre"
  },
  {
    name: "Presqu'île de Giens",
    location: "Giens",
    windfinderSpot: "la_madrague_de_giens"
  },
  {
    name: "Baie de Hyères",
    location: "Hyères",
    windfinderSpot: "hyeres"
  }
];

export function WeatherWidget() {
  const [activeSpot, setActiveSpot] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [key, setKey] = useState(0);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setKey((prev) => prev + 1);
      setLastUpdate(new Date());
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
    setLastUpdate(new Date());
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 mb-4">
            <Wind className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Météo en temps réel</span>
          </div>
          
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Conditions <span className="text-primary">Actuelles</span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            🌊 Consultez les conditions météo en temps réel sur nos spots favoris : 
            vent, température, vagues. Préparez votre session en un coup d'œil !
          </p>
        </div>

        {/* Spot Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {spots.map((spot, index) => (
            <button
              key={spot.name}
              onClick={() => setActiveSpot(index)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                ${activeSpot === index 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                  : "bg-card border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <MapPin className="w-4 h-4" />
              {spot.name}
            </button>
          ))}
        </div>

        {/* Widget Container */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-lg">
          {/* Widget Header */}
          <div className="bg-muted/50 px-4 py-3 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">
                {spots[activeSpot].name}
              </span>
              <span className="text-sm text-muted-foreground">
                — {spots[activeSpot].location}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Mis à jour : {formatTime(lastUpdate)}
              </span>
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-full hover:bg-muted transition-colors group"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>

          {/* Windfinder Widget */}
          <div className="relative w-full overflow-hidden" style={{ minHeight: "320px" }}>
            <iframe
              key={`${spots[activeSpot].windfinderSpot}-${key}`}
              src={`https://www.windfinder.com/widget/forecast/${spots[activeSpot].windfinderSpot}?unit_wave=m&unit_rain=mm&unit_temperature=c&unit_wind=kts&days=3&show_waves=1&show_rain=1&show_clouds=1`}
              className="w-full border-0"
              style={{ height: "320px" }}
              title={`Prévisions météo ${spots[activeSpot].name}`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>

          {/* Footer */}
          <div className="bg-muted/30 px-4 py-3 border-t border-border/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Données : Windfinder.com • Rafraîchissement auto toutes les 10 min
              </span>
              <a
                href={`https://www.windfinder.com/forecast/${spots[activeSpot].windfinderSpot}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Voir prévisions détaillées →
              </a>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Vent faible (0-12 nœuds)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Vent modéré (12-20 nœuds)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Vent idéal kite (20-30 nœuds)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Vent fort (30+ nœuds)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
