import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  resolveOrigin,
  ALLOWED_ORIGINS,
  DEFAULT_ORIGIN,
  getAllowedOrigins,
  parseAllowlist,
  assertSafeRedirectUrl,
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

// Mirror of the URL construction in index.ts. If index.ts changes its
// templates, update this helper accordingly.
function buildCheckoutUrls(rawOrigin: string | null | undefined, activity: string) {
  const origin = resolveOrigin(rawOrigin);
  return {
    success_url: `${origin}/reservation-confirmee?activity=${encodeURIComponent(activity)}`,
    cancel_url: `${origin}/contact-reservation-kitesurf-hyeres`,
  };
}

Deno.test("checkout URLs only use allowlisted origins (allowlisted input passes through)", () => {
  for (const allowed of ALLOWED_ORIGINS) {
    const { success_url, cancel_url } = buildCheckoutUrls(allowed, "Cours à la Carte");
    assert(success_url.startsWith(`${allowed}/reservation-confirmee`),
      `success_url must start with ${allowed}, got ${success_url}`);
    assert(cancel_url.startsWith(`${allowed}/contact-reservation-kitesurf-hyeres`),
      `cancel_url must start with ${allowed}, got ${cancel_url}`);
  }
});

Deno.test("checkout URLs fall back to DEFAULT_ORIGIN for non-allowlisted / attacker origins", () => {
  const bad = [
    "https://evil.com",
    "https://kitesurfpassion.fr.evil.com",
    "https://www.kitesurfpassion.fr.evil.com",
    "http://www.kitesurfpassion.fr",
    "https://www.kitesurfpassion.fr:8080",
    "javascript:alert(1)",
    "//evil.com",
    "",
    null,
    undefined,
  ];
  for (const origin of bad) {
    const { success_url, cancel_url } = buildCheckoutUrls(origin, "Stage Wingfoil");
    assert(
      success_url.startsWith(`${DEFAULT_ORIGIN}/reservation-confirmee`),
      `success_url must fall back to ${DEFAULT_ORIGIN} for origin=${JSON.stringify(origin)}, got ${success_url}`,
    );
    assert(
      cancel_url.startsWith(`${DEFAULT_ORIGIN}/contact-reservation-kitesurf-hyeres`),
      `cancel_url must fall back to ${DEFAULT_ORIGIN} for origin=${JSON.stringify(origin)}, got ${cancel_url}`,
    );
    // Defense in depth: the host must be an allowlisted one, never the attacker host.
    const successHost = new URL(success_url).origin;
    const cancelHost = new URL(cancel_url).origin;
    assert(ALLOWED_ORIGINS.has(successHost), `success_url host ${successHost} not in allowlist`);
    assert(ALLOWED_ORIGINS.has(cancelHost), `cancel_url host ${cancelHost} not in allowlist`);
  }
});

Deno.test("index.ts only assembles success_url/cancel_url from the resolved origin", async () => {
  const src = await Deno.readTextFile(new URL("./index.ts", import.meta.url));
  // Both URLs must be templated from `${origin}` — never from req headers,
  // request body, or any other variable.
  // success/cancel URLs must be built from a template that starts with
  // `${origin}` — either inlined or via an intermediate variable.
  assert(
    /`\$\{origin\}\/reservation-confirmee/.test(src),
    "success_url template must start with `${origin}/reservation-confirmee`",
  );
  assert(
    /`\$\{origin\}\/contact-reservation-kitesurf-hyeres`/.test(src),
    "cancel_url template must be `${origin}/contact-reservation-kitesurf-hyeres`",
  );
  // And `origin` must come from resolveOrigin(...) (directly or via an
  // injectable resolver that defaults to resolveOrigin) — never from raw input.
  assert(
    /const\s+origin\s*=\s*(resolveOrigin|originResolver)\(/.test(src),
    "origin must be assigned from resolveOrigin(...) or originResolver(...)",
  );
  assert(
    !/originResolver/.test(src) ||
      /=>\s*resolveOrigin\(raw\)/.test(src),
    "originResolver default must delegate to resolveOrigin(raw)",
  );
});

Deno.test("assertSafeRedirectUrl: accepts allowlisted https URLs with paths/queries", () => {
  for (const origin of ALLOWED_ORIGINS) {
    assertSafeRedirectUrl(`${origin}/reservation-confirmee?activity=Stage%20Wingfoil`);
    assertSafeRedirectUrl(`${origin}/contact-reservation-kitesurf-hyeres`);
    assertSafeRedirectUrl(`${origin}/`);
  }
});

Deno.test("assertSafeRedirectUrl: rejects wrong scheme, port, userinfo, casing, non-allowlisted host", () => {
  const bad = [
    // wrong scheme
    "http://www.kitesurfpassion.fr/x",
    "ftp://www.kitesurfpassion.fr/x",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    // protocol-relative
    "//www.kitesurfpassion.fr/x",
    // explicit port (even default 443)
    "https://www.kitesurfpassion.fr:443/x",
    "https://www.kitesurfpassion.fr:8080/x",
    // upper-case host
    "https://WWW.kitesurfpassion.fr/x",
    "https://www.KITESURFPASSION.fr/x",
    // userinfo smuggling
    "https://user@www.kitesurfpassion.fr/x",
    "https://user:pass@www.kitesurfpassion.fr/x",
    "https://www.kitesurfpassion.fr@evil.com/x",
    // attacker hosts
    "https://evil.com/x",
    "https://kitesurfpassion.fr.evil.com/x",
    "https://www.kitesurfpassion.fr.evil.com/x",
    // garbage
    "",
    "not-a-url",
    "https://",
  ];
  for (const url of bad) {
    let threw = false;
    try {
      assertSafeRedirectUrl(url);
    } catch (e) {
      threw = true;
      assertEquals((e as Error).message, "Invalid redirect origin");
    }
    assert(threw, `assertSafeRedirectUrl should have rejected ${JSON.stringify(url)}`);
  }
});

Deno.test("assertSafeRedirectUrl: rejects oversized URLs", () => {
  const huge = `${DEFAULT_ORIGIN}/x?a=${"a".repeat(3000)}`;
  let threw = false;
  try {
    assertSafeRedirectUrl(huge);
  } catch {
    threw = true;
  }
  assert(threw, "assertSafeRedirectUrl should reject URLs > 2048 chars");
});