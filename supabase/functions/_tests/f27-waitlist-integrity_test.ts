/**
 * F-27-02 — Waitlist integrity (P2 F-27-02-01 + F-27-02-02).
 *
 * Deux niveaux de preuve :
 *  1. Un modèle TypeScript qui reproduit exactement les règles métier
 *     implémentées en SQL (éligibilité, bornes participants, offre alignée
 *     sur les places libérées, conversion sans création de groupe).
 *  2. Des assertions statiques sur la migration SQL appliquée, pour garantir
 *     que le SQL réel respecte les invariants critiques (pas de
 *     find_or_create_daily_group dans confirm_waitlist_offer, advisory lock
 *     F-26-02 conservé, FOR UPDATE conservés).
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// ---------------------------------------------------------------------------
// Modèle métier (miroir du SQL)
// ---------------------------------------------------------------------------

const CAPACITY: Record<string, number> = {
  kitesurf: 4,
  wingfoil: 3,
  pumpfoil: 4,
  foil_tracte: 4,
  stage_100_glisse: 4,
};

type Group = { id: string; max: number; taken: number; status: "open" | "cancelled" };

function defaultMaxParticipants(activity: string): number | null {
  return CAPACITY[activity] ?? null;
}

/** public.waitlist_free_seats(date, activity, include_potential) */
function freeSeats(groups: Group[], activity: string, includePotential: boolean): number {
  const open = groups.filter((g) => g.status === "open");
  if (includePotential && open.length === 0) return defaultMaxParticipants(activity) ?? 0;
  return Math.max(open.reduce((s, g) => s + (g.max - g.taken), 0), 0);
}

/** public.join_waitlist(...) — partie métier (hors rate limit / e-mail). */
function joinWaitlist(
  groups: Group[],
  activity: string,
  participants: unknown,
): { ok: boolean; error?: string } {
  const cap = defaultMaxParticipants(activity);
  if (cap === null || cap < 1) return { ok: false, error: "invalid_request" };
  if (typeof participants !== "number" || !Number.isInteger(participants)) {
    return { ok: false, error: "invalid_participants" };
  }
  if (participants < 1 || participants > cap) return { ok: false, error: "invalid_participants" };
  if (freeSeats(groups, activity, true) >= participants) return { ok: false, error: "not_eligible" };
  return { ok: true };
}

/** public.offer_waitlist_spot(date, activity) — sélection FIFO. */
function offerSpot(
  groups: Group[],
  activity: string,
  waiting: { email: string; participants: number }[],
): { offeredTo: string | null; reason?: string } {
  const free = freeSeats(groups, activity, false);
  if (free < 1) return { offeredTo: null, reason: "no_spot" };
  const cand = waiting[0];
  if (!cand) return { offeredTo: null, reason: "empty" };
  if (Math.max(cand.participants, 1) > free) {
    return { offeredTo: null, reason: "insufficient_seats" };
  }
  return { offeredTo: cand.email };
}

/** public.confirm_waitlist_offer(token) — sélection d'un groupe EXISTANT. */
function confirmOffer(
  groups: Group[],
  seatsRequested: number,
): { ok: boolean; error?: string; groupId?: string; groupCreated: boolean } {
  const seats = Math.max(seatsRequested, 1);
  const target = groups
    .filter((g) => g.status === "open")
    .find((g) => g.taken + seats <= g.max);
  if (!target) return { ok: false, error: "no_capacity", groupCreated: false };
  target.taken += seats; // trigger enforce_daily_group_capacity respecté par construction
  return { ok: true, groupId: target.id, groupCreated: false };
}

const kite = (taken: number): Group[] => [{ id: "g1", max: 4, taken, status: "open" }];
const wing = (taken: number): Group[] => [{ id: "g1", max: 3, taken, status: "open" }];

// ---------------------------------------------------------------------------
// TESTS 1-5 — alignement offre / places libérées
// ---------------------------------------------------------------------------

Deno.test("F-27-02 T1 — cap4 occupé3 libre1, demande 1 : offre autorisée", () => {
  assertEquals(offerSpot(kite(3), "kitesurf", [{ email: "a@b.c", participants: 1 }]).offeredTo, "a@b.c");
});

Deno.test("F-27-02 T2 — cap4 occupé3 libre1, demande 2 : aucune offre", () => {
  const r = offerSpot(kite(3), "kitesurf", [{ email: "a@b.c", participants: 2 }]);
  assertEquals(r.offeredTo, null);
  assertEquals(r.reason, "insufficient_seats");
});

Deno.test("F-27-02 T3 — cap4 occupé3 libre1, demande 4 : aucune offre", () => {
  assertEquals(offerSpot(kite(3), "kitesurf", [{ email: "a@b.c", participants: 4 }]).offeredTo, null);
});

Deno.test("F-27-02 T4 — cap4 occupé0 libre4, demande 4 : offre + conversion possibles", () => {
  const groups = kite(0);
  assertEquals(offerSpot(groups, "kitesurf", [{ email: "a@b.c", participants: 4 }]).offeredTo, "a@b.c");
  const c = confirmOffer(groups, 4);
  assert(c.ok);
  assertEquals(c.groupCreated, false);
  assertEquals(groups.length, 1);
});

Deno.test("F-27-02 T5 — wingfoil cap3 occupé2 libre1, demande 3 : aucune offre", () => {
  assertEquals(offerSpot(wing(2), "wingfoil", [{ email: "a@b.c", participants: 3 }]).offeredTo, null);
});

// ---------------------------------------------------------------------------
// TESTS 6-9 — trust boundary p_participants (join_waitlist)
// ---------------------------------------------------------------------------

Deno.test("F-27-02 T6 — participants = 0 rejeté", () => {
  assertEquals(joinWaitlist(kite(4), "kitesurf", 0).error, "invalid_participants");
});

Deno.test("F-27-02 T7 — participants négatif rejeté", () => {
  assertEquals(joinWaitlist(kite(4), "kitesurf", -3).error, "invalid_participants");
});

Deno.test("F-27-02 T8 — participants > capacité activité rejeté", () => {
  for (const n of [5, 100, 999999]) {
    assertEquals(joinWaitlist(kite(4), "kitesurf", n).error, "invalid_participants", `n=${n}`);
  }
  assertEquals(joinWaitlist(wing(3), "wingfoil", 4).error, "invalid_participants");
  assertEquals(joinWaitlist(wing(3), "wingfoil", 3).ok, true);
});

Deno.test("F-27-02 T9 — activité inconnue rejetée", () => {
  assertEquals(joinWaitlist([], "surf_hydrofoil_xyz", 1).error, "invalid_request");
});

Deno.test("F-27-02 T9b — valeurs non entières rejetées", () => {
  for (const v of [2.5, null, undefined, "3", true, {}]) {
    assertEquals(joinWaitlist(kite(4), "kitesurf", v).error, "invalid_participants");
  }
});

// ---------------------------------------------------------------------------
// F-27-02-01 — pas de waitlist gratuite sur une journée non complète
// ---------------------------------------------------------------------------

Deno.test("F-27-02-01 — inscription refusée quand la journée a assez de places", () => {
  assertEquals(joinWaitlist(kite(0), "kitesurf", 4).error, "not_eligible");
  assertEquals(joinWaitlist(kite(3), "kitesurf", 1).error, "not_eligible");
  // aucun groupe encore créé : capacité potentielle du parcours payant
  assertEquals(joinWaitlist([], "kitesurf", 2).error, "not_eligible");
  assertEquals(joinWaitlist([], "wingfoil", 3).error, "not_eligible");
});

Deno.test("F-27-02-01 — inscription autorisée uniquement si capacité insuffisante", () => {
  assertEquals(joinWaitlist(kite(4), "kitesurf", 1).ok, true);
  assertEquals(joinWaitlist(kite(3), "kitesurf", 2).ok, true);
  assertEquals(joinWaitlist(wing(2), "wingfoil", 2).ok, true);
});

// ---------------------------------------------------------------------------
// TESTS 10-12 — conversion
// ---------------------------------------------------------------------------

Deno.test("F-27-02 T10 — conversion refusée si capacité insuffisante, sans réservation", () => {
  const groups = kite(3);
  const r = confirmOffer(groups, 4);
  assertEquals(r.ok, false);
  assertEquals(r.error, "no_capacity");
  assertEquals(groups.length, 1);
  assertEquals(groups[0].taken, 3);
});

Deno.test("F-27-02 T11 — conversion nécessitant un nouveau groupe : refus", () => {
  const groups: Group[] = [{ id: "g1", max: 4, taken: 4, status: "open" }];
  const r = confirmOffer(groups, 4);
  assertEquals(r.ok, false);
  assertEquals(r.groupCreated, false);
  assertEquals(groups.length, 1, "aucun groupe créé par le chemin waitlist");
});

Deno.test("F-27-02 T12 — double confirmation : une seule conversion", () => {
  const groups = kite(3);
  let status = "offered";
  const run = () => {
    if (status === "converted") return { already: true, created: false };
    const r = confirmOffer(groups, 1);
    if (r.ok) status = "converted";
    return { already: false, created: r.groupCreated };
  };
  const a = run();
  const b = run();
  assertEquals(a.already, false);
  assertEquals(b.already, true);
  assertEquals(groups[0].taken, 4, "une seule place consommée");
});

// ---------------------------------------------------------------------------
// TESTS 13-14 — invariants statiques sur le SQL réellement appliqué
// ---------------------------------------------------------------------------

const MIGRATION = "supabase/migrations/20260915075758_ba40cd84-1a43-4d0a-a992-5b7445de6aca.sql";

function section(sql: string, fn: string): string {
  const start = sql.indexOf(`FUNCTION public.${fn}(`);
  assert(start > -1, `${fn} absente de la migration`);
  const end = sql.indexOf("$function$;", start);
  assert(end > start, `corps de ${fn} introuvable`);
  return sql.slice(start, end);
}

Deno.test("F-27-02 T13 — aucun chemin waitlist ne crée de daily_group", async () => {
  const sql = await Deno.readTextFile(MIGRATION);
  const confirm = section(sql, "confirm_waitlist_offer");
  assert(
    !confirm.includes("find_or_create_daily_group("),
    "confirm_waitlist_offer ne doit plus appeler find_or_create_daily_group",
  );
  assert(
    !/INSERT\s+INTO\s+public\.daily_groups/i.test(confirm),
    "confirm_waitlist_offer ne doit jamais insérer de daily_group",
  );
  const offer = section(sql, "offer_waitlist_spot");
  assert(!offer.includes("find_or_create_daily_group("));
  assert(!/INSERT\s+INTO\s+public\.daily_groups/i.test(offer));
  const join = section(sql, "join_waitlist");
  assert(!/INSERT\s+INTO\s+public\.daily_groups/i.test(join));
});

Deno.test("F-27-02 T14 — protections conservées (F-26-02, verrous, capacité)", async () => {
  const sql = await Deno.readTextFile(MIGRATION);
  const confirm = section(sql, "confirm_waitlist_offer");
  assert(
    confirm.includes("pg_advisory_xact_lock") &&
      confirm.includes("public.find_or_create_daily_group:"),
    "la clé de verrou F-26-02 doit être réutilisée",
  );
  assert(confirm.includes("FOR UPDATE"), "verrouillage de ligne conservé");
  assert(confirm.includes("'converted'"), "idempotence conservée");
  assert(confirm.includes("offer_expires_at < now()"), "TTL conservé");
  assert(confirm.includes("resolve_link_token"), "token haché conservé");
  assert(confirm.includes("public_rate_guard"), "rate limit conservé");
  // Le SQL ne touche pas find_or_create_daily_group elle-même (F-26-02 intacte)
  assert(
    !sql.includes("FUNCTION public.find_or_create_daily_group("),
    "find_or_create_daily_group ne doit pas être redéfinie par ce lot",
  );
  // Bornes serveur présentes dans join_waitlist
  const join = section(sql, "join_waitlist");
  assert(join.includes("default_max_participants"), "borne haute serveur présente");
  assert(join.includes("not_eligible"), "règle d'éligibilité présente");
  // Offre alignée sur les places libérées
  const offer = section(sql, "offer_waitlist_spot");
  assert(offer.includes("waitlist_free_seats"), "offre basée sur les places réelles");
  assert(offer.includes("> v_free"), "offre refusée si demande > places libérées");
});
