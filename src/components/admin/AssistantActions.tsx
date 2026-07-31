import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import {
  ACTION_META, PRIORITY_META, STATUS_META,
  type PreparedAction, type PreparedActionStatus, type PreparedActionType,
} from "@/components/admin/action-types";
import { CheckCircle2, ClipboardList, Loader2, RefreshCw, ShieldCheck, X } from "lucide-react";

const PREPARE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistant-prepare-action`;

const dateFr = (v?: string | null) =>
  v ? new Date(v).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export type AssistantActionsHandle = {
  prepare: (type: PreparedActionType, params?: Record<string, unknown>, context?: string) => Promise<void>;
};

type Props = { onAsk?: (question: string) => void };

const TABS: { key: PreparedActionStatus | "all"; label: string }[] = [
  { key: "prepared", label: "Préparées" },
  { key: "validated", label: "Validées" },
  { key: "cancelled", label: "Annulées" },
  { key: "expired", label: "Expirées" },
  { key: "all", label: "Tout" },
];

export const AssistantActions = forwardRef<AssistantActionsHandle, Props>(({ onAsk }, ref) => {
  const [items, setItems] = useState<PreparedAction[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PreparedActionStatus | "all">("prepared");
  const [preparing, setPreparing] = useState<PreparedActionType | null>(null);
  const [selected, setSelected] = useState<PreparedAction | null>(null);
  const [deciding, setDeciding] = useState(false);

  const load = useCallback(async (status: PreparedActionStatus | "all") => {
    setLoading(true);
    const { data, error } = await supabase.rpc("assistant_list_actions", {
      p_status: status === "all" ? null : status,
      p_limit: 50,
    });
    if (error) {
      toast.error(error.message);
      setItems([]);
    } else {
      const res = data as unknown as { items: PreparedAction[]; compteurs: Record<string, number> };
      setItems(res?.items ?? []);
      setCounts(res?.compteurs ?? {});
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(tab); }, [load, tab]);

  const prepare = useCallback(
    async (type: PreparedActionType, params: Record<string, unknown> = {}, context = "") => {
      setPreparing(type);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("Session expirée, reconnectez-vous.");

        const resp = await fetch(PREPARE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action_type: type, params, context, source: "cockpit" }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data.error || "Préparation impossible");

        toast.success("Brouillon préparé — aucun envoi effectué.");
        setTab("prepared");
        await load("prepared");
        setSelected(data.action as PreparedAction);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setPreparing(null);
      }
    },
    [load],
  );

  useImperativeHandle(ref, () => ({ prepare }), [prepare]);

  const decide = useCallback(
    async (action: PreparedAction, validate: boolean) => {
      setDeciding(true);
      const { error } = validate
        ? await supabase.rpc("assistant_validate_action", { p_id: action.id })
        : await supabase.rpc("assistant_cancel_action", { p_id: action.id, p_reason: "Annulée par l'administrateur" });
      setDeciding(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(
        validate
          ? "Action validée : brouillon créé dans Campagnes. Aucun email envoyé."
          : "Action annulée.",
      );
      setSelected(null);
      await load(tab);
    },
    [load, tab],
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-primary" /> Actions préparées
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Aucun envoi automatique
          </Badge>
          <Button size="sm" variant="ghost" className="min-h-[44px]" onClick={() => void load(tab)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium">Préparer une action</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ACTION_META) as PreparedActionType[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant="outline"
                className="min-h-[44px]"
                disabled={preparing !== null}
                onClick={() => void prepare(t)}
                title={ACTION_META[t].hint}
              >
                {preparing === t ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="mr-2">{ACTION_META[t].emoji}</span>}
                {ACTION_META[t].label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`min-h-[44px] rounded-full border px-4 text-sm transition-colors ${
                tab === t.key ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              {t.label}
              {t.key !== "all" && counts[t.key] !== undefined && ` (${counts[t.key]})`}
            </button>
          ))}
        </div>

        {loading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune action dans cette catégorie.</p>
        ) : (
          <div className="space-y-2">
            {items.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span>{ACTION_META[a.action_type]?.emoji}</span>
                  <span className="font-medium">{a.title}</span>
                  <Badge className={STATUS_META[a.status].className}>{STATUS_META[a.status].label}</Badge>
                  <Badge variant="outline" className={PRIORITY_META[a.priority] ?? ""}>{a.priority}</Badge>
                  <span className="ml-auto text-xs text-muted-foreground">{dateFr(a.created_at)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.justification}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.recipients_count} destinataire(s) · {a.segment_summary ?? "segment personnalisé"}
                </p>
              </button>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {ACTION_META[selected.action_type]?.emoji} {selected.title}
                </DialogTitle>
                <DialogDescription>
                  {ACTION_META[selected.action_type]?.label} — statut : {STATUS_META[selected.status].label}. Rien n'est
                  envoyé tant que vous n'avez pas validé.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Destinataires</p>
                    <p className="text-xl font-semibold">{selected.recipients_count}</p>
                  </div>
                  <div className="rounded-lg border p-3 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Segment utilisé</p>
                    <p className="font-medium">{selected.segment_summary ?? "Segment personnalisé"}</p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Justification</p>
                  <p>{selected.justification}</p>
                </div>

                {selected.recipients_preview.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Aperçu des destinataires</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.recipients_preview.slice(0, 12).map((r, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {[r.first_name, r.last_name].filter(Boolean).join(" ") || r.email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(selected.payload.subject || selected.payload.html) && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Prévisualisation</p>
                    <div className="rounded-lg border p-3">
                      <p><span className="text-muted-foreground">Sujet :</span> <strong>{selected.payload.subject}</strong></p>
                      {selected.payload.preheader && (
                        <p className="text-xs text-muted-foreground">Pré-header : {selected.payload.preheader}</p>
                      )}
                      {selected.payload.cta_label && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          CTA : {selected.payload.cta_label} → {selected.payload.cta_url}
                        </p>
                      )}
                    </div>
                    {selected.payload.html && (
                      <div
                        className="max-h-72 overflow-y-auto rounded-lg border bg-background p-3"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selected.payload.html) }}
                      />
                    )}
                    {!selected.payload.html && selected.payload.text && (
                      <pre className="whitespace-pre-wrap rounded-lg border p-3 text-xs">{selected.payload.text}</pre>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Préparée par {selected.prepared_by_email ?? "—"} le {dateFr(selected.created_at)} · expire le{" "}
                  {dateFr(selected.expires_at)}.
                  {selected.decided_at && ` Décision : ${selected.decided_by_email ?? "—"} le ${dateFr(selected.decided_at)}.`}
                </p>
              </div>

              <DialogFooter className="gap-2">
                {onAsk && (
                  <Button
                    variant="ghost"
                    className="min-h-[44px]"
                    onClick={() => { onAsk(`Analyse l'action préparée « ${selected.title} » et dis-moi si elle est pertinente.`); setSelected(null); }}
                  >
                    Demander l'avis de l'assistant
                  </Button>
                )}
                {selected.status === "prepared" ? (
                  <>
                    <Button variant="outline" className="min-h-[44px]" disabled={deciding} onClick={() => void decide(selected, false)}>
                      <X className="mr-2 h-4 w-4" /> Annuler
                    </Button>
                    <Button className="min-h-[44px]" disabled={deciding} onClick={() => void decide(selected, true)}>
                      {deciding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Valider (crée un brouillon)
                    </Button>
                  </>
                ) : (
                  <Badge className={STATUS_META[selected.status].className}>{STATUS_META[selected.status].label}</Badge>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
});

AssistantActions.displayName = "AssistantActions";
