/**
 * Exports XLSX administratifs protégés contre l'injection de formules.
 *
 * Chaque colonne a un type métier déclaré (texte, nombre, date) : le typage ne
 * dépend jamais du contenu apparent d'une cellule. Les textes sont écrits comme
 * cellules texte explicites (jamais de type « Formula »), donc « =1+1 » ou
 * « +33 6… » s'affichent tels quels, sans apostrophe. Une valeur non convertible
 * dans une colonne nombre/date (ex. « À vérifier ») est écrite comme texte.
 */
import writeXlsxFile from "write-excel-file/universal";

export type XlsxKind = "text" | "number" | "date" | "datetime";
export interface XlsxColumn { header: string; kind: XlsxKind }

// Caractères interdits par XML 1.0 (ne peuvent exister dans un fichier XLSX valide).
// eslint-disable-next-line no-control-regex
const XML_INVALID = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g;
const NUMERIC = /^-?\d+(?:[.,]\d+)?$/;
const FR_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

type Cell = { value: string | number | Date; type: typeof String | typeof Number | typeof Date; format?: string } | null;

const toText = (v: unknown): string =>
  (v === null || v === undefined ? "" : String(v)).replace(XML_INVALID, "");

export function xlsxCell(value: unknown, kind: XlsxKind): Cell {
  if (value === null || value === undefined || value === "") return null;
  if (kind === "number") {
    if (typeof value === "number" && Number.isFinite(value)) return { value, type: Number };
    if (typeof value === "string" && NUMERIC.test(value.trim())) {
      return { value: Number(value.trim().replace(",", ".")), type: Number };
    }
  }
  if (kind === "date" || kind === "datetime") {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return { value, type: Date, format: kind === "date" ? "dd/mm/yyyy" : "dd/mm/yyyy hh:mm" };
    }
    const m = typeof value === "string" ? FR_DATE.exec(value.trim()) : null;
    if (m) return { value: new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])), type: Date, format: "dd/mm/yyyy" };
  }
  return { value: toText(value), type: String };
}

export function buildXlsxData(columns: XlsxColumn[], rows: unknown[][]): Cell[][] {
  const header: Cell[] = columns.map((c) => ({ value: toText(c.header), type: String }));
  return [header, ...rows.map((r) => columns.map((c, i) => xlsxCell(r[i], c.kind)))];
}

export async function buildXlsxBlob(columns: XlsxColumn[], rows: unknown[][]): Promise<Blob> {
  return writeXlsxFile(buildXlsxData(columns, rows) as never).toBlob();
}

export async function downloadXlsx(fileName: string, columns: XlsxColumn[], rows: unknown[][]): Promise<void> {
  const blob = await buildXlsxBlob(columns, rows);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
