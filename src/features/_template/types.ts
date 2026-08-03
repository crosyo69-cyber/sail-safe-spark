/**
 * TEMPLATE — Types & logique pure du module.
 * Copier ce dossier sous `src/features/<mon-module>/` puis renommer.
 * Ici : AUCUN appel réseau, AUCUN import React.
 */

export interface ExampleRow {
  id: string;
  label: string;
  status: "pending" | "done";
  created_at: string;
}

export interface ExampleStats {
  total: number;
  done: number;
  completionRate: number;
}

export const EXAMPLE_STATUSES = ["pending", "done"] as const;

/** Logique métier pure : testable sans React ni backend. */
export const computeExampleStats = (rows: ExampleRow[]): ExampleStats => {
  const total = rows.length;
  const done = rows.filter((r) => r.status === "done").length;
  return { total, done, completionRate: total === 0 ? 0 : Math.round((done / total) * 100) };
};

export const filterExampleRows = (rows: ExampleRow[], search: string): ExampleRow[] => {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => r.label.toLowerCase().includes(q));
};
