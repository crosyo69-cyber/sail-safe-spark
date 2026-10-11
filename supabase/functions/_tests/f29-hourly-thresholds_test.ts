import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { evaluateHourThresholds } from "../../../src/features/weather-rules/hourly-thresholds.ts";
import type { WeatherRule } from "../../../src/features/weather-rules/types.ts";
const rule: WeatherRule = { activity: "kitesurf", min_wind_kn: 12, max_wind_kn: 30, max_gust_kn: 35, enabled: true, updated_at: "", updated_by_email: null, change_reason: "" };
const hour = (wind_kn: number | null, gust_kn: number | null = 35) => ({ time: "2026-10-12T10:00", wind_kn, gust_kn, direction_deg: null });
Deno.test("F29-06 inclusive boundaries", () => {
  for (const wind of [12, 30]) assertEquals(evaluateHourThresholds(hour(wind), "fresh", rule).kind, "within");
});
Deno.test("F29-06 no rounding and multiple reasons", () => {
  for (const h of [hour(11.99), hour(30.01), hour(20, 35.01)]) assertEquals(evaluateHourThresholds(h, "fresh", rule).kind, "outside");
  assertEquals(evaluateHourThresholds(hour(31, 36), "fresh", rule).reasons.length, 2);
});
Deno.test("F29-06 stale incomplete unavailable indeterminate", () => {
  for (const state of ["stale", "incomplete", "unavailable"] as const) assertEquals(evaluateHourThresholds(hour(20), state, rule).kind, "unknown");
});
Deno.test("F29-06 missing or invalid data indeterminate", () => {
  for (const h of [hour(null), hour(20, null), hour(NaN), hour(Infinity), hour(-1)]) assertEquals(evaluateHourThresholds(h, "fresh", rule).kind, "unknown");
});
Deno.test("F29-06 absent disabled invalid rules", () => {
  assertEquals(evaluateHourThresholds(hour(20), "fresh").kind, "unknown");
  assertEquals(evaluateHourThresholds(hour(20), "fresh", { ...rule, enabled: false }).kind, "disabled");
  assertEquals(evaluateHourThresholds(hour(20), "fresh", { ...rule, min_wind_kn: 40 }).kind, "unknown");
});
Deno.test("F29-06 pumpfoil nullable wind and gust boundary", () => {
  const pump = { ...rule, activity: "pumpfoil" as const, min_wind_kn: null, max_wind_kn: null, max_gust_kn: 5 };
  assertEquals(evaluateHourThresholds(hour(null, 5), "fresh", pump).kind, "within");
  assertEquals(evaluateHourThresholds(hour(null, 5.01), "fresh", pump).kind, "outside");
});
Deno.test("F29-06 foil and wingfoil limits", () => {
  const foil = { ...rule, activity: "foil_tracte" as const, min_wind_kn: null, max_wind_kn: 5, max_gust_kn: 5 };
  assertEquals(evaluateHourThresholds(hour(0, 5), "fresh", foil).kind, "within");
  assertEquals(evaluateHourThresholds(hour(5.01, 5), "fresh", foil).kind, "outside");
  assertEquals(evaluateHourThresholds(hour(10), "fresh", { ...rule, activity: "wingfoil", min_wind_kn: 10 }).kind, "within");
});