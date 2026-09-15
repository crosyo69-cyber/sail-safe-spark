/**
 * F-24-04 — vérification locale de l'autorité service_role.
 * Aucun appel réseau réel : la sonde Admin API est injectée.
 */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { verifyServiceRoleCredential } from "../_shared/service-role-auth.ts";

const REAL = "real-service-role-secret";
// Sonde simulée : seul le vrai secret possède l'autorité service_role.
const probe = (token: string) => Promise.resolve(token === REAL);

function forgedJwt(role: string): string {
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replaceAll("=", "");
  return `${b64({ alg: "HS256" })}.${b64({ role, exp: 9999999999 })}.signature`;
}

Deno.test("F-24-04 — le secret serveur exact est accepté", async () => {
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", REAL);
  assertEquals(await verifyServiceRoleCredential(REAL, probe), true);
});

Deno.test("F-24-04 — un JWT forgé avec role=service_role est refusé", async () => {
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", REAL);
  assertEquals(await verifyServiceRoleCredential(forgedJwt("service_role"), probe), false);
});

Deno.test("F-24-04 — un jeton utilisateur authentifié est refusé", async () => {
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", REAL);
  assertEquals(await verifyServiceRoleCredential(forgedJwt("authenticated"), probe), false);
});

Deno.test("F-24-04 — absence de jeton refusée, sonde jamais appelée", async () => {
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", REAL);
  let called = false;
  const spy = (t: string) => {
    called = true;
    return Promise.resolve(t === REAL);
  };
  assertEquals(await verifyServiceRoleCredential("", spy), false);
  assertEquals(called, false);
});

Deno.test("F-24-04 — une sonde en erreur ne vaut pas autorisation", async () => {
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", REAL);
  const failing = () => Promise.reject(new Error("network"));
  assertEquals(await verifyServiceRoleCredential("autre-cle", failing), false);
});

Deno.test("F-24-04 — sans sonde, seul le secret exact passe", async () => {
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", REAL);
  assertEquals(await verifyServiceRoleCredential(REAL), true);
  assertEquals(await verifyServiceRoleCredential(forgedJwt("service_role")), false);
});
