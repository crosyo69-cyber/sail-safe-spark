import { useCallback, useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, ArrowLeft, RefreshCw, Save, ShieldCheck, Send } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { FunctionsHttpError } from "@supabase/supabase-js";

interface SyncLog {
  id: string;
  created_at: string;
  performed_by_email: string | null;
  mode: string;
  duration_ms: number;
  total_candidates: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  details: Array<Record<string, unknown>>;
}

interface SyncReport {
  mode: string;
  dry_run: boolean;
  total_candidates: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  duration_ms: number;
  details: Array<Record<string, unknown>>;
}

const AdminMarketing = () => {
  const { isAdmin, isLoading } = useAdmin();
  const [listId, setListId] = useState("");
  const [mode, setMode] = useState("test");
  const [limit, setLimit] = useState("");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [report, setReport] = useState<SyncReport | null>(null);

  const load = useCallback(async () => {
    const [{ data: settings }, { data: logRows }] = await Promise.all([
      supabase.from("marketing_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("marketing_sync_logs").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    if (settings) {
      setListId(settings.brevo_list_id != null ? String(settings.brevo_list_id) : "");
      setMode(settings.mode ?? "test");
      setLastSync(settings.last_sync_at ?? null);
    }
    setLogs((logRows ?? []) as unknown as SyncLog[]);
  }, []);

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, load]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("marketing_settings")
      .update({
        brevo_list_id: listId.trim() === "" ? null : Number(listId),
        mode,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) { toast.error("Enregistrement impossible", { description: error.message }); return; }
    toast.success("Paramètres marketing enregistrés");
  };

  const runSync = async () => {
    setSyncing(true);
    setReport(null);
    const { data, error } = settle(
      await marketingService.syncBrevoContacts({
        mode,
        listId: listId.trim() === "" ? null : Number(listId),
        limit: limit.trim() === "" ? null : Number(limit),
      }),
    );
    setSyncing(false);
    if (error) {
      const detail = error instanceof FunctionsHttpError
        ? await error.context.text()
        : error.message;
      toast.error("Synchronisation échouée", { description: detail });
      return;
    }
    setReport(data as SyncReport);
    toast.success(
      (data as SyncReport).dry_run ? "Simulation terminée (mode test)" : "Synchronisation terminée",
    );
    void load();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Paramètres Marketing — Administration | Kitesurf Passion Hyères</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin"><ArrowLeft className="w-4 h-4 mr-2" />Administration</Link>
            </Button>
            <h1 className="text-2xl font-bold">Paramètres Marketing</h1>
          </div>
          <Button onClick={runSync} disabled={syncing}>
            {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Synchroniser Brevo
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Connexion Brevo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border p-3 bg-muted/30">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Clé API Brevo</p>
                <p>
                  Elle est stockée comme secret serveur (<code>BREVO_API_KEY</code>) et n'est jamais
                  exposée au navigateur. Demandez-moi de la mettre à jour dans le chat pour ouvrir
                  le formulaire sécurisé.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="listId">Identifiant de la liste Brevo</Label>
                <Input
                  id="listId" inputMode="numeric" placeholder="ex : 3"
                  value={listId} onChange={(e) => setListId(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mode">Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger id="mode"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test (simulation, aucun envoi vers Brevo)</SelectItem>
                    <SelectItem value="production">Production (écriture réelle dans Brevo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Limiter le nombre de contacts (optionnel)</Label>
                <Input
                  id="limit" inputMode="numeric" placeholder="ex : 5"
                  value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={save} disabled={saving} variant="secondary">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
              <span className="text-sm text-muted-foreground">
                Dernière synchronisation :{" "}
                {lastSync ? format(parseISO(lastSync), "dd/MM/yyyy HH:mm", { locale: fr }) : "jamais"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Seuls les contacts ayant donné leur consentement marketing sont synchronisés. Aucun
              email n'est envoyé par cette opération.
            </p>
          </CardContent>
        </Card>

        {report && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="w-4 h-4" /> Rapport de synchronisation
                {report.dry_run && <Badge variant="outline">mode test</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  ["Candidats", report.total_candidates],
                  ["Créés", report.created],
                  ["Mis à jour", report.updated],
                  ["Ignorés", report.skipped],
                  ["Erreurs", report.errors],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-md border p-3 text-center">
                    <div className="text-2xl font-bold">{value as number}</div>
                    <div className="text-xs text-muted-foreground">{label as string}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Durée : {report.duration_ms} ms</p>
              <div className="max-h-72 overflow-auto rounded-md border">
                <pre className="text-xs p-3 whitespace-pre-wrap break-all">
                  {JSON.stringify(report.details, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">Journal des synchronisations</CardTitle></CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune synchronisation enregistrée.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Durée</TableHead>
                    <TableHead className="text-right">Créés</TableHead>
                    <TableHead className="text-right">MAJ</TableHead>
                    <TableHead className="text-right">Ignorés</TableHead>
                    <TableHead className="text-right">Erreurs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{format(parseISO(l.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{l.performed_by_email ?? "—"}</TableCell>
                      <TableCell><Badge variant={l.mode === "production" ? "default" : "outline"}>{l.mode}</Badge></TableCell>
                      <TableCell className="text-right">{l.duration_ms} ms</TableCell>
                      <TableCell className="text-right">{l.created_count}</TableCell>
                      <TableCell className="text-right">{l.updated_count}</TableCell>
                      <TableCell className="text-right">{l.skipped_count}</TableCell>
                      <TableCell className="text-right">{l.error_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminMarketing;