import { useState, useEffect, useCallback } from "react";
import { X, Activity, Gauge, Eye, MousePointer, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricData {
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

interface MetricsState {
  LCP?: MetricData;
  CLS?: MetricData;
  INP?: MetricData;
  FCP?: MetricData;
  TTFB?: MetricData;
}

const thresholds = {
  CLS: { good: 0.1, needsImprovement: 0.25, unit: "", format: (v: number) => v.toFixed(3) },
  FCP: { good: 1800, needsImprovement: 3000, unit: "ms", format: (v: number) => `${Math.round(v)}` },
  INP: { good: 200, needsImprovement: 500, unit: "ms", format: (v: number) => `${Math.round(v)}` },
  LCP: { good: 2500, needsImprovement: 4000, unit: "ms", format: (v: number) => `${Math.round(v)}` },
  TTFB: { good: 800, needsImprovement: 1800, unit: "ms", format: (v: number) => `${Math.round(v)}` },
};

const metricInfo = {
  LCP: { name: "Largest Contentful Paint", icon: Eye, description: "Temps de chargement du plus grand élément" },
  CLS: { name: "Cumulative Layout Shift", icon: Activity, description: "Stabilité visuelle de la page" },
  INP: { name: "Interaction to Next Paint", icon: MousePointer, description: "Réactivité aux interactions" },
  FCP: { name: "First Contentful Paint", icon: Gauge, description: "Premier affichage de contenu" },
  TTFB: { name: "Time to First Byte", icon: Clock, description: "Temps de réponse du serveur" },
};

const ratingColors = {
  good: "bg-emerald-500",
  "needs-improvement": "bg-amber-500",
  poor: "bg-red-500",
};

const ratingBgColors = {
  good: "bg-emerald-500/10 border-emerald-500/30",
  "needs-improvement": "bg-amber-500/10 border-amber-500/30",
  poor: "bg-red-500/10 border-red-500/30",
};

const ratingTextColors = {
  good: "text-emerald-600",
  "needs-improvement": "text-amber-600",
  poor: "text-red-600",
};

export function WebVitalsDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [metrics, setMetrics] = useState<MetricsState>({});

  // Poll sessionStorage for metric updates
  const updateMetrics = useCallback(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("cwv-metrics");
    if (stored) {
      try {
        setMetrics(JSON.parse(stored));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    // Initial load
    updateMetrics();

    // Poll every second for updates
    const interval = setInterval(updateMetrics, 1000);

    // Also listen to storage events
    const handleStorage = () => updateMetrics();
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, [updateMetrics]);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const metricsOrder: (keyof typeof metricInfo)[] = ["LCP", "CLS", "INP", "FCP", "TTFB"];
  const coreMetrics = ["LCP", "CLS", "INP"];
  const hasMetrics = Object.keys(metrics).length > 0;

  // Calculate overall score
  const coreMetricsData = coreMetrics.map((m) => metrics[m as keyof MetricsState]);
  const allCoreGood = coreMetricsData.every((m) => m?.rating === "good");
  const anyCoreIssue = coreMetricsData.some((m) => m?.rating === "needs-improvement");
  const anyCorePoor = coreMetricsData.some((m) => m?.rating === "poor");

  const overallStatus = anyCorePoor ? "poor" : anyCoreIssue ? "needs-improvement" : allCoreGood ? "good" : null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all",
          "bg-background/95 backdrop-blur-sm border border-border hover:shadow-xl",
          "text-sm font-medium"
        )}
        title="Ouvrir le tableau de bord Core Web Vitals"
      >
        <Activity className="w-4 h-4 text-primary" />
        <span className="hidden sm:inline">CWV</span>
        {overallStatus && (
          <span className={cn("w-2.5 h-2.5 rounded-full", ratingColors[overallStatus])} />
        )}
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-2">
        <div className="flex items-center gap-2">
          {metricsOrder.map((key) => {
            const metric = metrics[key];
            if (!metric) return null;
            return (
              <div
                key={key}
                className={cn("w-3 h-3 rounded-full", ratingColors[metric.rating])}
                title={`${key}: ${thresholds[key].format(metric.value)}${thresholds[key].unit}`}
              />
            );
          })}
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-muted rounded"
            title="Agrandir"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted rounded"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Core Web Vitals</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Réduire"
          >
            <div className="w-4 h-0.5 bg-current rounded" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {!hasMetrics ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
            <p>En attente des métriques...</p>
            <p className="text-xs mt-1">Naviguez sur le site pour déclencher les mesures</p>
          </div>
        ) : (
          <>
            {/* Core Metrics (highlighted) */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Métriques Core (Google)
              </p>
              {coreMetrics.map((key) => {
                const metric = metrics[key as keyof MetricsState];
                const info = metricInfo[key as keyof typeof metricInfo];
                const threshold = thresholds[key as keyof typeof thresholds];
                const Icon = info.icon;

                return (
                  <div
                    key={key}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      metric ? ratingBgColors[metric.rating] : "bg-muted/30 border-border"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{key}</span>
                      </div>
                      {metric ? (
                        <span className={cn("font-mono font-bold", ratingTextColors[metric.rating])}>
                          {threshold.format(metric.value)}{threshold.unit}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                    {metric && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full transition-all", ratingColors[metric.rating])}
                            style={{
                              width: `${Math.min(100, (metric.value / threshold.needsImprovement) * 50)}%`,
                            }}
                          />
                        </div>
                        <span className={cn("text-xs font-medium capitalize", ratingTextColors[metric.rating])}>
                          {metric.rating === "good" ? "Bon" : metric.rating === "needs-improvement" ? "Moyen" : "Mauvais"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Secondary Metrics */}
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Métriques secondaires
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["FCP", "TTFB"].map((key) => {
                  const metric = metrics[key as keyof MetricsState];
                  const threshold = thresholds[key as keyof typeof thresholds];
                  const info = metricInfo[key as keyof typeof metricInfo];
                  const Icon = info.icon;

                  return (
                    <div
                      key={key}
                      className={cn(
                        "p-2 rounded-lg border",
                        metric ? ratingBgColors[metric.rating] : "bg-muted/30 border-border"
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium text-xs">{key}</span>
                      </div>
                      {metric ? (
                        <span className={cn("font-mono font-bold text-sm", ratingTextColors[metric.rating])}>
                          {threshold.format(metric.value)}{threshold.unit}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Bon</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">Moyen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-muted-foreground">Mauvais</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Dev only • <a href="https://web.dev/vitals/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">En savoir plus</a>
        </p>
      </div>
    </div>
  );
}
