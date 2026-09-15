/**
 * F-26-01 — Tests statiques de l'outil MCP `list_my_reservations`.
 *
 * Aucun appel réseau, aucun runtime OAuth : uniquement de l'analyse statique
 * du code source de l'outil (et de son bundle Edge généré).
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SRC = await Deno.readTextFile("src/lib/mcp/tools/list-my-reservations.ts");
const BUNDLE = await Deno.readTextFile("supabase/functions/mcp/index.ts");

Deno.test("F-26-01: aucune requête sur la colonne inexistante client_packages.user_id", () => {
  assert(!SRC.includes('.eq("client_packages.user_id"'));
  assert(!SRC.includes("client_packages!inner"));
  assert(!SRC.includes('.from("client_packages")'));
  assert(!SRC.includes('.from("package_bookings")'));
});

Deno.test("F-26-01: identité dérivée du contexte MCP, jamais d'un input", () => {
  assert(SRC.includes("ctx.getUserId()"));
  assert(SRC.includes("ctx.isAuthenticated()"));
  // inputSchema vide => aucun paramètre ne permet de demander une autre identité
  assert(/inputSchema:\s*\{\s*\}/.test(SRC));
  assert(!/input\.(user_id|userId|email|role)/.test(SRC));
});

Deno.test("F-26-01: filtrage serveur sur user_id du contexte", () => {
  assert(SRC.includes('.eq("user_id", userId)'));
  const occurrences = SRC.match(/\.eq\(/g) ?? [];
  assertEquals(occurrences.length, 1);
});

Deno.test("F-26-01: pas de clé service_role, RLS conservée", () => {
  assert(SRC.includes("SUPABASE_PUBLISHABLE_KEY"));
  assert(!SRC.includes("SERVICE_ROLE"));
  assert(SRC.includes("Bearer ${ctx.getToken()}"));
});

Deno.test("F-26-01: erreur générique, aucun détail PostgREST exposé", () => {
  assert(!SRC.includes("resvRes.error.message"));
  assert(!SRC.includes("pkgRes"));
  assert(SRC.includes("Impossible de récupérer les réservations"));
});

Deno.test("F-26-01: outil en lecture seule", () => {
  assert(/readOnlyHint:\s*true/.test(SRC));
  for (const write of [".insert(", ".update(", ".delete(", ".upsert(", ".rpc("]) {
    assert(!SRC.includes(write), `write op interdite: ${write}`);
  }
});

Deno.test("F-26-01: bundle Edge MCP — issuer et audience inchangés", () => {
  assert(BUNDLE.includes("auth.oauth.issuer"));
  assert(BUNDLE.includes('acceptedAudiences: "authenticated"'));
  assert(BUNDLE.includes(".supabase.co/auth/v1"));
});
