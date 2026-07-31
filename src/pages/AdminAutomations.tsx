import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAdmin } from "@/hooks/useAdmin";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft, Bot, Loader2, Plus, FlaskConical, Send, History, Clock, Trash2, Pencil,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Automation, AutomationRun, AutomationTrigger, EMPTY_AUTOMATION, TRIGGER_LABEL, TRIGGER_OPTIONS,
} from "@/components/admin/automation-types";
import { TOPIC_OPTIONS } from "@/components/admin/segment-types";

type SegmentRow = { id: string; name: string };

const fmt = (d?: string | null) =>
  d ? format(parseISO(d), "dd/MM/yyyy HH:mm", { locale: fr }) : "—";

const STATUS_BADGE: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  error: "bg-destructive/15 text-destructive",
  skipped: "bg-muted text-muted-foreground",
  running: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
};

const AdminAutomations = () => {
  const { isAdmin, isLoading } = useAdmin();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Automation> | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, r, s] = await Promise.all([
      supabase.from("marketing_automations").select("*").order("priority").order("created_at"),
      supabase.from("marketing_automation_runs").select("*").order("started_at", { ascending: false }).limit(60),
      supabase.from("marketing_segments").select("id, name").order("name"),
    ]);
    setLoading(false);
    if (a.error) { toast.error("Chargement impossible", { description: a.error.message }); return; }
    setAutomations((a.data ?? []) as unknown as Automation[]);
    setRuns((r.data ?? []) as unknown as AutomationRun[]);
    setSegments((s.data ?? []) as SegmentRow[]);
  }, []);

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, load]);

  const upcoming = useMemo(
    () => automations.filter((a) => a.active)
      .slice()
      .sort((x, y) => x.next_run_at.localeCompare(y.next_run_at)),
    [automations],
  );

  const runsByAutomation = useCallback(
    (id: string) => runs.filter((r) => r.automation_id === id),
    [runs],
  );

  const save = async () => {
    if (!editing?.name?.trim()) { toast.error("Le nom est obligatoire"); return; }
    if (!editing.email_subject?.trim()) { toast.error("L'objet de l'email est obligatoire"); return; }
    setSaving(true);
    const payload = {
      name: editing.name.trim(),
      description: editing.description ?? null,
      active: editing.active ?? false,
      trigger_type: editing.trigger_type ?? "credit_expiring",
      trigger_config: (editing.trigger_config ?? {}) as never,
      segment_id: editing.segment_id ?? null,
      segment_definition: (editing.segment_definition ?? {}) as never,
      required_topic: editing.required_topic || null,
      email_subject: editing.email_subject ?? "",
      email_html: editing.email_html ?? "",
      email_cta_label: editing.email_cta_label || null,
      email_cta_url: editing.email_cta_url || null,
      delay_days: Number(editing.delay_days ?? 0),
      priority: Number(editing.priority ?? 100),
      dedupe_window_days: Number(editing.dedupe_window_days ?? 30),
      max_recipients: Number(editing.max_recipients ?? 500),
    };
    const res = editing.id
      ? await supabase.from("marketing_automations").update(payload).eq("id", editing.id)
      : await supabase.from("marketing_automations").insert(payload);
    setSaving(false);
    if (res.error) { toast.error("Enregistrement impossible", { description: res.error.message }); return; }
    toast.success("Automatisation enregistrée");
    setEditing(null);
    void load();
  };

  const toggleActive = async (a: Automation, active: boolean) => {
    const { error } = await supabase.from("marketing_automations").update({ active }).eq("id", a.id);
    if (error) { toast.error("Mise à jour impossible", { description: error.message }); return; }
    toast.success(active ? "Automatisation activée" : "Automatisation désactivée");
    void load();
  };

  const remove = async (a: Automation) => {
    if (!confirm(`Supprimer « ${a.name} » et son historique ?`)) return;
    const { error } = await supabase.from("marketing_automations").delete().eq("id", a.id);
    if (error) { toast.error("Suppression impossible", { description: error.message }); return; }
    toast.success("Automatisation supprimée");
    void load();
  };

  const execute = async (a: Automation, mode: "test" | "live") => {
    if (mode === "live" && !confirm(
      `Exécuter « ${a.name} » en mode RÉEL ? Les emails seront réellement envoyés aux destinataires éligibles.`,
    )) return;
    setRunning(a.id);
    setTestResult(null);
    const { data, error } = await supabase.functions.invoke("run-marketing-automations", {
      body: { mode, automation_id: a.id },
    });
    setRunning(null);
    if (error) { toast.error("Exécution impossible", { description: error.message }); return; }
    const report = (data as { report?: Record<string, unknown>[] })?.report?.[0] ?? {};
    setTestResult({ mode, ...report });
    toast.success(mode === "test" ? "Test terminé (aucun email envoyé)" : "Exécution terminée");
    void load();
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!isAdmin) return <Navigate to="/auth" replace />;

  const triggerMeta = TRIGGER_OPTIONS.find((t) => t.value === (editing?.trigger_type ?? "credit_expiring"));

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Automatisations marketing | Kitesurf Passion Hyères</title>
        <meta name="description" content="Pilotage des scénarios marketing automatisés de Kitesurf Passion à Hyères : déclencheurs, segments, tests et historique." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-7 w-7 text-primary" /> Automatisations
            </h1>
            <p className="text-muted-foreground text-sm">
              Scénarios déclenchés par événement métier. Toujours testables avant envoi réel.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="min-h-[44px]">
              <Link to="/admin/campagnes"><ArrowLeft className="h-4 w-4 mr-2" /> Campagnes</Link>
            </Button>
            <Button className="min-h-[44px]" onClick={() => setEditing({ ...EMPTY_AUTOMATION })}>
              <Plus className="h-4 w-4 mr-2" /> Nouvelle automatisation
            </Button>
          </div>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Automatisations</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="upcoming">Prochaines exécutions</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4 space-y-4">
            {loading ? (
              <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
            ) : automations.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                Aucune automatisation. Créez votre premier scénario.
              </CardContent></Card>
            ) : automations.map((a) => {
              const last = runsByAutomation(a.id)[0];
              return (
                <Card key={a.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-semibold text-lg">{a.name}</h2>
                          <Badge variant="secondary">{TRIGGER_LABEL[a.trigger_type]}</Badge>
                          {a.required_topic && (
                            <Badge variant="outline">
                              {TOPIC_OPTIONS.find((t) => t.value === a.required_topic)?.label ?? a.required_topic}
                            </Badge>
                          )}
                          <Badge className={a.active ? STATUS_BADGE.success : STATUS_BADGE.skipped}>
                            {a.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                        <p className="text-xs text-muted-foreground mt-2">
                          Priorité {a.priority} · délai {a.delay_days} j · anti-doublon {a.dedupe_window_days} j ·
                          {" "}dernière exécution {fmt(a.last_run_at)} · prochaine {fmt(a.next_run_at)}
                          {last && ` · dernier résultat : ${last.status} (${last.recipients_count} dest.)`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={a.active}
                          onCheckedChange={(v) => void toggleActive(a, v)}
                          aria-label="Activer l'automatisation"
                        />
                        <Button variant="outline" size="sm" className="min-h-[44px]"
                          onClick={() => void execute(a, "test")} disabled={running === a.id}>
                          {running === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                          <span className="ml-2">Test</span>
                        </Button>
                        <Button size="sm" className="min-h-[44px]"
                          onClick={() => void execute(a, "live")} disabled={running === a.id || !a.active}>
                          <Send className="h-4 w-4 mr-2" /> Exécuter
                        </Button>
                        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]"
                          onClick={() => setEditing(a)} aria-label="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]"
                          onClick={() => void remove(a)} aria-label="Supprimer">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {testResult && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" /> Résultat de la dernière exécution
                  {testResult.mode === "test" && <Badge variant="secondary">mode test — aucun envoi</Badge>}
                </CardTitle></CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted/40 rounded-md p-4 overflow-auto max-h-80">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Automatisation</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Destinataires</TableHead>
                  <TableHead>Ignorés</TableHead>
                  <TableHead>Campagne</TableHead>
                  <TableHead>Résultat</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {runs.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Aucune exécution enregistrée.
                    </TableCell></TableRow>
                  )}
                  {runs.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{fmt(r.started_at)}</TableCell>
                      <TableCell>{automations.find((a) => a.id === r.automation_id)?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant={r.mode === "live" ? "default" : "secondary"}>{r.mode === "live" ? "Réel" : "Test"}</Badge></TableCell>
                      <TableCell>{r.recipients_count}</TableCell>
                      <TableCell>{r.skipped_count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.campaign_id ? "générée" : "—"}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[r.status]}>{r.status}</Badge>
                        {r.error && <span className="block text-xs text-destructive mt-1">{r.error}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            <Card><CardContent className="p-5 space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-muted-foreground">Aucune automatisation active planifiée.</p>
              ) : upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b last:border-0 py-2">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{TRIGGER_LABEL[a.trigger_type]} · priorité {a.priority}</p>
                  </div>
                  <p className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {fmt(a.next_run_at)}</p>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2 flex items-center gap-2">
                <History className="h-3.5 w-3.5" /> Le planificateur quotidien exécute les automatisations actives dont l'échéance est atteinte.
              </p>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
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
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auto-desc">Description</Label>
                <Input id="auto-desc" value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Déclencheur</Label>
                  <Select value={editing.trigger_type ?? "credit_expiring"}
                    onValueChange={(v) => {
                      const meta = TRIGGER_OPTIONS.find((t) => t.value === v);
                      setEditing({
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
                      onChange={(e) => setEditing({ ...editing, trigger_config: { ...(editing.trigger_config ?? {}), days: Number(e.target.value) } })} />
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Segment enregistré</Label>
                  <Select value={editing.segment_id ?? "none"}
                    onValueChange={(v) => setEditing({ ...editing, segment_id: v === "none" ? null : v })}>
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
                    onValueChange={(v) => setEditing({ ...editing, required_topic: v === "none" ? null : v })}>
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
                  onChange={(e) => setEditing({ ...editing, email_subject: e.target.value })}
                  placeholder="Vos crédits expirent bientôt, {{prenom}}" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auto-html">Contenu HTML</Label>
                <Textarea id="auto-html" rows={7} value={editing.email_html ?? ""}
                  onChange={(e) => setEditing({ ...editing, email_html: e.target.value })}
                  placeholder="<p>Bonjour {{prenom}}, il vous reste {{credits}} séance(s) jusqu'au {{expiration}}.</p>" />
                <p className="text-xs text-muted-foreground">
                  Variables : {"{{prenom}} {{nom}} {{email}} {{credits}} {{expiration}} {{derniere_seance}} {{niveau}}"}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="auto-cta">Libellé du bouton</Label>
                  <Input id="auto-cta" value={editing.email_cta_label ?? ""}
                    onChange={(e) => setEditing({ ...editing, email_cta_label: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="auto-cta-url">Lien du bouton</Label>
                  <Input id="auto-cta-url" value={editing.email_cta_url ?? ""}
                    onChange={(e) => setEditing({ ...editing, email_cta_url: e.target.value })} />
                </div>
              </div>

              <div className="grid sm:grid-cols-4 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="auto-delay">Délai (j)</Label>
                  <Input id="auto-delay" type="number" min={0} value={String(editing.delay_days ?? 0)}
                    onChange={(e) => setEditing({ ...editing, delay_days: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="auto-prio">Priorité</Label>
                  <Input id="auto-prio" type="number" min={1} value={String(editing.priority ?? 100)}
                    onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="auto-dedupe">Anti-doublon (j)</Label>
                  <Input id="auto-dedupe" type="number" min={0} value={String(editing.dedupe_window_days ?? 30)}
                    onChange={(e) => setEditing({ ...editing, dedupe_window_days: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="auto-max">Max dest.</Label>
                  <Input id="auto-max" type="number" min={1} value={String(editing.max_recipients ?? 500)}
                    onChange={(e) => setEditing({ ...editing, max_recipients: Number(e.target.value) })} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={editing.active ?? false}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })} id="auto-active" />
                <Label htmlFor="auto-active">Automatisation active (exécutée par le planificateur quotidien)</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setEditing(null)}>Annuler</Button>
            <Button className="min-h-[44px]" onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAutomations;
