/**
 * F-26-02 — Vérification statique du verrou de concurrence de
 * `public.find_or_create_daily_group`.
 *
 * Lecture seule : on analyse la migration appliquée, sans exécuter de SQL,
 * sans créer de réservation ni de groupe.
 */
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const dir = "supabase/migrations";
let sql = "";
for await (const entry of Deno.readDir(dir)) {
  if (!entry.isFile || !entry.name.endsWith(".sql")) continue;
  const content = await Deno.readTextFile(`${dir}/${entry.name}`);
  if (content.includes("pg_advisory_xact_lock") && content.includes("find_or_create_daily_group")) {
    sql = content;
  }
}

Deno.test("F-26-02: migration du verrou présente", () => {
  assert(sql.length > 0, "migration find_or_create_daily_group + advisory lock introuvable");
});

Deno.test("F-26-02: verrou transactionnel déterministe par date + activité", () => {
  assert(sql.includes("pg_advisory_xact_lock"));
  assert(!sql.includes("pg_advisory_lock("), "verrou de session interdit");
  assert(sql.includes("p_date::text"));
  assert(sql.includes("p_activity::text"));
});

Deno.test("F-26-02: verrou acquis avant lecture, calcul d'index et INSERT", () => {
  const lock = sql.indexOf("pg_advisory_xact_lock");
  const read = sql.indexOf("FOR v_group IN");
  const maxIdx = sql.indexOf("MAX(group_index)");
  const insert = sql.indexOf("INSERT INTO public.daily_groups");
  assert(lock > 0 && lock < read && lock < maxIdx && lock < insert);
});

Deno.test("F-26-02: invariants métier préservés", () => {
  // capacité inchangée (default_max_participants), pas de LOCK TABLE
  assert(sql.includes("public.default_max_participants(p_activity)"));
  assert(!/LOCK\s+TABLE/i.test(sql));
  assert(sql.includes("SECURITY DEFINER"));
  assert(sql.includes("SET search_path TO 'public'"));
  assert(sql.includes("RAISE EXCEPTION 'date_in_past'"));
});
