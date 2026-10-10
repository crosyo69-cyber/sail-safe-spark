import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  formatKnots, WEATHER_RULE_LABEL, type WeatherRule, type WeatherRuleDraft,
} from "@/features/weather-rules/types";

interface Props {
  rule: WeatherRule;
  draft: WeatherRuleDraft | null; // non nul si cette carte est en édition
  errors: string[];
  disabled: boolean;
  onEdit: () => void;
  onChange: (d: WeatherRuleDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" });

export function WeatherRuleCard({ rule, draft, errors, disabled, onEdit, onChange, onCancel, onSave }: Props) {
  const id = (f: string) => `${rule.activity}-${f}`;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="font-heading font-bold text-lg">{WEATHER_RULE_LABEL[rule.activity]}</h2>
        <Badge variant={rule.enabled ? "default" : "secondary"}>{rule.enabled ? "Activée" : "Désactivée"}</Badge>
      </div>

      {!draft ? (
        <>
          <dl className="grid grid-cols-2 gap-y-1 text-sm mb-3">
            <dt className="text-muted-foreground">Vent moyen minimum</dt><dd>{formatKnots(rule.min_wind_kn)}</dd>
            <dt className="text-muted-foreground">Vent moyen maximum</dt><dd>{formatKnots(rule.max_wind_kn)}</dd>
            <dt className="text-muted-foreground">Rafales maximum</dt><dd>{formatKnots(rule.max_gust_kn)}</dd>
          </dl>
          <p className="text-xs text-muted-foreground mb-3">
            Modifié le {fmtDate(rule.updated_at)} par {rule.updated_by_email ?? "configuration initiale"} — « {rule.change_reason} »
          </p>
          <Button variant="outline" className="min-h-[44px]" onClick={onEdit} disabled={disabled}>Modifier</Button>
        </>
      ) : (
        <div className="space-y-3">
          {([
            ["min_wind_kn", "Vent moyen minimum (nds)", true],
            ["max_wind_kn", "Vent moyen maximum (nds)", true],
            ["max_gust_kn", "Rafales maximum (nds)", false],
          ] as const).map(([field, label, optional]) => (
            <div key={field}>
              <Label htmlFor={id(field)}>{label}</Label>
              <Input
                id={id(field)} inputMode="decimal" className="min-h-[44px]"
                placeholder={optional ? "Vide = non applicable" : ""}
                value={draft[field]}
                onChange={(e) => onChange({ ...draft, [field]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <Switch id={id("enabled")} checked={draft.enabled} onCheckedChange={(v) => onChange({ ...draft, enabled: v })} />
            <Label htmlFor={id("enabled")}>Règle activée</Label>
          </div>
          <div>
            <Label htmlFor={id("reason")}>Motif de la modification (obligatoire)</Label>
            <Textarea id={id("reason")} value={draft.reason} onChange={(e) => onChange({ ...draft, reason: e.target.value })} />
          </div>
          {errors.length > 0 && (
            <ul role="alert" className="text-sm text-destructive list-disc pl-5">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
          <div className="flex gap-2">
            <Button className="min-h-[44px]" onClick={onSave} disabled={disabled}>Enregistrer</Button>
            <Button variant="ghost" className="min-h-[44px]" onClick={onCancel} disabled={disabled}>Annuler</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
