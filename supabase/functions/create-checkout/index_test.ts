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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // P0-1: every checkout call must carry an Idempotency-Key.
    "Idempotency-Key": crypto.randomUUID(),
  };
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

type RateGuardResult = { data: boolean | null; error: { message?: string } | null };
type CapacityResult = { data: number | null; error: { message?: string } | null };

// F-27-01 : miroir de public.default_max_participants(activity_type).
const CAPACITY_BY_ACTIVITY: Record<string, number> = {
  kitesurf: 4,
  wingfoil: 3,
  pumpfoil: 4,
  foil_tracte: 4,
  stage_100_glisse: 4,
};

// deno-lint-ignore no-explicit-any
type RateGuardMock = { rpc: (functionName: any, args: any) => Promise<any> };

const allowRateGuard = (): RateGuardMock => ({
  // deno-lint-ignore no-explicit-any
  rpc: async (functionName: string, args: any): Promise<RateGuardResult | CapacityResult> => {
    if (functionName === "default_max_participants") {
      return { data: CAPACITY_BY_ACTIVITY[args._activity] ?? null, error: null };
    }
    return { data: true, error: null };
  },
});


function createTestHandler(
  stripeFactory: () => CheckoutClient,
  originResolver?: (rawOrigin: string | null) => string,
  rateGuardFactory: () => RateGuardMock = allowRateGuard,
) {
  return createHandler(stripeFactory, originResolver, rateGuardFactory);
}

Deno.test("create-checkout: allowlisted Origin header is used verbatim in Stripe URLs", async () => {
  const captured: CapturedCall[] = [];
  const handler = createTestHandler(makeFakeStripe(captured));

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
    const handler = createTestHandler(makeFakeStripe(captured));
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
  const handler = createTestHandler(makeFakeStripe(captured));

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
    const handler = createTestHandler(factory, () => malicious);

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
// ─────────────────────────────────────────────────────────────
// P0-1 — Idempotency-Key
// ─────────────────────────────────────────────────────────────

interface IdemCall {
  params: Record<string, unknown>;
  options?: { idempotencyKey?: string };
}

function makeIdemStripe(calls: IdemCall[]) {
  const sessions = new Map<string, string>();
  return (): CheckoutClient => ({
    checkout: {
      sessions: {
        create(params, options) {
          calls.push({ params, options });
          const key = options?.idempotencyKey ?? crypto.randomUUID();
          // Emulate Stripe: same key ⇒ same session returned.
          if (!sessions.has(key)) {
            sessions.set(key, `https://checkout.stripe.com/c/pay/${crypto.randomUUID()}`);
          }
          return Promise.resolve({ url: sessions.get(key)! });
        },
      },
    },
  });
}

function makeIdemRequest(
  key: string | null,
  body: Record<string, unknown> = {},
  clientIp: string | null = "203.0.113.10",
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    origin: DEFAULT_ORIGIN,
  };
  if (key !== null) headers["Idempotency-Key"] = key;
  if (clientIp !== null) headers["x-forwarded-for"] = clientIp;
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

const KEY_A = "11111111-2222-3333-4444-555555555555";
const KEY_B = "99999999-8888-7777-6666-555555555555";

Deno.test("create-checkout: rejects a request without Idempotency-Key", async () => {
  const calls: IdemCall[] = [];
  const handler = createTestHandler(makeIdemStripe(calls));
  const res = await handler(makeIdemRequest(null));
  const json = await res.json();
  assertEquals(res.status, 400);
  assert(String(json.error).includes("Idempotency-Key"));
  assertEquals(calls.length, 0, "Stripe must not be called without a key");
});

Deno.test("create-checkout: rejects a malformed Idempotency-Key", async () => {
  const calls: IdemCall[] = [];
  const handler = createTestHandler(makeIdemStripe(calls));
  const res = await handler(makeIdemRequest("short"));
  await res.text();
  assertEquals(res.status, 400);
  assertEquals(calls.length, 0);
});

Deno.test("create-checkout: forwards the Idempotency-Key verbatim to Stripe", async () => {
  const calls: IdemCall[] = [];
  const handler = createTestHandler(makeIdemStripe(calls));
  const res = await handler(makeIdemRequest(KEY_A));
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(calls.length, 1);
  assertEquals(calls[0].options?.idempotencyKey, KEY_A);
});

Deno.test("create-checkout: retry with the SAME key returns the SAME session", async () => {
  const calls: IdemCall[] = [];
  const handler = createTestHandler(makeIdemStripe(calls));
  const first = await (await handler(makeIdemRequest(KEY_A))).json();
  const second = await (await handler(makeIdemRequest(KEY_A))).json();
  assertEquals(calls.length, 2);
  assertEquals(calls[0].options?.idempotencyKey, calls[1].options?.idempotencyKey);
  assertEquals(first.url, second.url, "same key must not create a second Checkout Session");
});

Deno.test("create-checkout: returns 429 and does NOT call Stripe when the short window is exhausted", async () => {
  const calls: IdemCall[] = [];
  let stripeFactoryCalls = 0;
  const handler = createTestHandler(
    () => {
      stripeFactoryCalls++;
      return makeIdemStripe(calls)();
    },
    undefined,
    () => ({
      rpc: async (functionName, args) => {
        if (functionName === "default_max_participants") {
          return { data: CAPACITY_BY_ACTIVITY[args._activity] ?? null, error: null };
        }
        return { data: args.p_context !== "create_checkout_ip_10m", error: null };
      },

    }),
  );

  const res = await handler(makeIdemRequest(KEY_A));
  const json = await res.json();
  assertEquals(res.status, 429);
  assertEquals(json.error, "Trop de demandes. Merci de réessayer plus tard.");
  assertEquals(calls.length, 0);
  assertEquals(stripeFactoryCalls, 0);
});

Deno.test("create-checkout: returns 503 and does NOT call Stripe when the rate guard fails", async () => {
  const calls: IdemCall[] = [];
  let stripeFactoryCalls = 0;
  const handler = createTestHandler(
    () => {
      stripeFactoryCalls++;
      return makeIdemStripe(calls)();
    },
    undefined,
    () => ({
      rpc: async () => ({ data: null, error: { message: "database unavailable" } }),
    }),
  );

  const res = await handler(makeIdemRequest(KEY_A));
  const json = await res.json();
  assertEquals(res.status, 503);
  assertEquals(json.error, "Service temporairement indisponible");
  assertEquals(calls.length, 0);
  assertEquals(stripeFactoryCalls, 0);
});

Deno.test("create-checkout: a new payment intention (new key) creates a new session", async () => {
  const calls: IdemCall[] = [];
  const handler = createTestHandler(makeIdemStripe(calls));
  const first = await (await handler(makeIdemRequest(KEY_A))).json();
  const second = await (await handler(makeIdemRequest(KEY_B, { participants: 2, totalSessions: 2 }))).json();
  assert(first.url !== second.url, "distinct intentions must yield distinct sessions");
});
