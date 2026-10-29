import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { aiTextIsSafe, buildFacts, fallbackSummary, type FactsInput } from "./facts.ts";

const base: FactsInput = {
  day: "2026-10-28",
  stripe: { ok: true, count: 0, gross: 0, refunded: 0, truncated: false },
  reservations: [], packs: 0,
  notifs: { count: 304, oldest: "2026-07-01T10:00:00Z", newest: "2026-10-20T10:00:00Z", sample: [] },
  actions: [], waitlist: 0, groupsToday: 0,
};

Deno.test("0 réservation + alertes anciennes : alertes en stock, jamais comme réservations", () => {
  const f = buildFacts(base);
  assertEquals((f.pendant_la_periode.reservations as { nouvelles: number }).nouvelles, 0);
  assertEquals((f.stock_actuel_ne_decrit_pas_la_veille.alertes_non_lues as { nombre: number }).nombre, 304);
  assert(!JSON.stringify(f.pendant_la_periode).includes("alerte"));
  assert(!aiTextIsSafe("Des alertes signalent de nouvelles réservations en kitesurf.", f));
  assert(!aiTextIsSafe("Vous avez 304 réservations à traiter.", f));
  assert(!aiTextIsSafe("Hier : 0 réservation. Mais 3 nouvelles réservations kitesurf apparaissent.", f));
  assert(aiTextIsSafe("Hier : 0 réservation et 0 paiement. 304 alertes non lues restent en stock.", f));
  assert(fallbackSummary(f).includes("0 réservation(s)"));
});

Deno.test("réservations récentes + alertes historiques : comptes séparés", () => {
  const f = buildFacts({ ...base, reservations: [{ participants: 2, status: "confirmed" }, { participants: 1, status: "cancelled" }] });
  const r = f.pendant_la_periode.reservations as { nouvelles: number; participants: number; annulees: number };
  assertEquals([r.nouvelles, r.participants, r.annulees], [2, 2, 1]);
  assert(aiTextIsSafe("Hier : 2 réservations, dont une annulée. 304 alertes non lues en stock.", f));
});

Deno.test("aucune alerte non lue", () => {
  const f = buildFacts({ ...base, notifs: { count: 0, oldest: null, newest: null, sample: [] } });
  assertEquals((f.stock_actuel_ne_decrit_pas_la_veille.alertes_non_lues as { nombre: number }).nombre, 0);
  assert(fallbackSummary(f).includes("0 alerte(s)"));
});

Deno.test("données indisponibles : dites indisponibles, jamais estimées", () => {
  const f = buildFacts({ ...base, stripe: { ok: false, error: "x" }, reservations: null, packs: null, notifs: null, waitlist: null });
  assertEquals(f.pendant_la_periode.reservations, "indisponible");
  assertEquals(f.pendant_la_periode.ventes_stripe, "indisponible");
  assertEquals(f.stock_actuel_ne_decrit_pas_la_veille.alertes_non_lues, "indisponible");
  assert(!aiTextIsSafe("Hier : 3 réservations.", f));
  assert(aiTextIsSafe("Les réservations de la veille sont indisponibles.", f));
  assert(fallbackSummary(f).includes("Réservations : indisponibles."));
});
