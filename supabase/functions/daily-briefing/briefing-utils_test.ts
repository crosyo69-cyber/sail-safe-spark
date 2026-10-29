import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parisHour, parisYesterday } from "./briefing-utils.ts";

Deno.test("sends at 9h Paris: 08:00 UTC in winter, 07:00 UTC in summer", () => {
  assertEquals(parisHour(new Date("2026-11-03T08:00:00Z")), 9);
  assertEquals(parisHour(new Date("2026-07-03T07:00:00Z")), 9);
  assertEquals(parisHour(new Date("2026-11-03T07:00:00Z")), 8);
});

Deno.test("yesterday covers the full Paris day", () => {
  const y = parisYesterday(new Date("2026-11-03T08:00:00Z"));
  assertEquals(y.date, "2026-11-02");
  assertEquals(y.startIso, "2026-11-01T23:00:00.000Z");
  assertEquals(y.endIso, "2026-11-02T23:00:00.000Z");
  const s = parisYesterday(new Date("2026-07-03T07:00:00Z"));
  assertEquals(s.startIso, "2026-07-01T22:00:00.000Z");
});
