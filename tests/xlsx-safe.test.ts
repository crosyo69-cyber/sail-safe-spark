import { describe, expect, test } from "bun:test";
import { unzipSync, strFromU8 } from "fflate";
import { buildXlsxBlob, xlsxCell, type XlsxColumn } from "../src/lib/xlsx-safe";

export const SECURITY_CASES: [string, string][] = [
  ["egal", "=1+1"], ["plus", "+1+1"], ["moins_formule", "-1+1"], ["arobase", "@SUM(A1:A2)"],
  ["espace_egal", " =1+1"], ["tab_egal", "\t=1+1"], ["cr_egal", "\r=1+1"], ["nbsp_egal", "\u00a0=1+1"],
  ["zwsp_egal", "\u200b=1+1"], ["bom_egal", "\ufeff=1+1"], ["pleine_largeur", "\uff1d1+1"],
  ["hyperlink", '=HYPERLINK("http://evil.example","Cliquez")'], ["dde", "=cmd|'/C calc'!A0"],
  ["tel_fr", "+33 6 72 71 69 05"], ["negatif", "-5"], ["accents", 'Hélène "Zoé" Œuvre; ça'],
  ["retour_ligne", "ligne1\nligne2"],
];

const sheetXml = async (columns: XlsxColumn[], rows: unknown[][]) => {
  const blob = await buildXlsxBlob(columns, rows);
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  return strFromU8(files["xl/worksheets/sheet1.xml"]);
};

describe("xlsx-safe", () => {
  test("aucune formule n'est créée à partir des 17 cas de sécurité", async () => {
    const xml = await sheetXml(
      [{ header: "cas", kind: "text" }, { header: "valeur", kind: "text" }],
      SECURITY_CASES,
    );
    expect(xml.includes("<f>")).toBe(false);
    expect(xml.includes("<f ")).toBe(false);
  });

  test("une colonne texte garde +33 et -5 comme texte, sans apostrophe", () => {
    expect(xlsxCell("+33 6 72 71 69 05", "text")).toEqual({ value: "+33 6 72 71 69 05", type: String });
    expect(xlsxCell("-5", "text")).toEqual({ value: "-5", type: String });
    expect(xlsxCell("=1+1", "text")).toEqual({ value: "=1+1", type: String });
  });

  test("une colonne nombre garde -5 calculable", () => {
    expect(xlsxCell(-5, "number")).toEqual({ value: -5, type: Number });
    expect(xlsxCell("-5", "number")).toEqual({ value: -5, type: Number });
    expect(xlsxCell("12,5", "number")).toEqual({ value: 12.5, type: Number });
  });

  test("une valeur non numérique dans une colonne nombre reste du texte (jamais 0)", () => {
    expect(xlsxCell("À vérifier", "number")).toEqual({ value: "À vérifier", type: String });
    expect(xlsxCell("=1+1", "number")).toEqual({ value: "=1+1", type: String });
  });

  test("une date dd/MM/yyyy devient une vraie date", () => {
    const c = xlsxCell("13/10/2026", "date");
    expect(c?.type).toBe(Date);
    expect((c?.value as Date).toISOString().slice(0, 10)).toBe("2026-10-13");
  });
});
