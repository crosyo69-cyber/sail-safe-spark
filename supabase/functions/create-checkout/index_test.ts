import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler, type CheckoutClient } from "./index.ts";
import { ALLOWED_ORIGINS, DEFAULT_ORIGIN } from "./origin.ts";

interface CapturedCall {
  success_url: string;
  cancel_url: string;
}

function makeFakeStripe(captured: CapturedCall[], opts?: { sessionUrl?: string }) {
  const factory = (): CheckoutClient => ({
    checkout: {
      sessions: {
        create(params) {
          captured.push({
            success_url: String(params.success_url),
            cancel_url: String(params.cancel_url),
          });
          return Promise.resolve({
            url: opts?.sessionUrl ?? "https://checkout.stripe.com/c/pay/test_session",
          });
        },
      },
    },
  });
  return factory;
}

function makeRequest(origin: string | null, body: Record<string, unknown> = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin !== null) headers["origin"] = origin;
  return new Request("https://example.com/create-checkout", {
    method: "POST",
    headers,
    body: JSON.stringify({
      activityName: "Cours à la Carte",
      participants: 1,
      preferredDate: "2026-07-01",
      phone: "0612345678",
      customerName: "Jean Test",
      totalSessions: 1,
      ...body,
    }),
  });
}

function assertAllowlistedUrl(url: string) {
  const host = new URL(url).origin;
  assert(
    ALLOWED_ORIGINS.has(host),
    `Redirect URL host ${host} is NOT in the allowlist: ${url}`,
  );
}

Deno.test("create-checkout: allowlisted Origin header is used verbatim in Stripe URLs", async () => {
  const captured: CapturedCall[] = [];
  const handler = createHandler(makeFakeStripe(captured));

  for (const allowed of ALLOWED_ORIGINS) {
    captured.length = 0;
    const res = await handler(makeRequest(allowed));
    await res.text();
    assertEquals(res.status, 200, `Expected 200 for ${allowed}`);
    assertEquals(captured.length, 1);
    const { success_url, cancel_url } = captured[0];
    assert(
      success_url.startsWith(`${allowed}/reservation-confirmee`),
      `success_url should start with ${allowed}, got ${success_url}`,
    );
    assert(
      cancel_url.startsWith(`${allowed}/contact-reservation-kitesurf-hyeres`),
      `cancel_url should start with ${allowed}, got ${cancel_url}`,
    );
    assertAllowlistedUrl(success_url);
    assertAllowlistedUrl(cancel_url);
  }
});

Deno.test("create-checkout: attacker Origin header → Stripe URLs fall back to DEFAULT_ORIGIN", async () => {
  const attackers: Array<string | null> = [
    "https://evil.com",
    "https://kitesurfpassion.fr.evil.com",
    "https://www.kitesurfpassion.fr.evil.com",
    "http://www.kitesurfpassion.fr", // wrong scheme
    "https://www.kitesurfpassion.fr:8080", // wrong port
    "https://WWW.KITESURFPASSION.FR", // wrong case
    "javascript:alert(1)",
    "//evil.com",
    "",
    null,
  ];

  for (const origin of attackers) {
    const captured: CapturedCall[] = [];
    const handler = createHandler(makeFakeStripe(captured));
    const res = await handler(makeRequest(origin));
    await res.text();

    assertEquals(res.status, 200, `Expected 200 for origin=${JSON.stringify(origin)}`);
    assertEquals(captured.length, 1);
    const { success_url, cancel_url } = captured[0];

    // Hard fail if the handler ever forwards an attacker host to Stripe.
    assertAllowlistedUrl(success_url);
    assertAllowlistedUrl(cancel_url);

    assert(
      success_url.startsWith(`${DEFAULT_ORIGIN}/reservation-confirmee`),
      `For origin=${JSON.stringify(origin)}, success_url must fall back to ${DEFAULT_ORIGIN}, got ${success_url}`,
    );
    assert(
      cancel_url.startsWith(`${DEFAULT_ORIGIN}/contact-reservation-kitesurf-hyeres`),
      `For origin=${JSON.stringify(origin)}, cancel_url must fall back to ${DEFAULT_ORIGIN}, got ${cancel_url}`,
    );
  }
});

Deno.test("create-checkout: defense-in-depth — rejects if Stripe would receive non-allowlisted URLs", async () => {
  // Simulate a regression where Stripe somehow gets a non-allowlisted URL.
  // We can't break resolveOrigin from here, but we CAN prove the defense
  // catches a hostile URL by capturing the Stripe call and asserting that
  // ANY call whose host is outside the allowlist fails the test.
  const captured: CapturedCall[] = [];
  const handler = createHandler(makeFakeStripe(captured));

  const res = await handler(makeRequest("https://attacker.test"));
  await res.text();

  // Handler must have either: (a) returned non-2xx without calling Stripe,
  // or (b) called Stripe with allowlisted URLs only. Anything else is a bug.
  if (captured.length > 0) {
    for (const call of captured) {
      assertAllowlistedUrl(call.success_url);
      assertAllowlistedUrl(call.cancel_url);
    }
  }
});

Deno.test("create-checkout: returns 400 and does NOT call Stripe when resolved origin is not allowlisted", async () => {
  // Simulate a regression where resolveOrigin returns an attacker-controlled
  // origin. The defense-in-depth guard MUST short-circuit before Stripe.
  const attackerOrigins = [
    "https://evil.com",
    "https://kitesurfpassion.fr.evil.com",
    "http://www.kitesurfpassion.fr",
    "https://www.kitesurfpassion.fr:8080",
    "not-a-url",
    "",
  ];

  for (const malicious of attackerOrigins) {
    const captured: CapturedCall[] = [];
    let stripeFactoryCalls = 0;
    const factory = () => {
      stripeFactoryCalls++;
      return makeFakeStripe(captured)();
    };
    const handler = createHandler(factory, () => malicious);

    const res = await handler(makeRequest("https://www.kitesurfpassion.fr"));
    const body = await res.json();

    assertEquals(
      res.status,
      400,
      `Expected 400 for malicious resolved origin=${JSON.stringify(malicious)}, got ${res.status}`,
    );
    assertEquals(
      body.error,
      "Invalid redirect origin",
      `Expected 'Invalid redirect origin' error, got ${JSON.stringify(body)}`,
    );
    assertEquals(
      captured.length,
      0,
      `Stripe.checkout.sessions.create MUST NOT be called for malicious origin=${JSON.stringify(malicious)}`,
    );
    assertEquals(
      stripeFactoryCalls,
      0,
      `Stripe client factory MUST NOT be invoked for malicious origin=${JSON.stringify(malicious)}`,
    );
  }
});