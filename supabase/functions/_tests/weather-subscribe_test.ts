// F-22-HARDENING — tests unitaires des garde-fous d'inscription météo.
// Aucun appel réseau, aucun e-mail réel.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { clampWind, isValidEmail, normalizeEmail } from "../weather-subscribe/index.ts";

Deno.test("normalizeEmail — trim + lowercase (F-22-05)", () => {
  assertEquals(normalizeEmail("  Rider@Example.COM "), "rider@example.com");
  assertEquals(normalizeEmail("rider@example.com"), "rider@example.com");
  assertEquals(normalizeEmail(undefined), "");
});

Deno.test("normalizeEmail — casse et espaces donnent la même identité", () => {
  assertEquals(normalizeEmail("A@B.fr"), normalizeEmail(" a@b.fr "));
});

Deno.test("isValidEmail — rejette les valeurs invalides", () => {
  assertEquals(isValidEmail("rider@example.com"), true);
  assertEquals(isValidEmail("rider@example"), false);
  assertEquals(isValidEmail(""), false);
  assertEquals(isValidEmail("a".repeat(255) + "@b.fr"), false);
});

Deno.test("clampWind — borne et réordonne la plage", () => {
  assertEquals(clampWind(10, 30), { min: 10, max: 30 });
  assertEquals(clampWind(35, 12), { min: 12, max: 35 });
  assertEquals(clampWind(-5, 900), { min: 0, max: 60 });
  assertEquals(clampWind("abc", "xyz"), { min: 10, max: 30 });
});
