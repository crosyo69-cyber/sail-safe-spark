import { Badge } from "@/components/ui/badge";
import { WEATHER_RULE_ACTIVITIES, WEATHER_RULE_LABEL, type WeatherRule } from "@/features/weather-rules/types";
import { evaluateHourThresholds } from "@/features/weather-rules/hourly-thresholds";
import type { TomorrowForecast } from "@/services/weather.service";

export function HourlyThresholdTable({ data, rules }: { data: TomorrowForecast; rules: WeatherRule[] }) {
  return (
    <div className="overflow-auto max-h-[480px] mt-4 border border-border rounded-md" tabIndex={0} role="region" aria-label="Seuils météo par heure et activité">
      <table className="w-full text-sm">
        <caption className="text-left p-3 font-medium">Comparaison horaire — seuils inclusifs, heures de Paris</caption>
        <thead className="sticky top-0 bg-background">
          <tr className="border-b border-border">
            <th scope="col" className="p-3 text-left">Heure</th>
            {WEATHER_RULE_ACTIVITIES.map((a) => <th scope="col" key={a} className="p-3 text-left">{WEATHER_RULE_LABEL[a]}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.hourly.map((hour, index) => (
            <tr key={`${hour.time}-${index}`} className="border-b border-border last:border-0">
              <th scope="row" className="p-3 text-left whitespace-nowrap align-top">{hour.time.slice(11, 16)}</th>
              {WEATHER_RULE_ACTIVITIES.map((a) => {
                const status = evaluateHourThresholds(hour, data.state, rules.find((rule) => rule.activity === a));
                return (
                  <td key={a} className="p-3 align-top min-w-[170px]">
                    <Badge variant={status.kind === "outside" ? "destructive" : status.kind === "within" ? "default" : "outline"}>{status.label}</Badge>
                    {status.reasons.map((reason) => <p key={reason} className="text-xs text-muted-foreground mt-1">{reason}</p>)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}