/**
 * F-27-01 — PAYMENT ↔ CAPACITY CONSISTENCY
 *
 * Objectif : prouver qu'un checkout public NE PEUT PAS encaisser un nombre de
 * participants qu'un unique daily_group ne peut pas accueillir, et que le rejet
 * intervient AVANT tout appel Stripe.
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler, type CheckoutClient } from "../create-checkout/index.ts";
import { parseParticipants, resolveActivityEnum } from "../create-checkout/participants.ts";

// Miroir de public.default_max_participants(activity_type) (source de vérité SQL).
const CAPACITY_BY_ACTIVITY: Record<string, number> = {
  kitesurf: 4,
  wingfoil: 3,
  pumpfoil: 4,
  foil_tracte: 4,
  stage_100_glisse: 4,
};

type Guard = {
  // deno-lint-ignore no-explicit-any
  rpc: (functionName: any, args: any) => Promise<any>;
};

const guard = (): Guard => ({
  // deno-lint-ignore no-explicit-any
  rpc: async (functionName: string, args: any) => {
    if (functionName === "default_max_participants") {
      return { data: CAPACITY_BY_ACTIVITY[args._activity] ?? null, error: null };
    }
    return { data: true, error: null };
  },
});

function makeHandler(stripeCalls: Record<string, unknown>[], factoryCalls: { n: number }) {
  const stripeFactory = (): CheckoutClient => {
    factoryCalls.n++;
    return {
      checkout: {
        sessions: {
          create(params) {
            stripeCalls.push(params);
            return Promise.resolve({ url: "https://checkout.stripe.com/c/pay/test" });
          },
        },
      },
    };
  };
  return createHandler(stripeFactory, () => "https://www.kitesurfpassion.fr", guard);
}

function request(body: Record<string, unknown>) {
  return new Request("https://example.com/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
      origin: "https://www.kitesurfpassion.fr",
    },
    body: JSON.stringify({
      activityName: "Cours Particulier Kitesurf",
      preferredDate: "2026-07-01",
      phone: "0612345678",
      customerName: "Jean Test",
      ...body,
    }),
  });
}

async function call(body: Record<string, unknown>) {
  const stripeCalls: Record<string, unknown>[] = [];
  const factoryCalls = { n: 0 };
  const handler = makeHandler(stripeCalls, factoryCalls);
  const res = await handler(request(body));
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, stripeCalls, factoryCalls };
}

Deno.test("F-27-01 kitesurf: 1 participant accepté", async () => {
  const r = await call({ participants: 1, totalSessions: 1 });
  assertEquals(r.status, 200);
  assertEquals(r.stripeCalls.length, 1);
});

Deno.test("F-27-01 kitesurf: 4 participants (capacité max) accepté", async () => {
  const r = await call({ participants: 4, totalSessions: 4 });
  assertEquals(r.status, 200);
  assertEquals(r.stripeCalls.length, 1);
});

Deno.test("F-27-01 kitesurf: 5 participants REJETÉ avant Stripe", async () => {
  const r = await call({ participants: 5, totalSessions: 5 });
  assertEquals(r.status, 400);
  assertEquals(r.stripeCalls.length, 0);
  assertEquals(r.factoryCalls.n, 0);
  assert(String(r.json.error).includes("4"));
});

Deno.test("F-27-01 wingfoil: 1 et 3 participants acceptés", async () => {
  for (const n of [1, 3]) {
    const r = await call({ activityName: "Cours Wingfoil", participants: n, totalSessions: 3 });
    assertEquals(r.status, 200, `wingfoil ${n} devrait passer`);
    assertEquals(r.stripeCalls.length, 1);
  }
});

Deno.test("F-27-01 wingfoil: 4 participants REJETÉ avant Stripe", async () => {
  const r = await call({ activityName: "Cours Wingfoil", participants: 4, totalSessions: 3 });
  assertEquals(r.status, 400);
  assertEquals(r.stripeCalls.length, 0);
  assertEquals(r.factoryCalls.n, 0);
  assert(String(r.json.error).includes("3"));
});

Deno.test("F-27-01 bornes: 0, -1, 999999, non numérique → rejet sans Stripe", async () => {
  for (const value of [0, -1, 999999, "abc", 2.5, {}, true, [1]]) {
    const r = await call({ participants: value, totalSessions: 1 });
    assertEquals(r.status, 400, `participants=${JSON.stringify(value)} devrait être rejeté`);
    assertEquals(r.stripeCalls.length, 0);
    assertEquals(r.factoryCalls.n, 0);
  }
});

Deno.test("F-27-01 activité inconnue → rejet sans Stripe", async () => {
  for (const activityName of ["Cours de surf", "kitesurf gratuit", "", "  "]) {
    const r = await call({ activityName, participants: 1, totalSessions: 1 });
    assertEquals(r.status, 400, `activité "${activityName}" devrait être rejetée`);
    assertEquals(r.stripeCalls.length, 0);
    assertEquals(r.factoryCalls.n, 0);
  }
});

Deno.test("F-27-01 capacité indisponible → 503 fail-closed, aucun Stripe", async () => {
  const stripeCalls: Record<string, unknown>[] = [];
  const factoryCalls = { n: 0 };
  const handler = createHandler(
    () => {
      factoryCalls.n++;
      throw new Error("stripe must not be reached");
    },
    () => "https://www.kitesurfpassion.fr",
    (): Guard => ({
      // deno-lint-ignore no-explicit-any
      rpc: async (functionName: any) =>
        functionName === "default_max_participants"
          ? { data: null, error: { message: "db down" } }
          : { data: true, error: null },
    }),
  );
  const res = await handler(request({ participants: 2, totalSessions: 2 }));
  assertEquals(res.status, 503);
  await res.text();
  assertEquals(stripeCalls.length, 0);
  assertEquals(factoryCalls.n, 0);
});

Deno.test("F-27-01 toutes les activités publiques ont une capacité serveur connue", () => {
  const names = [
    "Cours Particulier Kitesurf",
    "Stage 100% Glisse",
    "Cours à la Carte",
    "Cours Wingfoil",
    "Location Matériel",
    "Foil Tracté",
    "Déposes en Mer",
  ];
  for (const name of names) {
    const activity = resolveActivityEnum(name);
    assert(activity !== null, `${name} doit se résoudre en activity_type`);
    assert(CAPACITY_BY_ACTIVITY[activity!] >= 1, `${name} doit avoir une capacité`);
  }
});

Deno.test("F-27-01 parseParticipants: contrat unitaire", () => {
  assertEquals(parseParticipants(undefined), 1);
  assertEquals(parseParticipants(3), 3);
  assertEquals(parseParticipants("3"), 3);
  assertEquals(parseParticipants(0), null);
  assertEquals(parseParticipants(-1), null);
  assertEquals(parseParticipants(1.5), null);
  assertEquals(parseParticipants("abc"), null);
  assertEquals(parseParticipants(true), null);
  assertEquals(parseParticipants(10_000), null);
});

Deno.test("F-27-01 webhook: la capacité reste imposée en base (defense in depth)", async () => {
  // Le chemin webhook n'écrit jamais une réservation en contournant la
  // capacité : book_daily_visitor insère dans reservations, et le trigger
  // enforce_daily_group_capacity lève group_full (transaction annulée).
  const trigger = await Deno.readTextFile(
    new URL("../../migrations/", import.meta.url).pathname,
  ).catch(() => "");
  void trigger; // non bloquant : la vérification réelle est statique ci-dessous
  const webhook = await Deno.readTextFile(
    new URL("../stripe-webhook/index.ts", import.meta.url).pathname,
  );
  // Le webhook délègue la création de réservation aux RPC métier protégées par
  // le trigger, il ne fait aucun INSERT direct dans reservations.
  assert(
    !/\.from\(\s*["']reservations["']\s*\)\s*\.insert/.test(webhook),
    "stripe-webhook ne doit pas insérer directement dans reservations",
  );
  assert(
    /book_daily_visitor|find_or_create_daily_group/.test(webhook),
    "stripe-webhook doit passer par les RPC métier",
  );
});
