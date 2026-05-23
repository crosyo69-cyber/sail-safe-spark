import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resolveOrigin, ALLOWED_ORIGINS, DEFAULT_ORIGIN } from "./origin.ts";

Deno.test("resolveOrigin: accepts each allowlisted production domain as-is", () => {
  for (const allowed of ALLOWED_ORIGINS) {
    assertEquals(resolveOrigin(allowed), allowed);
  }
});

Deno.test("resolveOrigin: falls back to default for attacker-controlled origins", () => {
  const malicious = [
    "https://evil.com",
    "https://kitesurfpassion.fr.evil.com",
    "https://evil.com/kitesurfpassion.fr",
    "https://www.kitesurfpassion.fr.evil.com",
    "http://www.kitesurfpassion.fr", // http (not https) must not pass
    "https://www.kitesurfpassion.fr:8080", // different port
    "https://www.kitesurfpassion.fr/", // trailing slash
    "javascript:alert(1)",
    "//evil.com",
    "",
    null,
    undefined,
  ];
  for (const bad of malicious) {
    const resolved = resolveOrigin(bad as string | null | undefined);
    assertEquals(
      resolved,
      DEFAULT_ORIGIN,
      `Expected fallback for origin=${JSON.stringify(bad)}, got ${resolved}`,
    );
    assert(
      ALLOWED_ORIGINS.has(resolved),
      `Resolved origin must always be in the allowlist (got ${resolved})`,
    );
  }
});

Deno.test("resolveOrigin: case-sensitive — does not accept upper-case variants", () => {
  assertEquals(
    resolveOrigin("HTTPS://WWW.KITESURFPASSION.FR"),
    DEFAULT_ORIGIN,
  );
});

Deno.test("resolveOrigin: default fallback is itself in the allowlist", () => {
  assert(ALLOWED_ORIGINS.has(DEFAULT_ORIGIN));
});