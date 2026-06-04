/**
 * Tests d'autorisation RBAC — vérifie que chaque endpoint sensible
 * rejette systématiquement :
 *   1. les appels non authentifiés (pas de Bearer)
 *   2. les appels avec une clé anon (utilisateur non connecté)
 *   3. les RPC privilégiés appelés sans rôle admin
 *
 * Variables requises (sinon skip) : SUPABASE_URL, SUPABASE_ANON_KEY.
 * Le service-role n'est PAS utilisé ici — on ne veut pas court-circuiter
 * la couche de sécurité qu'on cherche justement à valider.
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
const RUN = Boolean(SUPABASE_URL && ANON_KEY);

const ADMIN_ONLY_FUNCTIONS = [
  // (path, body)
  { path: "retry-dlq-email", body: { message_id: "00000000-0000-0000-0000-000000000000", queue: "transactional_emails" } },
  { path: "last-minute-notify", body: { sessionId: "00000000-0000-0000-0000-000000000000" } },
  { path: "notify-reservation", body: {
    first_name: "x", last_name: "x", email: "x@x.fr", phone: "0", participants: 1,
    skill_level: "debutant", activity: "kitesurf", time_slot: "morning",
    date: "2099-01-01", source: "admin",
  } },
];

const SERVICE_ROLE_ONLY_FUNCTIONS = [
  { path: "email-queue-health-check", body: {} },
  { path: "cleanup-404-logs", body: {} },
  { path: "process-email-queue", body: {} },
  { path: "send-package-reminders", body: {} },
  { path: "weekly-summary", body: {} },
];

async function call(path: string, init: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, init);
  // Toujours consommer le body (Deno strict)
  await res.text();
  return res.status;
}

Deno.test({
  name: "RBAC — endpoints admin rejettent les appels sans Bearer",
  ignore: !RUN,
  async fn() {
    for (const fn of [...ADMIN_ONLY_FUNCTIONS, ...SERVICE_ROLE_ONLY_FUNCTIONS]) {
      const status = await call(fn.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fn.body),
      });
      assert(
        status === 401 || status === 403,
        `${fn.path} devrait renvoyer 401/403 sans auth (reçu ${status})`,
      );
    }
  },
});

Deno.test({
  name: "RBAC — endpoints admin rejettent un utilisateur anonyme",
  ignore: !RUN,
  async fn() {
    for (const fn of ADMIN_ONLY_FUNCTIONS) {
      const status = await call(fn.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Clé anon = JWT public sans utilisateur connecté → has_role() = false
          Authorization: `Bearer ${ANON_KEY}`,
          apikey: ANON_KEY!,
        },
        body: JSON.stringify(fn.body),
      });
      assert(
        status === 401 || status === 403,
        `${fn.path} devrait renvoyer 401/403 avec un JWT anon (reçu ${status})`,
      );
    }
  },
});

Deno.test({
  name: "RBAC — endpoints service-role rejettent les JWT anon",
  ignore: !RUN,
  async fn() {
    for (const fn of SERVICE_ROLE_ONLY_FUNCTIONS) {
      const status = await call(fn.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON_KEY}`,
          apikey: ANON_KEY!,
        },
        body: JSON.stringify(fn.body),
      });
      assert(
        status === 401 || status === 403,
        `${fn.path} devrait renvoyer 401/403 pour un JWT non service-role (reçu ${status})`,
      );
    }
  },
});

Deno.test({
  name: "RBAC — admin_adjust_package_credits rejette les non-admins",
  ignore: !RUN,
  async fn() {
    const sb = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await sb.rpc("admin_adjust_package_credits", {
      p_package_id: "00000000-0000-0000-0000-000000000000",
      p_delta: 1,
      p_reason: "test rbac",
    });
    assert(error, "L'appel anonyme devrait échouer");
    // Le message peut être "forbidden" (raise) ou une erreur de permission RLS
    assert(
      /forbidden|permission|denied|not allowed/i.test(error!.message),
      `Message d'erreur inattendu: ${error!.message}`,
    );
  },
});

Deno.test({
  name: "RBAC — RLS bloque l'accès anonyme à user_roles d'autres utilisateurs",
  ignore: !RUN,
  async fn() {
    const sb = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb.from("user_roles").select("user_id,role");
    // Soit erreur RLS, soit liste vide (anon non connecté → auth.uid() = null)
    assert(error || (Array.isArray(data) && data.length === 0),
      `user_roles ne doit jamais exposer de ligne à un anon (reçu ${data?.length} lignes)`);
  },
});

Deno.test({
  name: "RBAC — RLS bloque la lecture de client_packages sans code",
  ignore: !RUN,
  async fn() {
    const sb = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb.from("client_packages").select("id,email,package_code").limit(5);
    assert(error || (Array.isArray(data) && data.length === 0),
      `client_packages ne doit pas être listable par un anon (reçu ${data?.length} lignes)`);
  },
});

Deno.test({
  name: "RBAC — RLS bloque la lecture de package_credit_history pour anon",
  ignore: !RUN,
  async fn() {
    const sb = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb.from("package_credit_history").select("id").limit(1);
    assert(error || (Array.isArray(data) && data.length === 0),
      "package_credit_history doit être admin-only");
  },
});