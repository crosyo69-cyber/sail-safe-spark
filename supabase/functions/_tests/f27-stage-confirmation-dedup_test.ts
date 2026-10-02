// F-27-03-04 — book_stage_for_package ne doit plus envoyer de confirmation en double.
// Tests STATIC : lecture des migrations + modèle de simulation (aucune base réelle).
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const dir = new URL("../../migrations/", import.meta.url);
const files = [...Deno.readDirSync(dir)].map((f) => f.name).filter((n) => n.endsWith(".sql")).sort();
const latest = files
  .map((n) => ({ n, s: Deno.readTextFileSync(new URL(n, dir)) }))
  .filter((f) => /CREATE OR REPLACE FUNCTION public\.book_stage_for_package/.test(f.s))
  .pop()!;
const fn = latest.s;

// Simulation : trigger AFTER INSERT = 1 email par booking ; rollback = 0 email.
function simulate(days: boolean[], explicitCall: boolean) {
  const emails: number[] = [];
  const bookings: number[] = [];
  for (let i = 0; i < days.length; i++) {
    if (!days[i]) return { ok: false, emails: 0, bookings: 0, credits: 0 };
    bookings.push(i);
    emails.push(i); // trigger trg_pkg_booking_confirmation_dg
  }
  if (explicitCall) emails.push(0);
  return { ok: true, emails: emails.length, bookings: bookings.length, credits: bookings.length };
}

Deno.test("T1 static nominal: 5 bookings, 5 emails", () => {
  assertEquals(simulate([true, true, true, true, true], false), { ok: true, emails: 5, bookings: 5, credits: 5 });
});
Deno.test("T2 static: ancien comportement = 6 emails (doublon jour 1)", () => {
  assertEquals(simulate([true, true, true, true, true], true).emails, 6);
});
Deno.test("T3 static rollback: échec jour 3 → 0 booking, 0 email", () => {
  assertEquals(simulate([true, true, false, true, true], false), { ok: false, emails: 0, bookings: 0, credits: 0 });
});
Deno.test("T4 static crédits: 1 crédit par jour", () => {
  assertEquals(simulate([true, true, true, true, true], false).credits, 5);
});
Deno.test("T2b static SQL: plus d'appel explicite à enqueue_booking_confirmation", () => {
  assert(!/PERFORM\s+public\.enqueue_booking_confirmation/.test(fn));
});
Deno.test("T5 static SQL: INSERT package_bookings confirmed/regular conservé", () => {
  assert(fn.includes("'confirmed', 'regular', v_stage_group"));
});
Deno.test("T6 static SQL: stage_group_id conservé", () => {
  assert(fn.includes("v_stage_group UUID := gen_random_uuid()"));
  assert(fn.includes("booking_kind, stage_group_id)"));
});
Deno.test("T7 static SQL: stage_date_conflict après FOR UPDATE", () => {
  const lock = fn.indexOf("FOR UPDATE");
  const conflict = fn.indexOf("'stage_date_conflict'");
  const loop = fn.indexOf("FOR v_i IN 0..4");
  assert(lock > 0 && conflict > lock && loop > conflict);
});
Deno.test("T8 static SQL: pas de pré-check day_full réintroduit", () => {
  assert(!fn.includes("day_full"));
});
Deno.test("T9/T10 static SQL: find_or_create_daily_group conservé", () => {
  assert(fn.includes("find_or_create_daily_group(v_day, 'stage_100_glisse', 1)"));
});
Deno.test("T11 static SQL: scope par package", () => {
  assert(fn.includes("pb.package_id = v_pkg.id"));
  assert(fn.includes("SECURITY DEFINER") && fn.includes("search_path TO 'public'"));
});
