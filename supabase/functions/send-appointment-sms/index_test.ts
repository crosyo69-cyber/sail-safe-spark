// Tests de send-appointment-sms — mocks exclusifs : aucun SMS réel, aucun réseau réel.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  createHandler,
  normalizeFrMobile,
  type SmsDeps,
  type SmsLogStore,
} from "./index.ts";

const GROUP_ID = "11111111-1111-1111-1111-111111111111";
const RESA_ID = "22222222-2222-2222-2222-222222222222";

// ---------- Mocks ----------

function makeStore(opts?: { failInsert?: boolean }) {
  const rows: Record<string, unknown>[] = [];
  const store: SmsLogStore = {
    async insertPrepared(row) {
      if (opts?.failInsert) return { ok: false, duplicate: false, error: "down" };
      const dup = rows.some((r) =>
        r.dedupe_key === row.dedupe_key && r.is_resend === false &&
        ["prepared", "sending", "sent", "unknown"].includes(String(r.status))
      );
      if (dup) return { ok: false, duplicate: true };
      const id = crypto.randomUUID();
      rows.push({ ...row, id });
      return { ok: true, id };
    },
    async setStatus(id, status, fields) {
      const row = rows.find((r) => r.id === id);
      if (row) Object.assign(row, { status, ...(fields ?? {}) });
    },
  };
  return { store, rows };
}

interface BrevoCall { url: string; method: string; body?: Record<string, unknown> }

/** brevoFetch simulé : 1er appel = GET /account, suivants = envois SMS. */
function makeBrevo(opts: {
  calls: BrevoCall[];
  accountOk?: boolean;
  accountJson?: Record<string, unknown> | null;
  accountThrows?: boolean;
  sendResults?: Array<{ ok: boolean; status?: number; json?: unknown; throws?: boolean }>;
}) {
  let sendIndex = 0;
  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const u = String(url);
    opts.calls.push({
      url: u,
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    if (u.endsWith("/account")) {
      if (opts.accountThrows) throw new Error("network down");
      if (opts.accountOk === false) return new Response("unauthorized", { status: 401 });
      return new Response(JSON.stringify(opts.accountJson ?? { smsCredits: 100 }), { status: 200 });
    }
    const r = opts.sendResults?.[sendIndex++] ?? { ok: true, json: { messageId: "msg-1" } };
    if (r.throws) throw new Error("timeout");
    if (r.ok) return new Response(JSON.stringify(r.json ?? { messageId: "msg-1" }), { status: 201 });
    return new Response("quota exceeded", { status: r.status ?? 400 });
  };
}

function makeDeps(overrides: Partial<SmsDeps> & { isAdmin?: boolean; hasUser?: boolean }): SmsDeps {
  const { isAdmin = true, hasUser = true, ...rest } = overrides;
  return {
    createUserClient: () => ({
      auth: { getUser: async () => ({ data: { user: hasUser ? { id: "admin-1", email: "m@example.fr" } : null } }) },
      rpc: async () => ({ data: isAdmin }),
    }),
    store: makeStore().store,
    brevoFetch: makeBrevo({ calls: [] }),
    env: (k) => (k === "BREVO_API_KEY" ? "test-key" : undefined),
    ...rest,
  };
}

function makeRequest(body: Record<string, unknown> | null, auth = "Bearer user-jwt") {
  return new Request("https://example.com/send-appointment-sms", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
    body: JSON.stringify(
      body ?? {
        date: "2026-07-10",
        activity: "kitesurf",
        groupId: GROUP_ID,
        message: "RDV 9h Port de Carqueiranne",
        recipients: [{ reservationId: RESA_ID, name: "Jean Test", phone: "0612345678" }],
      },
    ),
  });
}

// ---------- 1. Contrôles d'accès ----------

Deno.test("refus si non connecté", async () => {
  const calls: BrevoCall[] = [];
  const h = createHandler(makeDeps({ brevoFetch: makeBrevo({ calls }), hasUser: false }));
  const res = await h(makeRequest(null));
  await res.text();
  assertEquals(res.status, 401);
  assertEquals(calls.filter((c) => c.method === "POST").length, 0);
});

Deno.test("refus si non administrateur", async () => {
  const calls: BrevoCall[] = [];
  const h = createHandler(makeDeps({ brevoFetch: makeBrevo({ calls }), isAdmin: false }));
  const res = await h(makeRequest(null));
  await res.text();
  assertEquals(res.status, 403);
  assertEquals(calls.filter((c) => c.method === "POST").length, 0);
});

// ---------- 2. Validation ----------

Deno.test("refus de validation : message vide et numéro invalide", async () => {
  const h = createHandler(makeDeps({}));
  let res = await h(makeRequest({ message: "   " }));
  await res.text();
  assertEquals(res.status, 400);
  res = await h(makeRequest({ recipients: [{ reservationId: null, name: "A", phone: "0123456789" }] }));
  await res.text();
  assertEquals(res.status, 400);
});

// ---------- 3. Envoi nominal ----------

Deno.test("envoi nominal : sent, message_id et numéro normalisé +33", async () => {
  const calls: BrevoCall[] = [];
  const { store, rows } = makeStore();
  const h = createHandler(makeDeps({ store, brevoFetch: makeBrevo({ calls }) }));
  const res = await h(makeRequest(null));
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.sent, 1);
  assertEquals(body.results[0].status, "sent");
  const smsCall = calls.find((c) => c.method === "POST");
  assert(smsCall, "un appel d'envoi doit exister");
  assertEquals(smsCall.body?.recipient, "+33612345678");
  assertEquals(String(rows[0].status), "sent");
  assertEquals(String(rows[0].message_id), "msg-1");
  assertEquals(String(rows[0].phone_last4), "5678");
  assert(!calls.some((c) => c.url.includes("api.brevo.com") === false), "appels uniquement vers Brevo");
});

// ---------- 4/5/6. Doublons, renvoi, nouveau contenu ----------

Deno.test("doublon : même message renvoyé sans flag → refusé, aucun 2e envoi", async () => {
  const calls: BrevoCall[] = [];
  const { store } = makeStore();
  const deps = makeDeps({ store, brevoFetch: makeBrevo({ calls, sendResults: [{ ok: true }, { ok: true }] }) });
  const h = createHandler(deps);
  await (await h(makeRequest(null))).text();
  const res2 = await h(makeRequest(null));
  const b2 = await res2.json();
  assertEquals(b2.skipped, 1);
  assertEquals(b2.results[0].status, "duplicate");
  assertEquals(calls.filter((c) => c.method === "POST").length, 1);
});

Deno.test("renvoi manuel explicite autorisé et marqué is_resend", async () => {
  const calls: BrevoCall[] = [];
  const { store, rows } = makeStore();
  const h = createHandler(makeDeps({
    store,
    brevoFetch: makeBrevo({ calls, sendResults: [{ ok: true }, { ok: true, json: { messageId: "msg-2" } }] }),
  }));
  await (await h(makeRequest(null))).text();
  const res2 = await h(makeRequest({ resend: true }));
  const b2 = await res2.json();
  assertEquals(b2.sent, 1);
  assertEquals(rows.length, 2);
  assertEquals(rows[1].is_resend, true);
  assertEquals(calls.filter((c) => c.method === "POST").length, 2);
});

Deno.test("contenu modifié (spot/horaire) = nouvel envoi autorisé, historique conservé", async () => {
  const calls: BrevoCall[] = [];
  const { store, rows } = makeStore();
  const h = createHandler(makeDeps({
    store,
    brevoFetch: makeBrevo({ calls, sendResults: [{ ok: true }, { ok: true, json: { messageId: "m2" } }] }),
  }));
  await (await h(makeRequest(null))).text();
  const res2 = await h(makeRequest({ message: "RDV déplacé : 14h Port d'Hyères" }));
  const b2 = await res2.json();
  assertEquals(b2.sent, 1);
  assertEquals(rows.length, 2);
  assertEquals(calls.filter((c) => c.method === "POST").length, 2);
});

// ---------- 7/8. Erreurs Brevo ----------

Deno.test("refus Brevo explicite → failed avec motif", async () => {
  const calls: BrevoCall[] = [];
  const { store, rows } = makeStore();
  const h = createHandler(makeDeps({
    store,
    brevoFetch: makeBrevo({ calls, sendResults: [{ ok: false, status: 400 }] }),
  }));
  const res = await h(makeRequest(null));
  const body = await res.json();
  assertEquals(body.failed, 1);
  assertEquals(body.results[0].status, "failed");
  assert(String(rows[0].error).includes("Brevo 400"));
});

Deno.test("réponse incertaine → unknown, aucune relance automatique", async () => {
  const calls: BrevoCall[] = [];
  const { store, rows } = makeStore();
  const h = createHandler(makeDeps({
    store,
    brevoFetch: makeBrevo({ calls, sendResults: [{ throws: true }] }),
  }));
  const res = await h(makeRequest(null));
  const body = await res.json();
  assertEquals(body.results[0].status, "unknown");
  assertEquals(String(rows[0].status), "unknown");
  assertEquals(calls.filter((c) => c.method === "POST").length, 1);
});

Deno.test("un état unknown bloque aussi le doublon automatique", async () => {
  const calls: BrevoCall[] = [];
  const { store } = makeStore();
  const h = createHandler(makeDeps({
    store,
    brevoFetch: makeBrevo({ calls, sendResults: [{ throws: true }, { ok: true }] }),
  }));
  await (await h(makeRequest(null))).text();
  const res2 = await h(makeRequest(null));
  const b2 = await res2.json();
  assertEquals(b2.results[0].status, "duplicate");
  assertEquals(calls.filter((c) => c.method === "POST").length, 1);
});

// ---------- 9. Pré-contrôles ----------

Deno.test("clé Brevo absente → refus avant tout envoi", async () => {
  const calls: BrevoCall[] = [];
  const h = createHandler(makeDeps({ brevoFetch: makeBrevo({ calls }), env: () => undefined }));
  const res = await h(makeRequest(null));
  await res.text();
  assertEquals(res.status, 500);
  assertEquals(calls.length, 0);
});

Deno.test("compte Brevo injoignable → refus fail-closed, rien envoyé", async () => {
  const calls: BrevoCall[] = [];
  const h = createHandler(makeDeps({ brevoFetch: makeBrevo({ calls, accountThrows: true }) }));
  const res = await h(makeRequest(null));
  await res.text();
  assertEquals(res.status, 502);
  assertEquals(calls.filter((c) => c.method === "POST").length, 0);
});

Deno.test("crédits SMS insuffisants → refus avant envoi", async () => {
  const calls: BrevoCall[] = [];
  const h = createHandler(makeDeps({ brevoFetch: makeBrevo({ calls, accountJson: { smsCredits: 0 } }) }));
  const res = await h(makeRequest(null));
  await res.text();
  assertEquals(res.status, 402);
  assertEquals(calls.filter((c) => c.method === "POST").length, 0);
});

// ---------- 10. Concurrence (clics répétés) ----------

Deno.test("deux requêtes simultanées du même message → un seul envoi", async () => {
  const calls: BrevoCall[] = [];
  const { store } = makeStore();
  const h = createHandler(makeDeps({ store, brevoFetch: makeBrevo({ calls, sendResults: [{ ok: true }] }) }));
  const [r1, r2] = await Promise.all([h(makeRequest(null)), h(makeRequest(null))]);
  const b1 = await r1.json();
  const b2 = await r2.json();
  assertEquals(b1.sent + b2.sent, 1);
  assertEquals(b1.skipped + b2.skipped, 1);
  assertEquals(calls.filter((c) => c.method === "POST").length, 1);
});

// ---------- Utilitaire : normalisation ----------

Deno.test("normalisation des mobiles français", () => {
  assertEquals(normalizeFrMobile("06 12 34 56 78"), "+33612345678");
  assertEquals(normalizeFrMobile("0712345678"), "+33712345678");
  assertEquals(normalizeFrMobile("+33612345678"), "+33612345678");
  assertEquals(normalizeFrMobile("33612345678"), "+33612345678");
  assertEquals(normalizeFrMobile("0123456789"), null);
  assertEquals(normalizeFrMobile("+441234567890"), null);
  assertEquals(normalizeFrMobile(""), null);
});
