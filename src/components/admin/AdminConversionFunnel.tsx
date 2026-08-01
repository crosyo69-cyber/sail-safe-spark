import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Radio } from "lucide-react";
import { RANGES } from "@/features/admin-conversion-funnel/types";
import { useAdminConversionFunnel } from "@/hooks/admin/useAdminConversionFunnel";
import { FunnelStatCards } from "./conversion-funnel/FunnelStatCards";
import { FunnelTable } from "./conversion-funnel/FunnelTable";
import { TopPagesCard } from "./conversion-funnel/TopPagesCard";
import { LiveEventsPanel } from "./conversion-funnel/LiveEventsPanel";

export default function AdminConversionFunnel() {
  const {
    range,
    setRange,
    loading,
    error,
    stats,
    debug,
    setDebug,
    realtimeStatus,
    liveEvents,
    clearLiveEvents,
    filteredEvents,
    filters,
    importState,
  } = useAdminConversionFunnel();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground">
            Tunnel de conversion
          </h2>
          <p className="text-sm text-muted-foreground">
            Visiteurs uniques, clics téléphone et soumissions formulaire
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch
              id="conversion-debug-toggle"
              checked={debug}
              onCheckedChange={setDebug}
            />
            <Label htmlFor="conversion-debug-toggle" className="text-sm flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              Mode debug temps réel
            </Label>
          </div>
          <div className="flex gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              size="sm"
              variant={range === r.key ? "default" : "outline"}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
          </div>
        </div>
      </div>

      {debug && (
        <LiveEventsPanel
          realtimeStatus={realtimeStatus}
          liveEvents={liveEvents}
          filteredEvents={filteredEvents}
          clearLiveEvents={clearLiveEvents}
          filters={filters}
          importState={importState}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Erreur de chargement : {error}
          </CardContent>
        </Card>
      ) : (
        <>
          <FunnelStatCards stats={stats} />
          <FunnelTable stats={stats} />
          <TopPagesCard stats={stats} />
        </>
      )}
    </div>
  );
}