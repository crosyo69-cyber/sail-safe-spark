/**
 * F-27-03-02 — Persistance du stage_group_id sur package_bookings.
 * Modèle TS de la règle + assertions statiques sur la migration appliquée.
 */
import { assert, assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

type Booking = { id: number; packageId: string; date: string; status: "confirmed" | "cancelled"; stageGroupId: string | null };
type World = { bookings: Booking[]; credits: Record<string, number>; stageIds: string[]; seq: number };

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const world = (): World => ({ bookings: [], credits: {}, stageIds: [], seq: 0 });

function bookStage(w: World, pkg: string, start: string, failOnDay = -1) {
  const stageId = crypto.randomUUID();
  const dates = Array.from({ length: 5 }, (_, i) => addDays(start, i));
  if (w.bookings.some((b) => b.packageId === pkg && b.status === "confirmed" && dates.includes(b.date))) {
    return { ok: false, error: "stage_date_conflict" };
  }
  // transaction : copie de travail, commit uniquement en fin
  const staged: Booking[] = [];
  for (let i = 0; i < 5; i++) {
    if (i === failOnDay) return { ok: false, error: "day_full" }; // rollback total
    staged.push({ id: ++w.seq, packageId: pkg, date: dates[i], status: "confirmed", stageGroupId: stageId });
  }
  w.bookings.push(...staged);
  w.credits[pkg] = (w.credits[pkg] ?? 0) + 5;
  w.stageIds.push(stageId);
  return { ok: true, stage_group_id: stageId };
}

const MON = "2026-10-05";
const of = (w: World, id: string) => w.bookings.filter((b) => b.stageGroupId === id);

Deno.test("T1 — stage_group_id persisté sur chaque booking", () => {
  const w = world();
  const r = bookStage(w, "A", MON);
  assert(r.ok && w.bookings.every((b) => b.stageGroupId === r.stage_group_id));
});
Deno.test("T2 — les 5 jours restent rattachés", () => {
  const w = world();
  const r = bookStage(w, "A", MON);
  assertEquals(of(w, r.stage_group_id!).map((b) => b.date), [0, 1, 2, 3, 4].map((i) => addDays(MON, i)));
});
Deno.test("T3 — bookings du même stage partagent le même id", () => {
  const w = world();
  bookStage(w, "A", MON);
  assertEquals(new Set(w.bookings.map((b) => b.stageGroupId)).size, 1);
});
Deno.test("T4 — deux stages n'ont jamais le même id", () => {
  const w = world();
  const a = bookStage(w, "A", MON), b = bookStage(w, "A", addDays(MON, 7));
  assertNotEquals(a.stage_group_id, b.stage_group_id);
  assertEquals(of(w, a.stage_group_id!).length, 5);
});
Deno.test("T5 — rollback complet si une création échoue", () => {
  const w = world();
  assertEquals(bookStage(w, "A", MON, 3).ok, false);
  assertEquals(w.bookings.length, 0);
  assertEquals(w.stageIds.length, 0);
  assertEquals(w.credits["A"] ?? 0, 0);
});
Deno.test("T6/T7/T8 — conflit : aucun id, booking ni crédit supplémentaire", () => {
  const w = world();
  bookStage(w, "A", MON);
  const r = bookStage(w, "A", addDays(MON, 2));
  assertEquals(r.error, "stage_date_conflict");
  assertEquals(w.stageIds.length, 1);
  assertEquals(w.bookings.length, 5);
  assertEquals(w.credits["A"], 5);
});
Deno.test("T9 — booking annulé : nouvelle réservation possible, nouvel id", () => {
  const w = world();
  const a = bookStage(w, "A", MON);
  w.bookings.forEach((b) => (b.status = "cancelled"));
  const b = bookStage(w, "A", MON);
  assert(b.ok);
  assertNotEquals(a.stage_group_id, b.stage_group_id);
  assertEquals(of(w, a.stage_group_id!).length, 5, "historique annulé conserve son rattachement");
});
Deno.test("T10 — deux packages restent indépendants", () => {
  const w = world();
  const a = bookStage(w, "A", MON), b = bookStage(w, "B", MON);
  assertNotEquals(a.stage_group_id, b.stage_group_id);
  assert(of(w, a.stage_group_id!).every((x) => x.packageId === "A"));
});

// --- SQL appliqué ---------------------------------------------------------
let sql = "";
for await (const e of Deno.readDir("supabase/migrations")) {
  if (!e.isFile || !e.name.endsWith(".sql")) continue;
  const c = await Deno.readTextFile(`supabase/migrations/${e.name}`);
  if (c.includes("ADD COLUMN IF NOT EXISTS stage_group_id uuid") && c.includes("FUNCTION public.book_stage_for_package(")) sql = c;
}

Deno.test("SQL — colonne nullable + index partiel", () => {
  assert(sql.includes("ALTER TABLE public.package_bookings ADD COLUMN IF NOT EXISTS stage_group_id uuid;"));
  assert(sql.includes("ON public.package_bookings(stage_group_id) WHERE stage_group_id IS NOT NULL"));
});
Deno.test("SQL — ordre verrou → conflit → groupe → insert avec stage_group_id → e-mail", () => {
  const lock = sql.indexOf("WHERE id = p_package_id FOR UPDATE");
  const conflict = sql.indexOf("'stage_date_conflict'");
  const group = sql.indexOf("find_or_create_daily_group(v_day, 'stage_100_glisse', 1)");
  const insert = sql.indexOf("VALUES (v_pkg.id, v_group_id, 'confirmed', 'regular', v_stage_group)");
  const mail = sql.indexOf("enqueue_booking_confirmation(v_booking_ids[1])");
  assert(lock > 0 && lock < conflict && conflict < group && group < insert && insert < mail);
});
Deno.test("SQL — protections conservées, aucun changement ACL", () => {
  assert(sql.includes("SECURITY DEFINER"));
  assert(sql.includes("SET search_path TO 'public'"));
  assert(sql.includes("pb.status = 'confirmed'"));
  assert(sql.includes("RAISE EXCEPTION 'day_full:%'"));
  assert(!/\b(GRANT|REVOKE|POLICY)\b/.test(sql));
});
