/**
 * TEMPLATE — Hook d'administration (à déplacer dans `src/hooks/admin/useAdminExample.ts`).
 * Rôle : état d'UI, orchestration, toasts, confirmations. Jamais de Supabase ni de fetch.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { computeExampleStats, filterExampleRows, type ExampleRow } from "./types";
import { useExample } from "./useExample";

export const useAdminExample = () => {
  const { useList, useNotify, invalidate } = useExample();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ExampleRow | null>(null);

  const listQuery = useList();
  const rows = useMemo(() => (listQuery.data ?? []) as ExampleRow[], [listQuery.data]);
  const filtered = useMemo(() => filterExampleRows(rows, search), [rows, search]);
  const stats = useMemo(() => computeExampleStats(rows), [rows]);

  const notify = useNotify();

  const handleNotify = async (row: ExampleRow) => {
    try {
      await notify.mutateAsync({ id: row.id });
      toast.success("Notification envoyée.");
      invalidate();
    } catch (e) {
      toast.error((e as Error).message || "Erreur inconnue");
    }
  };

  return {
    loading: listQuery.isFetching,
    rows: filtered,
    stats,
    search,
    setSearch,
    selected,
    setSelected,
    handleNotify,
    refresh: () => listQuery.refetch(),
  };
};