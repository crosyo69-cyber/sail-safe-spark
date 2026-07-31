/**
 * Audit statique : garantit qu'aucun nouvel endpoint sensible n'est ajouté
 * sans contrôle d'autorisation côté serveur.
 *
 * Stratégie : pour chaque function index.ts, on classe l'endpoint comme
 *   - "public"  → listé dans PUBLIC_ENDPOINTS (formulaires, webhooks signés…)
 *   - "sensible" → tout le reste
 * Un endpoint sensible DOIT contenir au moins un marqueur d'auth reconnu :
 *   - `has_role(`               (RPC admin)
 *   - `SUPABASE_SERVICE_ROLE_KEY` + comparaison de token (cron service-role)
 *   - `auth.getClaims(`         (JWT vérifié)
 *   - `auth.getUser(`           (JWT vérifié)
 *   - `STRIPE_WEBHOOK_SECRET`   (signature Stripe vérifiée)
 *   - `verifyAuthHook` / `Standard-Webhook` (hooks signés)
 *
 * Si un nouvel endpoint sensible est ajouté sans aucun de ces marqueurs,
 * ce test échoue → on ne peut plus déployer sans contrôle RBAC.
 */
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { dirname, fromFileUrl, join, relative } from "https://deno.land/std@0.224.0/path/mod.ts";

const FUNCTIONS_ROOT = join(dirname(dirname(fromFileUrl(import.meta.url))));

/** Endpoints publics par conception. Documenter la raison à chaque ajout. */
const PUBLIC_ENDPOINTS = new Set<string>([
  "chatbot",                 // chat public anti-bot + rate-limit applicatif
  "send-contact-email",      // formulaire contact (honeypot + délai côté client)
  "last-minute-subscribe",   // inscription alerte publique (double opt-in)
  "unsubscribe-weather",     // désabonnement par token uuid
  "create-checkout",         // checkout Stripe public (validation montant côté serveur)
  "stripe-webhook",          // signature Stripe (STRIPE_WEBHOOK_SECRET)
  "auth-email-hook",         // hook signé Standard-Webhook (auth provider)
]);

const AUTH_MARKERS = [
  "has_role(",
  "auth.getClaims(",
  "auth.getUser(",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "Standard-Webhook",
  "verifyAuthHook",
  "isServiceRoleJwt(",
  "auth.oauth.issuer",
];

function hasAuthMarker(src: string): string | null {
  for (const m of AUTH_MARKERS) {
    if (src.includes(m)) return m;
  }
  return null;
}

function hasTokenComparison(src: string): boolean {
  // Vérifie qu'on compare bien le bearer reçu au service-role
  // (sinon SUPABASE_SERVICE_ROLE_KEY pourrait n'être utilisé que pour
  // créer un client admin sans vérifier l'appelant).
  return /token\s*===\s*serviceKey/.test(src) ||
         /token\s*!==\s*serviceKey/.test(src) ||
         /token\s*===\s*service_role/i.test(src) ||
         /claims\?\.role\s*!==\s*['"]service_role['"]/.test(src) ||
         /claims\.role\s*!==\s*['"]service_role['"]/.test(src) ||
         /isServiceRoleJwt\(/.test(src) ||
         /has_role\(/.test(src) ||
         /auth\.getClaims\(/.test(src) ||
         /auth\.getUser\(/.test(src) ||
         /STRIPE_WEBHOOK_SECRET/.test(src) ||
         /Standard-Webhook/.test(src);
}

Deno.test("RBAC audit — chaque endpoint sensible vérifie l'appelant", async () => {
  const violations: string[] = [];

  for await (const entry of walk(FUNCTIONS_ROOT, {
    includeDirs: false,
    match: [/index\.ts$/],
    skip: [/_tests/, /_shared/, /node_modules/],
  })) {
    const rel = relative(FUNCTIONS_ROOT, entry.path);
    const fnName = rel.split("/")[0];
    if (PUBLIC_ENDPOINTS.has(fnName)) continue;

    const src = await Deno.readTextFile(entry.path);
    // Ignore les fichiers qui ne servent pas un endpoint HTTP
    if (!src.includes("Deno.serve(")) continue;

    const marker = hasAuthMarker(src);
    if (!marker) {
      violations.push(`${fnName}: aucun marqueur d'auth trouvé (attendu un de ${AUTH_MARKERS.join(", ")})`);
      continue;
    }
    if (!hasTokenComparison(src)) {
      violations.push(`${fnName}: SUPABASE_SERVICE_ROLE_KEY présent mais aucune comparaison de bearer (token === serviceKey)`);
    }
  }

  assert(
    violations.length === 0,
    `Endpoint(s) sensibles sans contrôle d'autorisation :\n  - ${violations.join("\n  - ")}\n` +
    `Ajoute un check has_role/getClaims/service-role, ou liste-le explicitement dans PUBLIC_ENDPOINTS avec une justification.`,
  );
});