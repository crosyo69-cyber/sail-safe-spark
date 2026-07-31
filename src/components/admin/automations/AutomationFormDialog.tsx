import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { TOPIC_OPTIONS } from "@/components/admin/segment-types";
import {
  TRIGGER_OPTIONS, type Automation, type AutomationTrigger, type SegmentRow,
} from "@/features/admin-automations/types";

interface Props {
  editing: Partial<Automation> | null;
  onEditingChange: (a: Partial<Automation> | null) => void;
  segments: SegmentRow[];
  saving: boolean;
  onSave: () => void;
}

export const AutomationFormDialog = ({
  editing, onEditingChange, segments, saving, onSave,
}: Props) => {
  const triggerMeta = TRIGGER_OPTIONS.find((t) => t.value === (editing?.trigger_type ?? "credit_expiring"));

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && onEditingChange(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing?.id ? "Modifier l'automatisation" : "Nouvelle automatisation"}</DialogTitle>
          <DialogDescription>
            Le consentement et les préférences marketing sont toujours vérifiés avant chaque envoi.
          </DialogDescription>
        </DialogHeader>

        {editing && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="auto-name">Nom</Label>
              <Input id="auto-name" value={editing.name ?? ""}
                onChange={(e) => onEditingChange({ ...editing, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auto-desc">Description</Label>
              <Input id="auto-desc" value={editing.description ?? ""}
                onChange={(e) => onEditingChange({ ...editing, description: e.target.value })} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Déclencheur</Label>
                <Select value={editing.trigger_type ?? "credit_expiring"}
                  onValueChange={(v) => {
                    const meta = TRIGGER_OPTIONS.find((t) => t.value === v);
                    onEditingChange({
                      ...editing, trigger_type: v as AutomationTrigger,
                      trigger_config: { days: meta?.defaultDays ?? 0 },
                    });
                  }}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{triggerMeta?.help}</p>
              </div>
              {triggerMeta?.daysLabel && (
                <div className="grid gap-2">
                  <Label htmlFor="auto-days">{triggerMeta.daysLabel}</Label>
                  <Input id="auto-days" type="number" min={0}
                    value={String(editing.trigger_config?.days ?? triggerMeta.defaultDays ?? 0)}
                    onChange={(e) => onEditingChange({ ...editing, trigger_config: { ...(editing.trigger_config ?? {}), days: Number(e.target.value) } })} />
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Segment enregistré</Label>
                <Select value={editing.segment_id ?? "none"}
                  onValueChange={(v) => onEditingChange({ ...editing, segment_id: v === "none" ? null : v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tous les opt-in</SelectItem>
                    {segments.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Préférence requise</Label>
                <Select value={editing.required_topic ?? "none"}
                  onValueChange={(v) => onEditingChange({ ...editing, required_topic: v === "none" ? null : v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {TOPIC_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="auto-subject">Objet de l'email</Label>
              <Input id="auto-subject" value={editing.email_subject ?? ""}
                onChange={(e) => onEditingChange({ ...editing, email_subject: e.target.value })}
                placeholder="Vos crédits expirent bientôt, {{prenom}}" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auto-html">Contenu HTML</Label>
              <Textarea id="auto-html" rows={7} value={editing.email_html ?? ""}
                onChange={(e) => onEditingChange({ ...editing, email_html: e.target.value })}
                placeholder="<p>Bonjour {{prenom}}, il vous reste {{credits}} séance(s) jusqu'au {{expiration}}.</p>" />
              <p className="text-xs text-muted-foreground">
                Variables : {"{{prenom}} {{nom}} {{email}} {{credits}} {{expiration}} {{derniere_seance}} {{niveau}}"}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="auto-cta">Libellé du bouton</Label>
                <Input id="auto-cta" value={editing.email_cta_label ?? ""}
                  onChange={(e) => onEditingChange({ ...editing, email_cta_label: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auto-cta-url">Lien du bouton</Label>
                <Input id="auto-cta-url" value={editing.email_cta_url ?? ""}
                  onChange={(e) => onEditingChange({ ...editing, email_cta_url: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="auto-delay">Délai (j)</Label>
                <Input id="auto-delay" type="number" min={0} value={String(editing.delay_days ?? 0)}
                  onChange={(e) => onEditingChange({ ...editing, delay_days: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auto-prio">Priorité</Label>
                <Input id="auto-prio" type="number" min={1} value={String(editing.priority ?? 100)}
                  onChange={(e) => onEditingChange({ ...editing, priority: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auto-dedupe">Anti-doublon (j)</Label>
                <Input id="auto-dedupe" type="number" min={0} value={String(editing.dedupe_window_days ?? 30)}
                  onChange={(e) => onEditingChange({ ...editing, dedupe_window_days: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auto-max">Max dest.</Label>
                <Input id="auto-max" type="number" min={1} value={String(editing.max_recipients ?? 500)}
                  onChange={(e) => onEditingChange({ ...editing, max_recipients: Number(e.target.value) })} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={editing.active ?? false}
                onCheckedChange={(v) => onEditingChange({ ...editing, active: v })} id="auto-active" />
              <Label htmlFor="auto-active">Automatisation active (exécutée par le planificateur quotidien)</Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="min-h-[44px]" onClick={() => onEditingChange(null)}>Annuler</Button>
          <Button className="min-h-[44px]" onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
