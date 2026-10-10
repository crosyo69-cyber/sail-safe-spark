import { Loader2, RefreshCw, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ForecastState, TomorrowForecast } from "@/services/weather.service";

const STATE: Record<ForecastState, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  fresh: { label: "Prévisions à jour", variant: "default" },
  stale: { label: "Prévisions périmées", variant: "secondary" },
  incomplete: { label: "Données incomplètes", variant: "outline" },
  unavailable: { label: "Prévisions indisponibles", variant: "destructive" },
};
const DIRS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
const dir = (d: number | null) => (d === null ? "—" : DIRS[Math.round(d / 45) % 8]);
const kn = (v: number | null) => (v === null ? "—" : Math.round(v));
const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }) : "jamais";

interface Props {
  data?: TomorrowForecast;
  loading: boolean;
  error?: Error | null;
  refreshing: boolean;
  onRefresh: () => void;
}

/** Affichage informatif uniquement — aucune décision de cours. */
export function TomorrowForecastPanel({ data, loading, error, refreshing, onRefresh }: Props) {
  const s = data ? STATE[data.state] : null;
  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="font-heading font-bold flex items-center gap-2">
          <Wind className="w-5 h-5" aria-hidden /> Prévisions de demain — Almanarre
          {data && <span className="text-sm font-normal text-muted-foreground">({data.forecast_date})</span>}
        </h2>
        <Button variant="outline" size="sm" className="min-h-[44px]" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-2">Actualiser</span>
        </Button>
      </div>
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {error && !data && <p className="text-destructive text-sm">Prévisions indisponibles : {error.message}</p>}
      {data && s && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
            <Badge variant={s.variant}>{s.label}</Badge>
            <span className="text-muted-foreground">Dernière récupération : {fmtTime(data.fetched_at)}</span>
            {data.error && <span className="text-destructive">Erreur : {data.error}</span>}
            {data.issues.map((i) => <span key={i} className="text-muted-foreground">· {i}</span>)}
          </div>
          {data.hourly.length > 0 && (
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead><tr className="text-muted-foreground">
                  <th className="text-left pr-2">Heure</th>
                  {data.hourly.map((h) => <th key={h.time} className="px-1">{h.time.slice(11, 13)}h</th>)}
                </tr></thead>
                <tbody>
                  <tr><td className="pr-2">Vent (nds)</td>{data.hourly.map((h) => <td key={h.time} className="px-1 text-center">{kn(h.wind_kn)}</td>)}</tr>
                  <tr><td className="pr-2">Rafales</td>{data.hourly.map((h) => <td key={h.time} className="px-1 text-center">{kn(h.gust_kn)}</td>)}</tr>
                  <tr><td className="pr-2">Direction</td>{data.hourly.map((h) => <td key={h.time} className="px-1 text-center">{dir(h.direction_deg)}</td>)}</tr>
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">Source Open-Meteo. Information indicative : la décision de maintenir un cours reste la vôtre.</p>
        </>
      )}
    </Card>
  );
}
