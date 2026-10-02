import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { marketingService } from "@/services/marketing.service";
import { settle } from "@/services/_shared/result";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw, Download, Trash2, Users } from "lucide-react";
import {
  ACTIVITY_OPTIONS, CREDIT_OPTIONS, EMPTY_SEGMENT, LEVEL_OPTIONS, LIFECYCLE_OPTIONS,
  SegmentDefinition, SegmentEstimate, TOPIC_OPTIONS, segmentSummary,
} from "./segment-types";

type SavedSegment = {
  id: string;
  name: string;
  description: string | null;
  definition: SegmentDefinition;
  created_at: string;
};

const numOrNull = (v: string): number | null => (v.trim() === "" ? null : Number(v));

const CheckGroup = ({
  title, options, values, onChange,
}: {
  title: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (next: string[]) => void;
}) => (
  <div className="space-y-2">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <div className="flex flex-wrap gap-3">
      {options.map((o) => (
        <label key={o.value} className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <Checkbox
            checked={values.includes(o.value)}
            onCheckedChange={() =>
              onChange(values.includes(o.value) ? values.filter((v) => v !== o.value) : [...values, o.value])
            }
          />
          {o.label}
        </label>
      ))}
    </div>
  </div>
);

const SegmentBuilder = () => {
  const [def, setDef] = useState<SegmentDefinition>(EMPTY_SEGMENT);
  const [estimate, setEstimate] = useState<SegmentEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [segments, setSegments] = useState<SavedSegment[]>([]);

  const patch = useCallback((p: Partial<SegmentDefinition>) => setDef((d) => ({ ...d, ...p })), []);

  const loadSegments = useCallback(async () => {
    const { data, error } = settle(await marketingService.listSegmentsDetailed<SavedSegment>());
    if (error) { toast.error("Segments illisibles", { description: error.message }); return; }
    setSegments((data ?? []).map((s) => ({
      ...s,
      definition: { ...EMPTY_SEGMENT, ...((s.definition ?? {}) as Partial<SegmentDefinition>) },
    })));
  }, []);

  useEffect(() => { void loadSegments(); }, [loadSegments]);

  const defKey = useMemo(() => JSON.stringify(def), [def]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setEstimating(true);
      const { data, error } = settle(
        await marketingService.segmentEstimate({ p_definition: JSON.parse(defKey) }),
      );
      if (cancelled) return;
      setEstimating(false);
      if (error) { toast.error("Estimation impossible", { description: error.message }); return; }
      setEstimate(data as unknown as SegmentEstimate);
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [defKey]);

  const save = async () => {
    if (!name.trim()) { toast.error("Nom du segment requis"); return; }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = settle(
      await marketingService.createSegment({
        name: name.trim(),
        description: description.trim() || null,
        definition: def as unknown as never,
        created_by: userData.user?.id ?? null,
        created_by_email: userData.user?.email ?? null,
      }),
    );
    setSaving(false);
    if (error) { toast.error("Enregistrement impossible", { description: error.message }); return; }
    toast.success("Segment enregistré");
    setName(""); setDescription("");
    void loadSegments();
  };

  const remove = async (id: string) => {
    const { error } = settle(await marketingService.deleteSegment(id));
    if (error) { toast.error("Suppression impossible", { description: error.message }); return; }
    toast.success("Segment supprimé");
    void loadSegments();
  };

  const exportCsv = async () => {
    const { data, error } = settle(
      await marketingService.getSegment({ p_definition: def as unknown as never }),
    );
    if (error) { toast.error("Export impossible", { description: error.message }); return; }
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const headers = ["email", "first_name", "last_name", "phone", "activities", "level", "lifecycle", "last_date", "credits_remaining", "revenue", "consent"];
    const csv = [
      headers.join(";"),
      ...rows.map((r) => headers.map((h) => {
        const v = r[h];
        return Array.isArray(v) ? v.join("|") : v === null || v === undefined ? "" : String(v);
      }).join(";")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "segment.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Constructeur de segment</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <CheckGroup title="Activités" options={ACTIVITY_OPTIONS} values={def.activities} onChange={(v) => patch({ activities: v })} />
            <Separator />
            <CheckGroup title="Préférences marketing" options={TOPIC_OPTIONS} values={def.topics} onChange={(v) => patch({ topics: v })} />
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Consentement</Label>
                <Select value={def.consent} onValueChange={(v) => patch({ consent: v as SegmentDefinition["consent"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Oui (marketing)</SelectItem>
                    <SelectItem value="no">Non</SelectItem>
                    <SelectItem value="all">Tous (usage CRM interne)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <CheckGroup title="Niveau" options={LEVEL_OPTIONS} values={def.levels} onChange={(v) => patch({ levels: v })} />
            <Separator />
            <CheckGroup title="Client" options={LIFECYCLE_OPTIONS} values={def.lifecycle} onChange={(v) => patch({ lifecycle: v })} />
            <Separator />
            <CheckGroup title="Crédits" options={CREDIT_OPTIONS} values={def.credits} onChange={(v) => patch({ credits: v })} />
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Réservations</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Dernière réservation après</Label>
                  <Input type="date" value={def.last_booking_after ?? ""} onChange={(e) => patch({ last_booking_after: e.target.value || null })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dernière réservation avant</Label>
                  <Input type="date" value={def.last_booking_before ?? ""} onChange={(e) => patch({ last_booking_before: e.target.value || null })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Jamais réservé depuis X mois</Label>
                  <Input type="number" min={0} value={def.not_booked_since_months ?? ""} onChange={(e) => patch({ not_booked_since_months: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nombre total min.</Label>
                  <Input type="number" min={0} value={def.min_bookings ?? ""} onChange={(e) => patch({ min_bookings: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nombre total max.</Label>
                  <Input type="number" min={0} value={def.max_bookings ?? ""} onChange={(e) => patch({ max_bookings: numOrNull(e.target.value) })} />
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Dépenses</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">CA total min. (€)</Label>
                  <Input type="number" min={0} value={def.min_revenue ?? ""} onChange={(e) => patch({ min_revenue: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CA total max. (€)</Label>
                  <Input type="number" min={0} value={def.max_revenue ?? ""} onChange={(e) => patch({ max_revenue: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Panier moyen min. (€)</Label>
                  <Input type="number" min={0} value={def.min_avg_basket ?? ""} onChange={(e) => patch({ min_avg_basket: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nombre de packs min.</Label>
                  <Input type="number" min={0} value={def.min_packages ?? ""} onChange={(e) => patch({ min_packages: numOrNull(e.target.value) })} />
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Localisation</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Départements (ex : 83, 06)</Label>
                  <Input
                    value={def.departments.join(", ")}
                    placeholder="83, 06"
                    onChange={(e) => patch({ departments: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pays (ex : FR, BE)</Label>
                  <Input
                    value={def.countries.join(", ")}
                    placeholder="FR"
                    onChange={(e) => patch({ countries: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Distance max. de Hyères (km)</Label>
                  <Input type="number" min={0} value={def.max_distance_km ?? ""} onChange={(e) => patch({ max_distance_km: numOrNull(e.target.value) })} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDef(EMPTY_SEGMENT)}>
                <RotateCcw className="mr-2 h-4 w-4" />Réinitialiser
              </Button>
              <Button variant="outline" size="sm" onClick={() => void exportCsv()}>
                <Download className="mr-2 h-4 w-4" />Exporter CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Prévisualisation (20 premiers)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Activité</TableHead>
                    <TableHead>Dernière réservation</TableHead>
                    <TableHead>Consentement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(estimate?.preview ?? []).length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Aucun client pour ce segment.</TableCell></TableRow>
                  ) : (
                    (estimate?.preview ?? []).map((p) => (
                      <TableRow key={p.email}>
                        <TableCell className="font-medium">{[p.first_name, p.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                        <TableCell className="text-sm">{p.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{(p.activities ?? []).join(", ") || "—"}</TableCell>
                        <TableCell className="text-sm">{p.last_date ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={p.consent ? "default" : "secondary"}>{p.consent ? "Oui" : "Non"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />Estimation
              {estimating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div><p className="text-2xl font-bold text-foreground">{estimate?.clients ?? 0}</p><p className="text-xs text-muted-foreground">Clients</p></div>
            <div><p className="text-2xl font-bold text-foreground">{estimate?.emails ?? 0}</p><p className="text-xs text-muted-foreground">Emails</p></div>
            <div><p className="text-2xl font-bold text-foreground">{estimate?.sms ?? 0}</p><p className="text-xs text-muted-foreground">SMS (à venir)</p></div>
            <div><p className="text-2xl font-bold text-foreground">{estimate?.percent ?? 0} %</p><p className="text-xs text-muted-foreground">de la base ({estimate?.total_base ?? 0})</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Enregistrer ce segment</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Nom (ex : Mistral, Clients Premium)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Description (facultatif)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button className="w-full" onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Enregistrer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Segments enregistrés</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {segments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun segment enregistré.</p>
            ) : segments.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-2 rounded-md border border-border p-3">
                <button className="min-h-[44px] text-left" onClick={() => setDef({ ...EMPTY_SEGMENT, ...s.definition })}>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.description || segmentSummary(s.definition)}</p>
                </button>
                <Button variant="ghost" size="icon" aria-label={`Supprimer ${s.name}`} onClick={() => void remove(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SegmentBuilder;