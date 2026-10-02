/**
 * F-23-HARDENING — tests contrôlés des garde-fous IA.
 * Aucun appel réel au fournisseur IA (mocks uniquement).
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { fetchWithTimeout, guardedStream, rateLimitKeys } from "../_shared/ai-guards.ts";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const chatbotSrc = await Deno.readTextFile(join(ROOT, "chatbot", "index.ts"));
const adminSrc = await Deno.readTextFile(join(ROOT, "admin-assistant", "index.ts"));

Deno.test("rateLimitKeys distingue la valeur client et le dernier proxy", () => {
  const req = new Request("https://x.test", {
    headers: { "x-forwarded-for": "1.2.3.4, 9.9.9.9, 10.0.0.1" },
  });
  const keys = rateLimitKeys(req);
  assertEquals(keys.ip, "1.2.3.4");
  // Un attaquant qui préfixe l'en-tête ne change pas la dernière valeur.
  assertEquals(keys.edge, "10.0.0.1");
});

Deno.test("rateLimitKeys ne renvoie jamais de clé vide (pas de bypass du guard)", () => {
  const keys = rateLimitKeys(new Request("https://x.test"));
  assertEquals(keys.ip, "unknown-ip");
  assertEquals(keys.edge, "unknown-edge");
});

Deno.test("rotation de x-forwarded-for : la clé edge et le quota global restent stables", () => {
  const spoofed = ["5.5.5.5", "6.6.6.6", "7.7.7.7"].map((ip) =>
    rateLimitKeys(new Request("https://x.test", {
      headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
    }))
  );
  assertEquals(new Set(spoofed.map((k) => k.ip)).size, 3); // contournable
  assertEquals(new Set(spoofed.map((k) => k.edge)).size, 1); // non contournable
  // Seconde barrière : quota global, sans aucune clé issue de la requête.
  assert(chatbotSrc.includes("public_quota_guard"));
  assert(chatbotSrc.includes("chatbot_global_day"));
});

Deno.test("fetchWithTimeout interrompt un appel bloqué sans retry", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    calls++;
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    });
  }) as typeof fetch;
  try {
    let name = "";
    try {
      await fetchWithTimeout("https://mock.test", { method: "POST" }, 40);
    } catch (e) {
      name = (e as Error).name;
    }
    assertEquals(name, "AbortError");
    assertEquals(calls, 1); // aucun retry automatique
  } finally {
    globalThis.fetch = original;
  }
});

Deno.test("guardedStream annule la génération amont quand le client se déconnecte", async () => {
  let cancelled = false;
  const upstream = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(new TextEncoder().encode("data: x\n\n"));
    },
    cancel() {
      cancelled = true;
    },
  });
  const stream = guardedStream(upstream, 10_000);
  const reader = stream.getReader();
  await reader.read();
  await reader.cancel("client gone");
  assert(cancelled, "le flux amont doit être annulé");
});

Deno.test("guardedStream se ferme sur timeout total", async () => {
  let cancelled = false;
  const upstream = new ReadableStream<Uint8Array>({
    pull() { /* jamais de donnée : génération bloquée */ },
    cancel() { cancelled = true; },
  });
  const reader = guardedStream(upstream, 50).getReader();
  const { done } = await reader.read();
  assert(done);
  assert(cancelled);
});

Deno.test("chatbot : plafond de sortie et timeouts imposés côté serveur", () => {
  assert(chatbotSrc.includes("max_tokens: MAX_OUTPUT_TOKENS"));
  assert(/MAX_OUTPUT_TOKENS = \d+/.test(chatbotSrc));
  assert(chatbotSrc.includes("UPSTREAM_TIMEOUT_MS"));
  assert(chatbotSrc.includes("STREAM_TIMEOUT_MS"));
  assert(chatbotSrc.includes("stream: true"), "le streaming SSE est conservé");
});

Deno.test("chatbot : fail-closed sur rate guard et quota indisponibles", () => {
  assert(chatbotSrc.includes("rate guard unavailable"));
  assert(chatbotSrc.includes("quota guard unavailable"));
  const failClosed = chatbotSrc.match(/Service temporairement indisponible/g) ?? [];
  assert(failClosed.length >= 2, "les deux gardes doivent bloquer l'appel IA");
  // Les limites historiques restent en place.
  assert(chatbotSrc.includes('"chatbot_burst", keys.ip, 5, "10 seconds"'));
  assert(chatbotSrc.includes('"chatbot_msg", keys.ip, 20, "1 minute"'));
});

Deno.test("chatbot : aucun secret exposé dans les réponses", () => {
  assert(!chatbotSrc.includes("e.message"), "pas de détail interne renvoyé");
  assert(!/return .*LOVABLE_API_KEY/.test(chatbotSrc));
});

Deno.test("admin-assistant : rate limit par admin, boucle toujours <= 6", () => {
  assert(adminSrc.includes("admin_assistant_min"));
  assert(adminSrc.includes("admin_assistant_day"));
  assert(adminSrc.includes("step < 6"), "la boucle maximale de 6 étapes est conservée");
  assert(!adminSrc.includes("step < 7"));
});

Deno.test("admin-assistant : données outil encadrées, aucun outil d'écriture ajouté", () => {
  assert(adminSrc.includes("<donnees_non_fiables>"));
  assert(adminSrc.includes("donnees_non_fiables>${content}"));
  const toolNames = [...adminSrc.matchAll(/name: "(\w+)"/g)].map((m) => m[1]);
  assertEquals(toolNames, ["assistant_query"]);
});
