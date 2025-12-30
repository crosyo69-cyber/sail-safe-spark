import { useState, useEffect } from "react";
import { Wind, Thermometer, Waves, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface SpotWeather {
  name: string;
  windfinderSpot: string;
}

const spots: SpotWeather[] = [
  { name: "Almanarre", windfinderSpot: "almanarre" },
  { name: "Giens", windfinderSpot: "la_madrague_de_giens" },
  { name: "Hyères", windfinderSpot: "hyeres" }
];

export function WeatherWidgetCompact() {
  const [activeSpot, setActiveSpot] = useState(0);
  const [key, setKey] = useState(0);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setKey((prev) => prev + 1);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="bg-primary-foreground/5 rounded-xl border border-primary-foreground/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-primary-foreground/10">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-primary animate-pulse" />
          <span className="font-display font-semibold text-sm text-primary-foreground">
            Météo en Direct
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1 rounded-full hover:bg-primary-foreground/10 transition-colors"
          title="Actualiser"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary-foreground/60" />
        </button>
      </div>

      {/* Spot Tabs */}
      <div className="flex border-b border-primary-foreground/10">
        {spots.map((spot, index) => (
          <button
            key={spot.name}
            onClick={() => setActiveSpot(index)}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              activeSpot === index
                ? "bg-primary/20 text-primary border-b-2 border-primary"
                : "text-primary-foreground/60 hover:text-primary-foreground/80"
            }`}
          >
            {spot.name}
          </button>
        ))}
      </div>

      {/* Widget Iframe - Super Compact */}
      <div className="relative overflow-hidden" style={{ height: "140px" }}>
        <iframe
          key={`compact-${spots[activeSpot].windfinderSpot}-${key}`}
          src={`https://www.windfinder.com/widget/forecast/${spots[activeSpot].windfinderSpot}?unit_wave=m&unit_rain=mm&unit_temperature=c&unit_wind=kts&days=1&show_waves=0&show_rain=0&show_clouds=0`}
          className="w-full border-0"
          style={{ 
            height: "200px", 
            marginTop: "-30px",
            transform: "scale(0.9)",
            transformOrigin: "top center"
          }}
          title={`Météo ${spots[activeSpot].name}`}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      {/* Footer Link */}
      <div className="px-4 py-2 bg-primary-foreground/5 border-t border-primary-foreground/10">
        <Link
          to="/spot-kitesurf-almanarre-hyeres-var"
          className="text-xs text-primary hover:underline flex items-center justify-center gap-1"
        >
          Voir prévisions complètes →
        </Link>
      </div>
    </div>
  );
}
