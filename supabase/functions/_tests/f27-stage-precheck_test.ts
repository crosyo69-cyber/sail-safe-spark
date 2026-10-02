/**
 * F-27-03-03 — Suppression du pré-check de capacité divergent.
 * Modèle TS (find_or_create + trigger) + assertions statiques sur la migration.
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

type Group = { id: string; date: string; index: number; cap: number };
type PB = { pkg: string; group: string; status: "confirmed" | "cancelled"; stage: string };
type W = { groups: Group[]; pbs: PB[]; credits: Record<string, number> };
const CAP = 4;
const addDays = (iso: string, n: number) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const taken = (w: W, g: string) => w.pbs.filter((b) => b.group === g && b.status === "confirmed").length;

function findOrCreate(w: W, date: string, allowCreate: boolean): string | null {
  for (const g of w.groups.filter((g) => g.date === date).sort((a, b) => a.index - b.index)) {
    if (taken(w, g.id) + 1 <= g.cap) return g.id;
  }
  if (!allowCreate) return null;
  const idx = Math.max(0, ...w.groups.filter((g) => g.date === date).map((g) => g.index)) + 1;
  const g = { id: `${date}#${idx}`, date, index: idx, cap: CAP };
  w.groups.push(g);
  return g.id;
}
/** allowCreate=false simule un groupe plein sans création possible (trigger group_full). */
function bookStage(w: W, pkg: string, start: string, allowCreate = true) {
  const dates = Array.from({ length: 5 }, (_, i) => addDays(start, i));
  if (w.pbs.some((b) => b.pkg === pkg && b.status === "confirmed" && dates.includes(w.groups.find((g) => g.id === b.group)!.date))) return { ok: false, error: "stage_date_conflict" };
  const snapshot = JSON.stringify(w), stage = crypto.randomUUID();
  for (const d of dates) {
    const gid = findOrCreate(w, d, allowCreate);
    if (!gid || taken(w, gid) + 1 > CAP) { Object.assign(w, JSON.parse(snapshot)); return { ok: false, error: "group_full" }; }
    w.pbs.push({ pkg, group: gid, status: "confirmed", stage });
    w.credits[pkg] = (w.credits[pkg] ?? 0) + 1;
  }
  return { ok: true, stage };
}
const MON = "2026-10-05";
const world = (): W => ({ groups: [], pbs: [], credits: {} });
const fill = (w: W, date: string, n: number) => { for (let i = 0; i < n; i++) { const g = findOrCreate(w, date, true)!; w.pbs.push({ pkg: `X${i}`, group: g, status: "confirmed", stage: "x" }); } };

Deno.test("T1 — 5 jours disponibles", () => { const w = world(); assert(bookStage(w, "A", MON).ok); assertEquals(w.pbs.length, 5); });
Deno.test("T2/T9 — jour plein sans groupe possible : refus, aucun booking/crédit partiel", () => {
  const w = world(); fill(w, addDays(MON, 3), CAP);
  const before = w.pbs.length;
  assertEquals(bookStage(w, "A", MON, false).ok, false);
  assertEquals(w.pbs.length, before); assertEquals(w.credits["A"] ?? 0, 0);
});
Deno.test("T3 — dernière place acceptée", () => { const w = world(); fill(w, MON, CAP - 1); assert(bookStage(w, "A", MON).ok); assertEquals(taken(w, `${MON}#1`), CAP); });
Deno.test("T4 — capacité jamais dépassée dans un groupe", () => { const w = world(); for (let i = 0; i < 9; i++) bookStage(w, `P${i}`, MON); assert(w.groups.every((g) => taken(w, g.id) <= g.cap)); });
Deno.test("T5 — annulation libère la place", () => { const w = world(); fill(w, MON, CAP); w.pbs[0].status = "cancelled"; bookStage(w, "A", MON); assertEquals(w.groups.filter((g) => g.date === MON).length, 1); });
Deno.test("T6 — groupe 1 plein + groupe 2 ouvert : réutilisé (ancien faux négatif day_full)", () => {
  const w = world(); fill(w, MON, CAP + 1); // crée groupe 2 avec 1 place prise
  assert(bookStage(w, "A", MON).ok);
  assertEquals(w.pbs.find((b) => b.pkg === "A")!.group, `${MON}#2`);
});
Deno.test("T7 — plusieurs clients sur le même groupe, pas de surestimation", () => { const w = world(); for (const p of ["A", "B", "C", "D"]) bookStage(w, p, MON); assertEquals(taken(w, `${MON}#1`), 4); });
Deno.test("T8 — packages indépendants", () => { const w = world(); bookStage(w, "A", MON); assert(bookStage(w, "B", MON).ok); assertEquals(w.credits["A"], 5); });
Deno.test("T10 — stage_date_conflict conservé", () => { const w = world(); bookStage(w, "A", MON); assertEquals(bookStage(w, "A", addDays(MON, 2)).error, "stage_date_conflict"); });
Deno.test("T11 — stage_group_id commun aux 5 bookings", () => { const w = world(); const r = bookStage(w, "A", MON); assert(w.pbs.every((b) => b.stage === r.stage)); });

let sql = "";
for await (const e of Deno.readDir("supabase/migrations")) {
  if (!e.isFile || !e.name.endsWith(".sql")) continue;
  const c = await Deno.readTextFile(`supabase/migrations/${e.name}`);
  if (c.includes("F-27-03-03") && c.includes("FUNCTION public.book_stage_for_package(")) sql = c;
}
Deno.test("SQL — pré-check supprimé, protections gelées présentes et ordonnées", () => {
  assert(sql.length > 0);
  assert(!sql.includes("day_full"));
  assert(!sql.includes("v_taken"));
  const lock = sql.indexOf("WHERE id = p_package_id FOR UPDATE");
  const conflict = sql.indexOf("'stage_date_conflict'");
  const group = sql.indexOf("find_or_create_daily_group(v_day, 'stage_100_glisse', 1)");
  const insert = sql.indexOf("VALUES (v_pkg.id, v_group_id, 'confirmed', 'regular', v_stage_group)");
  assert(lock > 0 && lock < conflict && conflict < group && group < insert);
  assert(sql.includes("v_stage_group UUID := gen_random_uuid()"));
  assert(sql.includes("SECURITY DEFINER") && sql.includes("SET search_path TO 'public'"));
  assert(!/\b(GRANT|REVOKE|POLICY)\b/.test(sql));
});
