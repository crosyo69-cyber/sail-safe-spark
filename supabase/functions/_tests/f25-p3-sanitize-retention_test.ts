// F-25-J / F-25-N / F-14 — Tests statiques de la sanitation HTML et de la rétention.
// Aucun appel réseau, aucune écriture en base, aucune suppression réelle.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  ALLOWED_URI_REGEXP,
  EMAIL_PREVIEW,
  MARKDOWN_RICH,
  MARKDOWN_TEXT_ONLY,
} from "../../../src/lib/sanitize-config.ts";

const REPO = dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))));
const src = (p: string) => Deno.readTextFile(join(REPO, p));

// ---------- F-25-J : schémas d'URL ----------

const DANGEROUS_URIS = [
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "vbscript:msgbox(1)",
  "data:text/html;base64,PHNjcmlwdD4=",
  "data:image/svg+xml,<svg onload=alert(1)>",
  "file:///etc/passwd",
];

const SAFE_URIS = [
  "https://kitesurfpassion.fr/tarifs",
  "http://example.test/x",
  "mailto:crosyo69@gmail.com",
  "tel:+33672716905",
  "/blog/kitesurf",
  "#faq",
  "image.webp",
];

Deno.test("J1 — les schémas actifs sont rejetés par ALLOWED_URI_REGEXP", () => {
  for (const uri of DANGEROUS_URIS) {
    assert(!ALLOWED_URI_REGEXP.test(uri), `schéma dangereux accepté: ${uri}`);
  }
});

Deno.test("J2 — les URL légitimes restent acceptées", () => {
  for (const uri of SAFE_URIS) {
    assert(ALLOWED_URI_REGEXP.test(uri), `URL légitime rejetée: ${uri}`);
  }
});

// ---------- F-25-J : profils ----------

const PROFILES = { MARKDOWN_RICH, MARKDOWN_TEXT_ONLY, EMAIL_PREVIEW };

Deno.test("J3 — aucun profil n'autorise script / iframe / object / svg / math", () => {
  for (const [name, p] of Object.entries(PROFILES)) {
    for (const tag of ["script", "iframe", "object", "embed", "svg", "math", "form", "style", "link", "base"]) {
      assert(!p.ALLOWED_TAGS.includes(tag), `${name} autorise <${tag}>`);
      assert(p.FORBID_TAGS.includes(tag), `${name} n'interdit pas explicitement <${tag}>`);
    }
  }
});

Deno.test("J4 — aucun profil n'autorise de gestionnaire d'évènement ni d'attribut data-*", () => {
  for (const [name, p] of Object.entries(PROFILES)) {
    for (const attr of p.ALLOWED_ATTR) {
      assert(!attr.toLowerCase().startsWith("on"), `${name} autorise ${attr}`);
    }
    assertEquals(p.ALLOW_DATA_ATTR, false, `${name} autorise les attributs data-*`);
    for (const attr of ["onerror", "onclick", "onload", "formaction", "srcdoc", "ping"]) {
      assert(p.FORBID_ATTR.includes(attr), `${name} n'interdit pas ${attr}`);
    }
  }
});

Deno.test("J5 — la sortie de modèle (chatbot / assistant) n'autorise aucune image externe", () => {
  assert(!MARKDOWN_TEXT_ONLY.ALLOWED_TAGS.includes("img"));
  assert(MARKDOWN_TEXT_ONLY.FORBID_TAGS.includes("img"));
  assert(!MARKDOWN_TEXT_ONLY.ALLOWED_ATTR.includes("src"));
});

Deno.test("J6 — le rendu Markdown attendu reste possible", () => {
  for (const tag of ["h1", "h2", "h3", "p", "ul", "ol", "li", "a", "strong", "em", "code", "pre", "table", "td", "th", "blockquote"]) {
    assert(MARKDOWN_RICH.ALLOWED_TAGS.includes(tag), `MARKDOWN_RICH perd <${tag}>`);
    assert(MARKDOWN_TEXT_ONLY.ALLOWED_TAGS.includes(tag), `MARKDOWN_TEXT_ONLY perd <${tag}>`);
  }
  assert(MARKDOWN_RICH.ALLOWED_TAGS.includes("img"), "les images éditoriales du blog doivent rester possibles");
  assert(MARKDOWN_RICH.ALLOWED_ATTR.includes("href"));
});

Deno.test("J7 — la prévisualisation e-mail conserve les styles inline mais rien d'actif", () => {
  assert(EMAIL_PREVIEW.ALLOWED_ATTR.includes("style"));
  assert(!EMAIL_PREVIEW.FORBID_ATTR.includes("style"));
  assert(!EMAIL_PREVIEW.ALLOWED_TAGS.includes("script"));
  assertEquals(EMAIL_PREVIEW.ALLOWED_URI_REGEXP, ALLOWED_URI_REGEXP);
});

// ---------- F-25-J : les sinks utilisent bien les helpers partagés ----------

const SINKS: Array<[string, string]> = [
  ["src/components/ChatBot.tsx", "renderModelMarkdown"],
  ["src/pages/AdminAssistant.tsx", "renderModelMarkdown"],
  ["src/features/blog-article/components/BlogArticleContent.tsx", "renderRichMarkdown"],
  ["src/components/admin/AssistantActions.tsx", "renderEmailPreview"],
];

Deno.test("J8 — les 4 sinks passent par la sanitation configurée", async () => {
  for (const [path, helper] of SINKS) {
    const code = await src(path);
    assert(code.includes(helper), `${path} n'utilise pas ${helper}`);
    assert(!code.includes("DOMPurify.sanitize("), `${path} appelle encore DOMPurify sans configuration`);
  }
});

Deno.test("J9 — DOMPurify reste le moteur de sanitation", async () => {
  const code = await src("src/lib/sanitize-html.ts");
  assert(code.includes('import DOMPurify from "dompurify"'));
  assert(code.includes("MARKDOWN_RICH") && code.includes("MARKDOWN_TEXT_ONLY") && code.includes("EMAIL_PREVIEW"));
});

// ---------- F-25-N / F-14 : rétention ----------

async function retentionSql(): Promise<string> {
  const dir = join(REPO, "supabase", "migrations");
  const files: string[] = [];
  for await (const e of Deno.readDir(dir)) if (e.isFile && e.name.endsWith(".sql")) files.push(e.name);
  files.sort();
  for (const name of files.reverse()) {
    const body = await Deno.readTextFile(join(dir, name));
    if (body.includes("FUNCTION public.purge_retention_logs")) return body;
  }
  throw new Error("migration purge_retention_logs introuvable");
}

Deno.test("N1 — les challenges OTP actifs sont conservés, les expirés +30j supprimés", async () => {
  const sql = await retentionSql();
  assert(
    /DELETE FROM public\.otp_challenges\s+WHERE expires_at < now\(\) - interval '30 days'/.test(sql),
    "purge otp_challenges absente ou non bornée",
  );
  assert(!/DELETE FROM public\.otp_challenges\s*;/.test(sql), "suppression sans condition");
});

Deno.test("N2 — les sessions OTP actives sont conservées, les expirées/révoquées +30j supprimées", async () => {
  const sql = await retentionSql();
  assert(sql.includes("absolute_expires_at < now() - interval '30 days'"));
  assert(sql.includes("revoked_at IS NOT NULL AND revoked_at < now() - interval '30 days'"));
  assert(!/DELETE FROM public\.otp_sessions\s*;/.test(sql));
});

Deno.test("N3 — F-14 : la purge des baux d'envoi est planifiée via la maintenance existante", async () => {
  const sql = await retentionSql();
  assert(sql.includes("public.purge_expired_email_claims()"), "purge des claims non appelée");
  assert(sql.includes("email_send_claims_deleted"), "résultat de purge non rapporté");
});

Deno.test("N4 — la purge reste idempotente, verrouillée et sans effet sur les données métier", async () => {
  const sql = await retentionSql();
  assert(sql.includes("pg_try_advisory_xact_lock(hashtext('public.purge_retention_logs'))"), "verrou consultatif perdu");
  for (const table of [
    "reservations", "client_packages", "session_credits", "package_bookings",
    "package_credit_history", "daily_groups", "crm_client_profiles", "user_roles",
  ]) {
    assert(!new RegExp(`DELETE FROM public\\.${table}\\b`).test(sql), `purge interdite sur ${table}`);
    assert(!new RegExp(`TRUNCATE[^\\n]*${table}\\b`).test(sql), `TRUNCATE interdit sur ${table}`);
  }
});

Deno.test("N5 — toute suppression de la maintenance est bornée par un timestamp", async () => {
  const sql = await retentionSql();
  for (const stmt of sql.split(/;\s*\n/)) {
    if (!/DELETE FROM public\./.test(stmt)) continue;
    assert(/interval '/.test(stmt), `DELETE sans borne de rétention: ${stmt.slice(0, 90)}`);
  }
});

Deno.test("N6 — les notifications admin non lues ne sont jamais supprimées", async () => {
  const sql = await retentionSql();
  assert(
    /DELETE FROM public\.admin_notifications\s+WHERE read_at IS NOT NULL/.test(sql),
    "la purge des notifications doit rester restreinte aux notifications lues",
  );
});
