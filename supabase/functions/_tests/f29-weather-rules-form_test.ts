// F-29-05 — contrôles du formulaire « Règles météo » (logique pure, aucun réseau).
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { toDraft, validateDraft, type WeatherRuleDraft } from "../../../src/features/weather-rules/types.ts";

const d = (o: Partial<WeatherRuleDraft> = {}): WeatherRuleDraft => ({
  activity: "kitesurf", min_wind_kn: "12", max_wind_kn: "30", max_gust_kn: "35", enabled: true, reason: "ok", ...o,
});

Deno.test("égalité min = max acceptée", () => assert(validateDraft(d({ min_wind_kn: "30" })).ok));
Deno.test("négatif rejeté", () => assert(!validateDraft(d({ min_wind_kn: "-1" })).ok));
Deno.test("infini rejeté", () => assert(!validateDraft(d({ max_wind_kn: "Infinity" })).ok));
Deno.test("non numérique rejeté", () => assert(!validateDraft(d({ max_gust_kn: "abc" })).ok));
Deno.test("rafales obligatoires", () => assert(!validateDraft(d({ max_gust_kn: "" })).ok));
Deno.test("min > max rejeté", () => assert(!validateDraft(d({ min_wind_kn: "31" })).ok));
Deno.test("motif vide rejeté", () => assert(!validateDraft(d({ reason: "   " })).ok));
Deno.test("vide = non applicable (null), pas 0", () => {
  const v = validateDraft(d({ min_wind_kn: "", max_wind_kn: "" }));
  assert(v.ok); assertEquals(v.value.min_wind_kn, null); assertEquals(v.value.max_wind_kn, null);
});
Deno.test("0 reste 0, distinct de null", () => {
  const v = validateDraft(d({ min_wind_kn: "0" }));
  assert(v.ok); assertEquals(v.value.min_wind_kn, 0);
});
Deno.test("pumpfoil sans seuil de vent", () => {
  const p = toDraft({ activity: "pumpfoil", min_wind_kn: null, max_wind_kn: null, max_gust_kn: 5, enabled: true, updated_at: "", updated_by_email: null, change_reason: "" });
  assertEquals(p.min_wind_kn, ""); assertEquals(p.max_wind_kn, ""); assertEquals(p.max_gust_kn, "5");
});
Deno.test("aucun arrondi", () => {
  const v = validateDraft(d({ min_wind_kn: "12.5" }));
  assert(v.ok); assertEquals(v.value.min_wind_kn, 12.5);
});
