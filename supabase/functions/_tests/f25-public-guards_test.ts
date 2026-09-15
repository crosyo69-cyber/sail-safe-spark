// F-25-01 — Tests statiques des gardes des endpoints publics émetteurs d'e-mail.
// Aucun appel réseau, aucun e-mail, aucune écriture.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { globalQuota, publicRateKey } from "../_shared/public-guards.ts";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const ENDPOINTS = [
  "send-contact-email",
  "weather-subscribe",
  "last-minute-subscribe",
  "unsubscribe-weather",
];
const sources = new Map<string, string>();
for (const name of ENDPOINTS) {
  sources.set(name, await Deno.readTextFile(join(ROOT, name, "index.ts")));
}

// ---------- A. Clé IP ----------

Deno.test("A1 — sans x-forwarded-for, la clé reste non vide", () => {
  assertEquals(publicRateKey(new Request("https://x.test")), "unknown-edge");
});

Deno.test("A2 — une seule valeur XFF", () => {
  assertEquals(
    publicRateKey(new Request("https://x.test", { headers: { "x-forwarded-for": "1.2.3.4" } })),
    "1.2.3.4",
  );
});

Deno.test("A3 — multi-valeurs : dernière valeur (proxy) retenue", () => {
  assertEquals(
    publicRateKey(
      new Request("https://x.test", { headers: { "x-forwarded-for": "1.2.3.4, 9.9.9.9, 10.0.0.1" } }),
    ),
    "10.0.0.1",
  );
});

Deno.test("A4 — rotation de la première valeur : clé stable", () => {
  const keys = ["5.5.5.5", "6.6.6.6", "7.7.7.7", "8.8.8.8"].map((ip) =>
    publicRateKey(new Request("https://x.test", { headers: { "x-forwarded-for": `${ip}, 10.0.0.1` } }))
  );
  assertEquals(new Set(keys).size, 1);
});

Deno.test("A5 — fallback x-real-ip", () => {
  assertEquals(
    publicRateKey(new Request("https://x.test", { headers: { "x-real-ip": "203.0.113.9" } })),
    "203.0.113.9",
  );
});

Deno.test("A6 — valeur inconnue/vide : clé constante non vide", () => {
  assertEquals(
    publicRateKey(new Request("https://x.test", { headers: { "x-forwarded-for": " , ,  " } })),
    "unknown-edge",
  );
});

// ---------- B. Quota global ----------

type Call = { context: string; limit: number; window: string };

function fakeDb(behaviour: (c: Call) => { data?: unknown; error?: { message: string } }) {
  const calls: Call[] = [];
  return {
    calls,
    // deno-lint-ignore no-explicit-any
    rpc(name: string, args: any) {
      assertEquals(name, "public_quota_guard");
      const call = { context: args.p_context, limit: args.p_limit, window: args.p_window };
      calls.push(call);
      const r = behaviour(call);
      return Promise.resolve({ data: r.data ?? null, error: r.error ?? null });
    },
  };
}

Deno.test("B1 — quota horaire + journalier, clé indépendante IP/email/token", async () => {
  const db = fakeDb(() => ({ data: true }));
  const res = await globalQuota(db, "contact", 60, 300);
  assert(res.ok);
  assertEquals(db.calls, [
    { context: "contact_global_hour", limit: 60, window: "1 hour" },
    { context: "contact_global_day", limit: 300, window: "24 hours" },
  ]);
  // Aucune identité requête n'entre dans la clé : la signature n'accepte que le contexte.
  const serialized = JSON.stringify(db.calls);
  assert(!serialized.includes("@") && !/\d+\.\d+\.\d+\.\d+/.test(serialized));
});

Deno.test("B2 — refus horaire : arrêt immédiat", async () => {
  const db = fakeDb((c) => ({ data: !c.context.endsWith("_hour") }));
  const res = await globalQuota(db, "contact", 60, 300);
  assertEquals(res, { ok: false, reason: "limit" });
  assertEquals(db.calls.length, 1);
});

Deno.test("B3 — refus journalier", async () => {
  const db = fakeDb((c) => ({ data: !c.context.endsWith("_day") }));
  const res = await globalQuota(db, "contact", 60, 300);
  assertEquals(res, { ok: false, reason: "limit" });
  assertEquals(db.calls.length, 2);
});

Deno.test("B4 — fail-closed si le mécanisme est en erreur", async () => {
  const db = fakeDb(() => ({ error: { message: "boom" } }));
  const res = await globalQuota(db, "contact", 60, 300);
  assertEquals(res, { ok: false, reason: "error" });
});

Deno.test("B5 — contextes séparés par surface (pas de couplage métier)", async () => {
  const contexts: string[] = [];
  for (const ctx of ["contact", "weather_subscribe", "last_minute_subscribe", "weather_unsubscribe"]) {
    const db = fakeDb(() => ({ data: true }));
    await globalQuota(db, ctx, 1, 1);
    contexts.push(...db.calls.map((c) => c.context));
  }
  assertEquals(new Set(contexts).size, 8);
});

// ---------- C. Endpoints : présence et ordre ----------

Deno.test("C1 — les quatre endpoints utilisent la primitive partagée", () => {
  for (const [name, src] of sources) {
    assert(src.includes('from "../_shared/public-guards.ts"'), `${name}: import manquant`);
    assert(src.includes("publicRateKey(req)"), `${name}: clé IP partagée manquante`);
    assert(src.includes("globalQuota("), `${name}: quota global manquant`);
    assert(!src.includes('xff.split(",")[0]'), `${name}: première valeur XFF encore utilisée`);
  }
});

Deno.test("C2 — quota exécuté avant toute mise en file / écriture d'e-mail", () => {
  for (const [name, src] of sources) {
    // On n'analyse que le corps du handler HTTP (les définitions de helpers
    // situées plus haut dans le fichier ne sont pas des appels).
    const handlerIdx = Math.max(src.indexOf("Deno.serve("), src.indexOf("const handler ="));
    assert(handlerIdx > 0, `${name}: handler introuvable`);
    const body = src.slice(handlerIdx);
    const quotaIdx = body.indexOf("globalQuota(");
    assert(quotaIdx > 0, `${name}: quota absent du handler`);
    for (const costly of ["enqueueEmail(", "issue_link_token", ".insert(", "delete_weather_subscription"]) {
      const idx = body.indexOf(costly);
      if (idx >= 0) {
        assert(quotaIdx < idx, `${name}: ${costly} avant le quota`);
      }
    }
  }
});

Deno.test("C3 — protections F-21/F-22 conservées", () => {
  const weather = sources.get("weather-subscribe")!;
  assert(weather.includes("honeypot"));
  assert(weather.includes("confirm_weather_subscription"));
  assert(weather.includes("isValidEmail"));
  assert(weather.includes("normalizeEmail"));
  const lastMinute = sources.get("last-minute-subscribe")!;
  assert(lastMinute.includes("honeypot"));
  assert(lastMinute.includes("issue_link_token"));
  const contact = sources.get("send-contact-email")!;
  assert(contact.includes("crosyo69@gmail.com"), "destinataire admin modifié");
  const unsub = sources.get("unsubscribe-weather")!;
  assert(unsub.includes("delete_weather_subscription"));
});

Deno.test("C4 — rate limits existants conservés (IP + identité secondaire)", () => {
  const expected: Record<string, string[]> = {
    "send-contact-email": ["contact_ip", "contact_email"],
    "weather-subscribe": ["weather_subscribe_ip", "weather_subscribe_email", "weather_confirm_ip"],
    "last-minute-subscribe": ["last_minute_subscribe_ip", "last_minute_subscribe_email"],
    "unsubscribe-weather": ["weather_unsubscribe_ip", "weather_unsubscribe_token"],
  };
  for (const [name, contexts] of Object.entries(expected)) {
    for (const ctx of contexts) {
      assert(sources.get(name)!.includes(`"${ctx}"`), `${name}: garde ${ctx} manquante`);
    }
  }
});
