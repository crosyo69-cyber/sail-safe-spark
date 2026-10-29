import { describe, expect, test } from "bun:test";
import { csvCell, csvRow, neutralizeFormula } from "../src/lib/csv-safe";

describe("protection des exports contre les formules", () => {
  test.each(["=1+1", "+1+1", "-1+1", "@SUM(A1:A2)"])("%s est neutralisée", (v) => {
    expect(csvCell(v)).toBe(`"'${v}"`);
  });

  test("espaces initiaux ne contournent pas la protection", () => {
    expect(neutralizeFormula("   =1+1")).toBe("'   =1+1");
  });

  test("tabulation initiale ne contourne pas la protection", () => {
    expect(neutralizeFormula("\t=1+1")).toBe("'\t=1+1");
    expect(neutralizeFormula("\tTexte")).toBe("'\tTexte");
  });

  test("retour à la ligne initial ou interne", () => {
    expect(neutralizeFormula("\n=HYPERLINK(1)")).toBe("'\n=HYPERLINK(1)");
    expect(csvCell("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
  });

  test("caractères de contrôle et espace insécable", () => {
    expect(neutralizeFormula("\u0000=1")).toBe("'\u0000=1");
    expect(neutralizeFormula("\u00a0@cmd")).toBe("'\u00a0@cmd");
  });

  test("texte français, accents, dates et montants intacts", () => {
    expect(csvCell("Élodie Château-Gérard")).toBe('"Élodie Château-Gérard"');
    expect(csvCell("29/10/2026")).toBe('"29/10/2026"');
    expect(csvCell("150,00 €")).toBe('"150,00 €"');
    expect(csvCell("a=b")).toBe('"a=b"');
  });

  test("téléphones et montants négatifs protégés aussi (choix validé)", () => {
    expect(csvCell("+33672716905")).toBe(`"'+33672716905"`);
    expect(csvCell(-50)).toBe(`"'-50"`);
  });

  test("guillemets doublés, null et undefined vides", () => {
    expect(csvCell('dit "bonjour"')).toBe('"dit ""bonjour"""');
    expect(csvRow([null, undefined, 3])).toBe('"";"";"3"');
  });
});
