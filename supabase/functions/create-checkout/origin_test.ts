import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  resolveOrigin,
  ALLOWED_ORIGINS,
  DEFAULT_ORIGIN,
  getAllowedOrigins,
  parseAllowlist,
} from "./origin.ts";

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

Deno.test("parseAllowlist: splits comma/whitespace separated origins", () => {
  const set = parseAllowlist(
    "https://a.example.com, https://b.example.com\nhttps://c.example.com",
  );
  assertEquals(set.size, 3);
  assert(set.has("https://a.example.com"));
  assert(set.has("https://b.example.com"));
  assert(set.has("https://c.example.com"));
});

Deno.test("parseAllowlist: empty / null returns empty set", () => {
  assertEquals(parseAllowlist("").size, 0);
  assertEquals(parseAllowlist(null).size, 0);
  assertEquals(parseAllowlist(undefined).size, 0);
  assertEquals(parseAllowlist("   ").size, 0);
});

Deno.test("ALLOWLIST_DOMAINS env var overrides built-in allowlist", () => {
  const prev = Deno.env.get("ALLOWLIST_DOMAINS");
  try {
    Deno.env.set(
      "ALLOWLIST_DOMAINS",
      "https://staging.kitesurfpassion.fr,https://preview.kitesurfpassion.fr",
    );
    const allowed = getAllowedOrigins();
    assertEquals(allowed.size, 2);
    assert(allowed.has("https://staging.kitesurfpassion.fr"));
    assert(allowed.has("https://preview.kitesurfpassion.fr"));

    // resolveOrigin honors the env-configured allowlist
    assertEquals(
      resolveOrigin("https://staging.kitesurfpassion.fr"),
      "https://staging.kitesurfpassion.fr",
    );
    // and rejects the previously hard-coded production domain
    assertEquals(
      resolveOrigin("https://www.kitesurfpassion.com"),
      "https://staging.kitesurfpassion.fr",
    );
  } finally {
    if (prev === undefined) Deno.env.delete("ALLOWLIST_DOMAINS");
    else Deno.env.set("ALLOWLIST_DOMAINS", prev);
  }
});

Deno.test("ALLOWLIST_DOMAINS unset falls back to built-in production domains", () => {
  const prev = Deno.env.get("ALLOWLIST_DOMAINS");
  try {
    Deno.env.delete("ALLOWLIST_DOMAINS");
    const allowed = getAllowedOrigins();
    assert(allowed.has("https://www.kitesurfpassion.fr"));
    assert(allowed.has("https://kitesurfpassion.fr"));
    assert(allowed.has("https://www.kitesurfpassion.com"));
    assert(allowed.has("https://kitesurfpassion.com"));
    assertEquals(
      resolveOrigin("https://www.kitesurfpassion.fr"),
      "https://www.kitesurfpassion.fr",
    );
    assertEquals(resolveOrigin("https://evil.com"), DEFAULT_ORIGIN);
  } finally {
    if (prev !== undefined) Deno.env.set("ALLOWLIST_DOMAINS", prev);
  }
});