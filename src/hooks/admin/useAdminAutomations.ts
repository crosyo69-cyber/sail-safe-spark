import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMarketing } from "@/hooks/services/useMarketing";
import type { AutomationDraft } from "@/services/marketing.service";
import type { Automation, AutomationRun, SegmentRow } from "@/features/admin-automations/types";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Logique de présentation de la page « Automatisations marketing ».
 * Aucun accès direct à Supabase : uniquement marketing.service via useMarketing().
 */
export const useAdminAutomations = (enabled: boolean) => {
  const marketing = useMarketing();

  const automationsQuery = marketing.useAutomations(enabled);
  const runsQuery = marketing.useAutomationRuns(60, enabled);
  const segmentsQuery = marketing.useSegmentsList(enabled);

  const saveMutation = marketing.useSaveAutomation();
  const toggleMutation = marketing.useToggleAutomation();
  const deleteMutation = marketing.useDeleteAutomation();
  const executeMutation = marketing.useExecuteAutomation();

  const [running, setRunning] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);

  const automations = (automationsQuery.data as Automation[] | undefined) ?? [];
  const runs = (runsQuery.data as AutomationRun[] | undefined) ?? [];
  const segments = (segmentsQuery.data as SegmentRow[] | undefined) ?? [];

  const loading = automationsQuery.isPending || runsQuery.isPending || segmentsQuery.isPending;
  const saving = saveMutation.isPending;

  const loadError = automationsQuery.error;
  useEffect(() => {
    // Même message qu'avant la migration.
    if (loadError) toast.error("Chargement impossible", { description: msg(loadError) });
  }, [loadError]);

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

  const save = async (draft: AutomationDraft | null) => {
    if (!draft?.name?.trim()) { toast.error("Le nom est obligatoire"); return false; }
    if (!draft.email_subject?.trim()) { toast.error("L'objet de l'email est obligatoire"); return false; }
    try {
      await saveMutation.mutateAsync(draft);
      toast.success("Automatisation enregistrée");
      return true;
    } catch (e) {
      toast.error("Enregistrement impossible", { description: msg(e) });
      return false;
    }
  };

  const toggleActive = async (a: Automation, active: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id: a.id, active });
      toast.success(active ? "Automatisation activée" : "Automatisation désactivée");
    } catch (e) {
      toast.error("Mise à jour impossible", { description: msg(e) });
    }
  };

  const remove = async (a: Automation) => {
    if (!confirm(`Supprimer « ${a.name} » et son historique ?`)) return;
    try {
      await deleteMutation.mutateAsync(a.id);
      toast.success("Automatisation supprimée");
    } catch (e) {
      toast.error("Suppression impossible", { description: msg(e) });
    }
  };

  const execute = async (a: Automation, mode: "test" | "live") => {
    if (mode === "live" && !confirm(
      `Exécuter « ${a.name} » en mode RÉEL ? Les emails seront réellement envoyés aux destinataires éligibles.`,
    )) return;
    setRunning(a.id);
    setTestResult(null);
    try {
      const data = await executeMutation.mutateAsync({ id: a.id, mode });
      const report = (data as { report?: Record<string, unknown>[] } | null)?.report?.[0] ?? {};
      setTestResult({ mode, ...report });
      toast.success(mode === "test" ? "Test terminé (aucun email envoyé)" : "Exécution terminée");
    } catch (e) {
      toast.error("Exécution impossible", { description: msg(e) });
    } finally {
      setRunning(null);
    }
  };

  return {
    automations,
    runs,
    segments,
    upcoming,
    runsByAutomation,
    loading,
    saving,
    running,
    testResult,
    save,
    toggleActive,
    remove,
    execute,
  };
};
