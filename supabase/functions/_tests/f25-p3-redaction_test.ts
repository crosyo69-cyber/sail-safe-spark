// F-25-02 / F-25-03 — Tests statiques de la minimisation des erreurs et des logs.
// Aucun appel réseau, aucun e-mail, aucune écriture, aucun appel fournisseur.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  correlationId,
  errorSummary,
  fingerprint,
  GENERIC_ERROR_MESSAGE,
  maskEmail,
  maskName,
} from "../_shared/log-redact.ts";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const read = (fn: string) => Deno.readTextFile(join(ROOT, fn, "index.ts"));

// ---------- A. Primitives de masquage ----------

Deno.test("A1 — maskEmail ne conserve que la première lettre du local-part", () => {
  assertEquals(maskEmail("john.doe@gmail.com"), "j***@gmail.com");
  assertEquals(maskEmail("  Jean@Example.FR "), "J***@Example.FR");
});

Deno.test("A2 — maskEmail ne laisse jamais fuiter une valeur non e-mail", () => {
  assertEquals(maskEmail("pas-un-email"), "***");
  assertEquals(maskEmail("@domaine.fr"), "***");
  assertEquals(maskEmail("a@"), "***");
  assertEquals(maskEmail(""), null);
  assertEquals(maskEmail(undefined), null);
});

Deno.test("A3 — maskName masque le nom", () => {
  assertEquals(maskName("Jean-Pierre"), "J***");
  assertEquals(maskName(""), null);
});

Deno.test("A4 — fingerprint est stable, court et non réversible", async () => {
  const a = await fingerprint("john.doe@gmail.com");
  const b = await fingerprint("JOHN.DOE@GMAIL.COM ");
  assertEquals(a, b);
  assertEquals(a?.length, 16);
  assert(!a?.includes("john"));
});

Deno.test("A5 — errorSummary n'expose ni message ni stack", () => {
  const err = Object.assign(new Error("relation \"otp_sessions\" does not exist"), { code: "42P01" });
  const s = errorSummary(err);
  assertEquals(s, { type: "Error", code: "42P01" });
  assert(!JSON.stringify(s).includes("otp_sessions"));
  assert(!JSON.stringify(s).includes("stack"));
});

Deno.test("A6 — correlationId est un UUID unique", () => {
  const a = correlationId();
  assert(/^[0-9a-f-]{36}$/.test(a));
  assert(a !== correlationId());
});

// ---------- B. F-25-02 — endpoint public unsubscribe-weather ----------

Deno.test("B1 — unsubscribe-weather ne renvoie plus error.message", async () => {
  const src = await read("unsubscribe-weather");
  assert(!/error\.message\s*\|\|/.test(src), "error.message encore renvoyé au client");
  assert(src.includes("GENERIC_ERROR_MESSAGE"), "message générique absent");
  assert(src.includes("correlation_id"), "identifiant de corrélation absent");
});

Deno.test("B2 — unsubscribe-weather ne journalise plus l'objet d'erreur PostgREST brut", async () => {
  const src = await read("unsubscribe-weather");
  assert(!src.includes('console.error("Error deleting subscription:"'));
  assert(!src.includes('console.error("Error unsubscribing:"'));
  assert(src.includes("errorSummary(error)"));
});

Deno.test("B3 — le contrat métier de unsubscribe-weather est préservé", async () => {
  const src = await read("unsubscribe-weather");
  for (const contract of [
    '"Token manquant"',
    '"Token invalide"',
    '"Abonnement non trouvé"',
    "alreadyUnsubscribed",
    '"Désabonnement effectué avec succès"',
    '"Abonnement supprimé définitivement"',
    "delete_weather_subscription",
    "unsubscribe_weather_alert",
  ]) {
    assert(src.includes(contract), `contrat perdu: ${contract}`);
  }
});

Deno.test("B4 — les gardes F-22 et F-25-01 de unsubscribe-weather sont intactes", async () => {
  const src = await read("unsubscribe-weather");
  assert(src.includes("weather_unsubscribe_ip"));
  assert(src.includes("weather_unsubscribe_token"));
  assert(src.includes("publicRateKey(req)"));
  assert(src.includes('globalQuota(supabase, "weather_unsubscribe", UNSUB_QUOTA_HOUR, UNSUB_QUOTA_DAY)'));
  assertEquals(/UNSUB_QUOTA_HOUR = (\d+)/.exec(src)?.[1], "300");
  assertEquals(/UNSUB_QUOTA_DAY = (\d+)/.exec(src)?.[1], "2000");
});

// ---------- C. F-25-02 — email-queue-health-check ----------

Deno.test("C1 — aucune stack trace envoyée par e-mail", async () => {
  const src = await read("email-queue-health-check");
  assert(!src.includes("err?.stack"), "stack encore présente");
  assert(!src.includes("err.stack"), "stack encore présente");
  assert(!/JSON\.stringify\(\{ ok: false, error: String\(err\)/.test(src));
});

Deno.test("C2 — diagnostic conservé : type, code, corrélation", async () => {
  const src = await read("email-queue-health-check");
  for (const token of ["errorSummary(err)", "correlationId()", "Corrélation :", "Type :", "Code :"]) {
    assert(src.includes(token), `diagnostic perdu: ${token}`);
  }
});

Deno.test("C3 — le rapport e-mail ne contient plus d'adresse en clair", async () => {
  const src = await read("email-queue-health-check");
  assert(src.includes("recipient_email: maskEmail(r.recipient_email)"));
  assert(!/report\.stuckPending = trulyStuck$/m.test(src));
  assert(!/report\.recentDlq = dlqRows$/m.test(src));
});

// ---------- D. F-25-03 — PII dans les logs ----------

const PII_SURFACES = [
  "auth-email-hook",
  "notify-reservation",
  "stripe-webhook",
  "sync-brevo-contacts",
  "process-email-queue",
  "sync-stripe-reservations",
  "email-queue-health-check",
  "unsubscribe-weather",
];

Deno.test("D1 — aucun secret / token / OTP / Authorization journalisé", async () => {
  const forbidden = [
    /console\.(log|warn|error)\([^\n]*\b(?:apiKey|api_key|serviceKey|serviceRoleKey|resendKey|secret|password)\b/i,
    /console\.(log|warn|error)\([^\n]*\bauthHeader\b/,
    /console\.(log|warn|error)\([^\n]*\botp\b/i,
    /console\.(log|warn|error)\([^\n]*\bcookie\b/i,
    /console\.(log|warn|error)\([^\n]*\btoken_hash\b/i,
  ];
  for (const fn of PII_SURFACES) {
    const src = await read(fn);
    for (const re of forbidden) {
      assert(!re.test(src), `${fn}: log potentiellement sensible (${re})`);
    }
  }
});

Deno.test("D2 — les adresses e-mail sont masquées dans les logs ciblés", async () => {
  const checks: Record<string, string[]> = {
    "auth-email-hook": ["maskEmail(payload.data.email)"],
    "stripe-webhook": ["maskEmail(to)", "maskEmail(customerEmail)"],
    "sync-brevo-contacts": ["maskEmail(email)"],
  };
  for (const [fn, tokens] of Object.entries(checks)) {
    const src = await read(fn);
    for (const t of tokens) assert(src.includes(t), `${fn}: masquage absent (${t})`);
  }
});

Deno.test("D3 — plus de nom/prénom en clair dans notify-reservation", async () => {
  const src = await read("notify-reservation");
  assert(!src.includes("${data.first_name} ${data.last_name}`)"), "nom complet encore journalisé");
  assert(src.includes("errorSummary(error)"));
});

Deno.test("D4 — sync-brevo-contacts ne journalise plus le corps de réponse fournisseur", async () => {
  const src = await read("sync-brevo-contacts");
  assert(!src.includes("console.error(`Brevo ${email}"), "e-mail + corps fournisseur encore journalisés");
  assert(src.includes("http_status: res.status"));
});

Deno.test("D5 — Stripe : identifiants de diagnostic conservés, signature et payload jamais journalisés", async () => {
  const src = await read("stripe-webhook");
  assert(src.includes("event_id: event.id"), "identifiant d'évènement Stripe perdu");
  assert(!/console\.(log|error)\([^\n]*\bsignature\b[^\n]*\$\{/.test(src), "signature journalisée");
  assert(!/console\.(log|error)\([^\n]*JSON\.stringify\(event\)/.test(src), "payload complet journalisé");
  assert(!/console\.(log|error)\([^\n]*\bbody\b\s*\)/.test(src), "corps brut journalisé");
});

Deno.test("D6 — process-email-queue conserve ses UUID de corrélation sans PII ajoutée", async () => {
  const src = await read("process-email-queue");
  assert(src.includes("msg_id: msg.msg_id"), "corrélation msg_id perdue");
  assert(!/console\.(log|warn|error)\([^\n]*\bpayload\.html\b/.test(src));
  assert(!/console\.(log|warn|error)\([^\n]*\bpayload\.to\b/.test(src));
});

Deno.test("D7 — GENERIC_ERROR_MESSAGE ne révèle aucun détail interne", () => {
  assertEquals(GENERIC_ERROR_MESSAGE, "Une erreur est survenue. Veuillez réessayer.");
});
