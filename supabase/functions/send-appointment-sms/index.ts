// SMS manuels de rendez-vous (spot/horaire) via l'API SMS transactionnels Brevo.
// Jamais d'envoi automatique : chaque requête vient d'une confirmation explicite
// du moniteur dans l'administration. Journalisation dans public.sms_send_log avec
// protection anti-doublon en base (index unique partiel sur dedupe_key).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_BASE = "https://api.brevo.com/v3";
const MAX_MESSAGE_LEN = 459; // 3 SMS concaténés max
const DEFAULT_SENDER = "Kitesurf"; // expéditeur alphanumérique (11 car. max)

// ---------- Types injectables (tests : aucun appel réseau réel) ----------

export interface SmsUserClient {
  auth: { getUser: () => Promise<{ data: { user: { id: string; email?: string | null } | null } }> };
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
}

export type InsertPreparedResult =
  | { ok: true; id: string }
  | { ok: false; duplicate: boolean; error?: string };

export interface SmsLogStore {
  insertPrepared(row: Record<string, unknown>): Promise<InsertPreparedResult>;
  setStatus(id: string, status: string, fields?: Record<string, unknown>): Promise<void>;
}

export interface SmsDeps {
  createUserClient: (authHeader: string) => SmsUserClient;
  store: SmsLogStore;
  brevoFetch: typeof fetch;
  env: (key: string) => string | undefined;
  /**
   * Vérification serveur d'éligibilité : true UNIQUEMENT si la réservation
   * (visiteur) ou l'inscription (forfait) existe avec status = 'confirmed'
   * et, si un groupe est fourni, appartient à ce groupe. Tout autre statut,
   * une erreur de lecture ou une ligne absente → false (fail-closed).
   */
  checkRecipient: (kind: RecipientKind, bookingId: string, groupId: string | null) => Promise<boolean>;
}

// ---------- Utilitaires exportés (testés) ----------

/** Normalise un mobile français : 06/07XXXXXXXX ou variantes → +336/7XXXXXXXX. */
export function normalizeFrMobile(raw: unknown): string | null {
  const digits = String(raw ?? "").replace(/[\s.\-()]/g, "");
  if (/^0[67]\d{8}$/.test(digits)) return "+33" + digits.slice(1);
  if (/^\+33[67]\d{8}$/.test(digits)) return digits;
  if (/^33[67]\d{8}$/.test(digits)) return "+" + digits;
  return null;
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const dedupeKeyOf = (
  date: string,
  groupId: string | null,
  reservationRef: string,
  message: string,
): Promise<string> => sha256Hex(`${date}|${groupId ?? "day"}|${reservationRef}|${message}`);

// ---------- Validation manuelle du corps (pas de dépendance externe) ----------

export type RecipientKind = "visitor" | "package";
interface RecipientInput { kind: RecipientKind; bookingId: string; name: string; phone: string }
interface ParsedBody {
  date: string;
  activity: string | null;
  groupId: string | null;
  spot: string;
  horaire: string;
  message: string;
  resend: boolean;
  recipients: RecipientInput[];
}

const ACTIVITIES = new Set(["kitesurf", "wingfoil", "pumpfoil", "foil_tracte", "stage_100_glisse"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseBody(raw: unknown): { ok: true; body: ParsedBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Corps de requête invalide." };
  const r = raw as Record<string, unknown>;
  const date = String(r.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Date invalide (AAAA-MM-JJ attendue)." };
  const activity = r.activity == null ? null : String(r.activity);
  if (activity !== null && !ACTIVITIES.has(activity)) return { ok: false, error: "Activité inconnue." };
  const groupId = r.groupId == null ? null : String(r.groupId);
  if (groupId !== null && !UUID_RE.test(groupId)) return { ok: false, error: "Identifiant de groupe invalide." };
  // Spot et horaire sont des champs obligatoires et validés serveur ; le
  // contenu éditable du SMS ne fait jamais foi.
  const spot = String(r.spot ?? "").trim();
  if (spot.length < 1 || spot.length > 120) {
    return { ok: false, error: "Spot obligatoire (1 à 120 caractères)." };
  }
  const horaire = String(r.horaire ?? "").trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horaire)) {
    return { ok: false, error: "Horaire obligatoire au format HH:MM (ex. 09:30)." };
  }
  const message = String(r.message ?? "").trim();
  if (message.length < 1 || message.length > MAX_MESSAGE_LEN) {
    return { ok: false, error: `Message requis (1 à ${MAX_MESSAGE_LEN} caractères).` };
  }
  const list = Array.isArray(r.recipients) ? r.recipients : null;
  if (!list || list.length < 1 || list.length > 50) {
    return { ok: false, error: "Liste de destinataires invalide (1 à 50)." };
  }
  const recipients: RecipientInput[] = [];
  for (const item of list) {
    const it = item as Record<string, unknown>;
    const kind = it.kind === "visitor" || it.kind === "package" ? it.kind : null;
    const bookingId = String(it.bookingId ?? "");
    // Fail-closed : tout destinataire sans référence de réservation vérifiable
    // est rejeté avant tout envoi.
    if (kind === null || !UUID_RE.test(bookingId)) {
      return { ok: false, error: "Destinataire sans référence de réservation valide." };
    }
    recipients.push({
      kind,
      bookingId,
      name: String(it.name ?? "").slice(0, 120),
      phone: String(it.phone ?? ""),
    });
  }
  return { ok: true, body: { date, activity, groupId, spot, horaire, message, resend: r.resend === true, recipients } };
}

// ---------- Réponses JSON ----------

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------- Gestionnaire principal ----------

export function createHandler(deps: SmsDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

    // 1. Authentification administrateur (mécanisme existant : session + has_role).
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Authentification requise." }, 401);
    const userClient = deps.createUserClient(authHeader);
    const { data: u } = await userClient.auth.getUser();
    const user = u.user;
    if (!user) return json({ error: "Session invalide ou expirée." }, 401);
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (isAdmin !== true) return json({ error: "Accès réservé aux administrateurs." }, 403);

    // 2. Validation du corps.
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return json({ error: "Corps JSON illisible." }, 400);
    }
    const parsed = parseBody(rawBody);
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const body = parsed.body;

    // 3. Normalisation des numéros français avant tout envoi.
    const normalized: { input: RecipientInput; to: string }[] = [];
    for (const rec of body.recipients) {
      const to = normalizeFrMobile(rec.phone);
      if (!to) {
        return json({ error: `Numéro invalide pour ${rec.name || "un destinataire"} : mobile français attendu.` }, 400);
      }
      normalized.push({ input: rec, to });
    }

    // 4. Pré-contrôles Brevo : clé, expéditeur et compte joignable/crédits.
    const apiKey = deps.env("BREVO_API_KEY");
    if (!apiKey) return json({ error: "Clé Brevo absente : configurez BREVO_API_KEY." }, 500);
    const sender = (deps.env("BREVO_SMS_SENDER") ?? "").trim() || DEFAULT_SENDER;
    let credits: number | null = null;
    try {
      const account = await deps.brevoFetch(`${BREVO_BASE}/account`, {
        headers: { "api-key": apiKey, accept: "application/json" },
      });
      if (!account.ok) {
        const t = await account.text().catch(() => "");
        return json({ error: `Compte Brevo injoignable ou clé refusée (${account.status}).`, details: t.slice(0, 300) }, 502);
      }
      const acc = (await account.json().catch(() => null)) as Record<string, unknown> | null;
      const rawCredits = acc?.["smsCredits"];
      if (typeof rawCredits === "number") credits = rawCredits;
    } catch {
      // Fail-closed : impossible de vérifier la configuration → rien n'est envoyé.
      return json({ error: "Vérification du compte Brevo impossible : envoi annulé." }, 502);
    }
    if (credits !== null && credits < normalized.length) {
      return json({ error: `Crédits SMS insuffisants sur le compte Brevo (${credits} restant(s)).` }, 402);
    }

    // 5. Éligibilité stricte côté serveur : status = 'confirmed' exigé pour
    // chaque destinataire (réservation visiteur ou inscription forfait).
    // Tout autre statut (pending, cancelled, …), une ligne absente ou une
    // erreur de lecture = destinataire exclu, jamais envoyé.
    const eligible: { input: RecipientInput; to: string }[] = [];
    const results: Record<string, unknown>[] = [];
    let ineligible = 0;
    for (const item of normalized) {
      let ok = false;
      try {
        ok = await deps.checkRecipient(item.input.kind, item.input.bookingId, body.groupId);
      } catch {
        ok = false; // fail-closed
      }
      if (!ok) {
        ineligible++;
        results.push({ name: item.input.name, phone_last4: item.to.slice(-4), status: "ineligible", error: "Réservation non confirmée ou introuvable : exclue." });
      } else {
        eligible.push(item);
      }
    }
    if (eligible.length === 0) {
      return json({ results, sent: 0, skipped: 0, failed: 0, ineligible, error: "Aucun destinataire confirmé : rien n'a été envoyé." }, 422);
    }

    // 6. Envoi séquentiel avec journalisation et protection anti-doublon.
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const { input, to } of eligible) {
      const dedupeKey = await dedupeKeyOf(body.date, body.groupId, input.bookingId, body.message);
      const baseRow = {
        kind: "appointment",
        status: "prepared",
        date: body.date,
        activity: body.activity,
        daily_group_id: body.groupId,
        reservation_id: input.kind === "visitor" ? input.bookingId : null,
        recipient_name: input.name || null,
        phone_last4: to.slice(-4),
        message: body.message,
        dedupe_key: dedupeKey,
        is_resend: body.resend,
        sent_by: user.id,
        sent_by_email: user.email ?? null,
      };

      const ins = await deps.store.insertPrepared(baseRow);
      if (!ins.ok) {
        if (ins.duplicate) {
          skipped++;
          results.push({ name: input.name, phone_last4: to.slice(-4), status: "duplicate" });
        } else {
          failed++;
          results.push({ name: input.name, phone_last4: to.slice(-4), status: "failed", error: "Journal indisponible." });
        }
        continue;
      }

      await deps.store.setStatus(ins.id, "sending");
      try {
        const res = await deps.brevoFetch(`${BREVO_BASE}/transactionalSMS/sms`, {
          method: "POST",
          headers: { "api-key": apiKey, "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify({ sender, recipient: to, content: body.message, type: "transactional" }),
        });
        if (res.ok) {
          const payload = (await res.json().catch(() => null)) as { messageId?: string | number } | null;
          const messageId = payload?.messageId != null ? String(payload.messageId) : null;
          await deps.store.setStatus(ins.id, "sent", { message_id: messageId });
          sent++;
          results.push({ name: input.name, phone_last4: to.slice(-4), status: "sent", messageId });
        } else {
          const t = await res.text().catch(() => "");
          await deps.store.setStatus(ins.id, "failed", { error: `Brevo ${res.status}: ${t.slice(0, 300)}` });
          failed++;
          results.push({ name: input.name, phone_last4: to.slice(-4), status: "failed", error: `Refus Brevo (${res.status}).` });
        }
      } catch {
        // Réponse incertaine : le SMS a pu partir. Jamais de renvoi automatique.
        await deps.store.setStatus(ins.id, "unknown", { error: "Réponse Brevo incertaine (timeout/réseau)." });
        failed++;
        results.push({ name: input.name, phone_last4: to.slice(-4), status: "unknown", error: "Réponse incertaine : aucun renvoi automatique." });
      }
    }

    return json({ results, sent, skipped, failed });
  };
}

// ---------- Câblage production ----------

function buildProductionDeps(): SmsDeps {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const service = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return {
    createUserClient: (authHeader) =>
      createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      }) as unknown as SmsUserClient,
    store: {
      async insertPrepared(row) {
        const { data, error } = await service.from("sms_send_log").insert(row).select("id").single();
        if (error) {
          return { ok: false, duplicate: (error as { code?: string }).code === "23505", error: error.message };
        }
        return { ok: true, id: String((data as { id: string }).id) };
      },
      async setStatus(id, status, fields) {
        await service.from("sms_send_log").update({ status, ...(fields ?? {}), updated_at: new Date().toISOString() }).eq("id", id);
      },
    },
    brevoFetch: fetch,
    env: (key) => Deno.env.get(key),
  };
}

if (import.meta.main !== false) {
  Deno.serve(createHandler(buildProductionDeps()));
}
