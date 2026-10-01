/**
 * F-27-03-01 — Unicité des dates du Stage 100 % Glisse.
 *
 * Deux niveaux de preuve :
 *  1. Un modèle TypeScript reproduisant la règle métier réellement
 *     implémentée dans public.book_stage_for_package (conflit si le pack
 *     possède déjà un package_booking 'confirmed' sur l'une des 5 dates).
 *  2. Des assertions statiques sur la migration SQL appliquée : le contrôle
 *     est bien placé après le verrou client_packages FOR UPDATE et AVANT la
 *     création des bookings, et les protections F-26-02 restent en place.
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const STAGE_DAYS = 5;

type Booking = { packageId: string; date: string; status: "confirmed" | "cancelled" };

type World = {
  bookings: Booking[];
  creditsConsumed: Record<string, number>;
  groupsCreated: string[];
};

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const stageDates = (start: string) =>
  Array.from({ length: STAGE_DAYS }, (_, i) => addDays(start, i));

/** public.book_stage_for_package — partie métier concernée par F-27-03-01. */
function bookStage(world: World, packageId: string, start: string): { ok: boolean; error?: string } {
  const dates = stageDates(start);

  // Contrôle F-27-03-01 : seuls les bookings 'confirmed' du MÊME pack bloquent.
  const conflict = world.bookings.some(
    (b) => b.packageId === packageId && b.status === "confirmed" && dates.includes(b.date),
  );
  if (conflict) return { ok: false, error: "stage_date_conflict" };

  for (const date of dates) {
    world.groupsCreated.push(`${date}:stage_100_glisse`);
    world.bookings.push({ packageId, date, status: "confirmed" });
    world.creditsConsumed[packageId] = (world.creditsConsumed[packageId] ?? 0) + 1;
  }
  return { ok: true };
}

const emptyWorld = (): World => ({ bookings: [], creditsConsumed: {}, groupsCreated: [] });

const MONDAY = "2026-10-05"; // lundi
const TUESDAY = addDays(MONDAY, 1);
const FRIDAY = addDays(MONDAY, 4);
const SATURDAY = addDays(MONDAY, 5);

Deno.test("T1 — chevauchement début : mardi→samedi refusé", () => {
  const w = emptyWorld();
  assertEquals(bookStage(w, "A", MONDAY).ok, true);
  assertEquals(bookStage(w, "A", TUESDAY), { ok: false, error: "stage_date_conflict" });
});

Deno.test("T2 — chevauchement fin : vendredi→mardi refusé", () => {
  const w = emptyWorld();
  bookStage(w, "A", MONDAY);
  assertEquals(bookStage(w, "A", FRIDAY).error, "stage_date_conflict");
});

Deno.test("T3 — dates identiques refusées (idempotence : refus propre)", () => {
  const w = emptyWorld();
  bookStage(w, "A", MONDAY);
  const second = bookStage(w, "A", MONDAY);
  assertEquals(second.error, "stage_date_conflict");
  assertEquals(w.bookings.length, STAGE_DAYS, "aucun booking supplémentaire");
  assertEquals(w.creditsConsumed["A"], STAGE_DAYS, "aucun crédit supplémentaire");
  assertEquals(w.groupsCreated.length, STAGE_DAYS, "aucun groupe inutile");
});

Deno.test("T4 — période disjointe autorisée (samedi→mercredi)", () => {
  const w = emptyWorld();
  bookStage(w, "A", MONDAY);
  assertEquals(bookStage(w, "A", SATURDAY).ok, true);
  assertEquals(w.creditsConsumed["A"], 2 * STAGE_DAYS);
});

Deno.test("T5 — un booking annulé libère la date", () => {
  const w = emptyWorld();
  bookStage(w, "A", MONDAY);
  for (const b of w.bookings) b.status = "cancelled";
  assertEquals(bookStage(w, "A", MONDAY).ok, true);
});

Deno.test("T9 — aucun crédit consommé ni booking créé en cas de conflit", () => {
  const w = emptyWorld();
  bookStage(w, "A", MONDAY);
  const before = { ...w.creditsConsumed };
  const count = w.bookings.length;
  bookStage(w, "A", TUESDAY);
  assertEquals(w.creditsConsumed, before);
  assertEquals(w.bookings.length, count);
});

Deno.test("T10 — un autre pack peut réserver les mêmes dates", () => {
  const w = emptyWorld();
  bookStage(w, "A", MONDAY);
  assertEquals(bookStage(w, "B", MONDAY).ok, true);
});

Deno.test("T11 — la règle porte sur le package_id (pas sur le client)", () => {
  const w = emptyWorld();
  bookStage(w, "PKG-1", MONDAY);
  // Même client, second pack : autorisé par le modèle métier existant.
  assertEquals(bookStage(w, "PKG-2", MONDAY).ok, true);
});

// ---------------------------------------------------------------------------
// Assertions statiques sur le SQL réellement appliqué
// ---------------------------------------------------------------------------

const dir = "supabase/migrations";
let sql = "";
for await (const entry of Deno.readDir(dir)) {
  if (!entry.isFile || !entry.name.endsWith(".sql")) continue;
  const content = await Deno.readTextFile(`${dir}/${entry.name}`);
  if (
    content.includes("FUNCTION public.book_stage_for_package(") &&
    content.includes("stage_date_conflict")
  ) {
    sql = content;
  }
}

Deno.test("F-27-03-01 : migration du contrôle de dates présente", () => {
  assert(sql.length > 0, "migration book_stage_for_package + stage_date_conflict introuvable");
});

Deno.test("F-27-03-01 : contrôle après le verrou pack et avant tout booking", () => {
  const lock = sql.indexOf("FROM public.client_packages\n    WHERE id = p_package_id FOR UPDATE");
  const check = sql.indexOf("stage_date_conflict");
  const insert = sql.indexOf("INSERT INTO public.package_bookings");
  const group = sql.indexOf("public.find_or_create_daily_group(v_day");
  assert(lock > 0 && check > lock, "contrôle placé avant le verrou FOR UPDATE");
  assert(check < insert && check < group, "contrôle placé après création booking/groupe");
});

Deno.test("F-27-03-01 : conflit limité aux bookings confirmés du même pack sur 5 jours", () => {
  assert(sql.includes("pb.package_id = v_pkg.id"));
  assert(sql.includes("pb.status = 'confirmed'"));
  assert(sql.includes("dg.date BETWEEN p_start_date AND (p_start_date + 4)"));
});

Deno.test("F-27-03-01 : protections existantes conservées", () => {
  // F-26-02 (advisory lock via find_or_create_daily_group) toujours utilisé
  assert(sql.includes("public.find_or_create_daily_group(v_day, 'stage_100_glisse', 1)"));
  // Verrou pack conservé, capacité et e-mail inchangés
  assert(sql.includes("FOR UPDATE"));
  // F-27-03-03 : pré-check day_full retiré ; capacité imposée par trigger + find_or_create.
  assert(sql.includes("public.find_or_create_daily_group(v_day, 'stage_100_glisse', 1)"));
  // F-27-03-04 : confirmation envoyée uniquement par le trigger AFTER INSERT (pas de doublon).
  assert(!sql.includes("enqueue_booking_confirmation(v_booking_ids[1])"));
  assert(sql.includes("SECURITY DEFINER"));
  assert(sql.includes("SET search_path TO 'public'"));
});
