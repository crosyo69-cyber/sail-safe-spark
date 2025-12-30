import { useState, useEffect, useRef } from "react";
import { Wind, RefreshCw, MapPin, ExternalLink } from "lucide-react";

interface SpotWidget {
  name: string;
  location: string;
  windguruSpotId: number;
}

const spots: SpotWidget[] = [
  {
    name: "Almanarre",
    location: "Hyères",
    windguruSpotId: 14
  },
  {
    name: "Presqu'île de Giens",
    location: "Giens",
    windguruSpotId: 16277
  },
  {
    name: "Port d'Hyères",
    location: "Hyères",
    windguruSpotId: 300552
  }
];

export function WindguruWidget() {
  const [activeSpot, setActiveSpot] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [key, setKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setKey((prev) => prev + 1);
      setLastUpdate(new Date());
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Load Windguru widget script
  useEffect(() => {
    const spotId = spots[activeSpot].windguruSpotId;
    const uid = `wg_fwdg_${spotId}_${key}`;
    
    // Clean up previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Create widget container
    const widgetDiv = document.createElement('div');
    widgetDiv.id = uid;
    if (containerRef.current) {
      containerRef.current.appendChild(widgetDiv);
    }

    // Load Windguru script
    const script = document.createElement('script');
    const params = [
      `s=${spotId}`,
      `m=100`,
      `uid=${uid}`,
      `wj=knots`,
      `tj=c`,
      `waj=m`,
      `odession=en`,
      `hession=en`,
      `dession=en`,
      `fession=en`,
      `color=ffffff`,
      `p=WINDSPD,GUST,SMER,TMP,TCDC,APCP1s,RATING`
    ];
    script.src = `https://www.windguru.cz/js/widget.php?${params.join('&')}`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup script
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [activeSpot, key]);

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
            Consultez les prévisions Windguru en temps réel sur nos spots favoris : 
            vent, rafales, température. Préparez votre session en un coup d'œil !
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

          {/* Windguru Widget */}
          <div 
            ref={containerRef}
            className="relative w-full overflow-x-auto p-4 min-h-[300px] bg-white"
            style={{ minHeight: "300px" }}
          />

          {/* Footer */}
          <div className="bg-muted/30 px-4 py-3 border-t border-border/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Données : Windguru.cz • Rafraîchissement auto toutes les 30 min
              </span>
              <a
                href={`https://www.windguru.cz/${spots[activeSpot].windguruSpotId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Voir prévisions détaillées
                <ExternalLink className="w-3 h-3" />
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
