import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_BASE = "https://api.brevo.com/v3";

const ACTIVITY_ATTRS: Record<string, string> = {
  kitesurf: "KITESURF",
  wingfoil: "WINGFOIL",
  pumpfoil: "PUMPFOIL",
  foil_tracte: "FOIL_TRACTE",
  stage_100_glisse: "STAGE",
};

const ATTRIBUTES: Array<{ name: string; type: "text" | "date" | "float" | "boolean" }> = [
  { name: "PRENOM", type: "text" },
  { name: "NOM", type: "text" },
  { name: "TELEPHONE", type: "text" },
  { name: "ACTIVITES", type: "text" },
  { name: "CREDITS_DISPONIBLES", type: "float" },
  { name: "PREMIERE_RESERVATION", type: "date" },
  { name: "DERNIERE_RESERVATION", type: "date" },
  { name: "CONSENTEMENT_MARKETING", type: "boolean" },
  { name: "CLIENT_ACTIF", type: "boolean" },
  { name: "CLIENT_INACTIF", type: "boolean" },
  { name: "KITESURF", type: "boolean" },
  { name: "WINGFOIL", type: "boolean" },
  { name: "PUMPFOIL", type: "boolean" },
  { name: "FOIL_TRACTE", type: "boolean" },
  { name: "STAGE", type: "boolean" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function brevo(apiKey: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${BREVO_BASE}${path}`, {
    ...init,
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startedAt = new Date();
  const t0 = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // --- Auth: admins only (or service-role for automated validation) ------
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const admin = createClient(supabaseUrl, serviceKey);
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (token === serviceKey) {
      userEmail = "service-role";
    } else {
      const authClient = createClient(supabaseUrl, anonKey);
      const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);

      userId = claimsData.claims.sub as string;
      userEmail = (claimsData.claims.email as string | undefined) ?? null;

      const { data: isAdmin, error: roleError } = await admin.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (roleError || !isAdmin) return json({ error: "Forbidden" }, 403);
    }

    const apiKey = Deno.env.get("BREVO_API_KEY");
    if (!apiKey) return json({ error: "BREVO_API_KEY non configurée" }, 400);

    // --- Settings ----------------------------------------------------------
    const { data: settings } = await admin
      .from("marketing_settings")
      .select("brevo_list_id, mode")
      .eq("id", 1)
      .maybeSingle();

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const mode: string = body.mode ?? settings?.mode ?? "test";
    const listId: number | null = body.listId ?? settings?.brevo_list_id ?? null;
    const dryRun = mode !== "production";
    const rawLimit = Number(body.limit);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : null;

    // --- Probe: read-only check of Brevo credentials + attribute schema ----
    if (body.action === "probe") {
      const account = await brevo(apiKey, "/account");
      const attrs = await brevo(apiKey, "/contacts/attributes");
      return json({
        action: "probe",
        api_key_configured: true,
        account_ok: account.ok,
        account_status: account.status,
        attributes_ok: attrs.ok,
        attributes_status: attrs.status,
        attributes: attrs.ok ? JSON.parse(attrs.body) : attrs.body.slice(0, 500),
      });
    }

    // --- Candidates --------------------------------------------------------
    // --- Verify: read-back of TEST_VALIDATION contacts from Brevo ----------
    if (body.action === "verify") {
      const { data: testProfiles } = await admin
        .from("crm_client_profiles")
        .select("email")
        .eq("is_test", true)
        .eq("marketing_consent_source", "TEST_VALIDATION")
        .order("email");
      const results: Array<Record<string, unknown>> = [];
      for (const p of testProfiles ?? []) {
        const res = await brevo(apiKey, `/contacts/${encodeURIComponent(p.email)}`);
        results.push(
          res.ok
            ? { email: p.email, found: true, attributes: JSON.parse(res.body).attributes }
            : { email: p.email, found: false, status: res.status, error: res.body.slice(0, 200) },
        );
      }
      return json({ action: "verify", count: results.length, results });
    }

    // --- Cleanup: remove TEST_VALIDATION contacts from Brevo + database -----
    if (body.action === "cleanup_test") {
      const { data: testProfiles, error: cleanupError } = await admin
        .from("crm_client_profiles")
        .select("id, email")
        .eq("is_test", true)
        .eq("marketing_consent_source", "TEST_VALIDATION")
        .order("email");
      if (cleanupError) throw new Error(`profils de test: ${cleanupError.message}`);

      const results: Array<Record<string, unknown>> = [];
      let brevoDeleted = 0, brevoMissing = 0, brevoErrors = 0;

      for (const p of testProfiles ?? []) {
        const res = await brevo(apiKey, `/contacts/${encodeURIComponent(p.email)}`, "DELETE");
        if (res.ok || res.status === 204) {
          brevoDeleted++;
          results.push({ email: p.email, brevo: "supprimé" });
        } else if (res.status === 404) {
          brevoMissing++;
          results.push({ email: p.email, brevo: "introuvable" });
        } else {
          brevoErrors++;
          results.push({ email: p.email, brevo: "erreur", status: res.status, error: res.body.slice(0, 200) });
        }
      }

      let dbDeleted = 0;
      if ((testProfiles ?? []).length > 0) {
        const { data: deletedRows, error: delError } = await admin
          .from("crm_client_profiles")
          .delete()
          .eq("is_test", true)
          .eq("marketing_consent_source", "TEST_VALIDATION")
          .select("id");
        if (delError) throw new Error(`suppression base: ${delError.message}`);
        dbDeleted = (deletedRows ?? []).length;
      }

      return json({
        action: "cleanup_test",
        db_deleted: dbDeleted,
        brevo_deleted: brevoDeleted,
        brevo_not_found: brevoMissing,
        brevo_errors: brevoErrors,
        results,
      });
    }

    const { data: clients, error: clientsError } = await admin.rpc("crm_client_base");
    if (clientsError) throw new Error(`crm_client_base: ${clientsError.message}`);

    const { data: suppressed } = await admin.from("suppressed_emails").select("email");
    const blocked = new Set((suppressed ?? []).map((s: { email: string }) => s.email.toLowerCase()));

    type Client = {
      email: string; first_name: string | null; last_name: string | null; phone: string | null;
      first_date: string | null; last_date: string | null; credits_remaining: number | null;
      activities: string[] | null; marketing_consent: boolean | null;
    };

    const details: Array<Record<string, unknown>> = [];
    let skipped = 0;

    const testOnly = body.test_only === true;

    let candidates = ((clients ?? []) as Client[]).filter((c) => {
      const email = (c.email ?? "").trim().toLowerCase();
      if (!c.marketing_consent) { skipped++; return false; }
      if (!EMAIL_RE.test(email)) {
        skipped++;
        details.push({ email, status: "ignoré", reason: "email invalide" });
        return false;
      }
      if (blocked.has(email)) {
        skipped++;
        details.push({ email, status: "ignoré", reason: "email supprimé / en liste de suppression" });
        return false;
      }
      return true;
    });

    // --- Test-validation mode: only TEST_VALIDATION profiles ----------------
    if (testOnly) {
      skipped = 0;
      details.length = 0;
      const { data: testProfiles, error: testError } = await admin
        .from("crm_client_profiles")
        .select("email, first_name, last_name, phone, marketing_consent, test_activities, test_credits, test_first_date, test_last_date")
        .eq("is_test", true)
        .eq("marketing_consent_source", "TEST_VALIDATION")
        .eq("marketing_consent", true)
        .order("email");
      if (testError) throw new Error(`profils de test: ${testError.message}`);
      candidates = (testProfiles ?? []).map((p) => ({
        email: p.email,
        first_name: p.first_name,
        last_name: p.last_name,
        phone: p.phone,
        first_date: p.test_first_date,
        last_date: p.test_last_date,
        credits_remaining: p.test_credits,
        activities: p.test_activities,
        marketing_consent: true,
      })) as Client[];
    }

    if (limit) candidates = candidates.slice(0, limit);

    let created = 0, updated = 0, errors = 0;

    // --- Ensure Brevo attributes exist (idempotent) -------------------------
    if (!dryRun) {
      for (const attr of ATTRIBUTES) {
        const res = await brevo(apiKey, `/contacts/attributes/normal/${attr.name}`, {
          method: "POST",
          body: JSON.stringify({ type: attr.type }),
        });
        // 400 "already exists" is expected on subsequent runs
        if (!res.ok && res.status !== 400) {
          console.error(`Attribut ${attr.name} [${res.status}]: ${res.body}`);
        }
      }
    }

    const now = Date.now();
    const ACTIVE_WINDOW_MS = 365 * 24 * 3600 * 1000;

    for (const c of candidates) {
      const email = c.email.trim().toLowerCase();
      const acts = (c.activities ?? []).filter(Boolean);
      const lastTs = c.last_date ? new Date(c.last_date).getTime() : 0;
      const isActive = lastTs > 0 && now - lastTs <= ACTIVE_WINDOW_MS;

      const attributes: Record<string, unknown> = {
        PRENOM: c.first_name ?? "",
        NOM: c.last_name ?? "",
        TELEPHONE: c.phone ?? "",
        ACTIVITES: acts.join(", "),
        CREDITS_DISPONIBLES: Number(c.credits_remaining ?? 0),
        PREMIERE_RESERVATION: c.first_date ?? null,
        DERNIERE_RESERVATION: c.last_date ?? null,
        CONSENTEMENT_MARKETING: true,
        CLIENT_ACTIF: isActive,
        CLIENT_INACTIF: !isActive,
        KITESURF: false, WINGFOIL: false, PUMPFOIL: false, FOIL_TRACTE: false, STAGE: false,
      };
      for (const a of acts) {
        const key = ACTIVITY_ATTRS[a];
        if (key) attributes[key] = true;
      }

      if (dryRun) {
        details.push({ email, status: "simulé (mode test)", attributes });
        continue;
      }

      const existing = await brevo(apiKey, `/contacts/${encodeURIComponent(email)}`);
      const exists = existing.ok;

      let res;
      if (exists) {
        res = await brevo(apiKey, `/contacts/${encodeURIComponent(email)}`, {
          method: "PUT",
          body: JSON.stringify({
            attributes,
            ...(listId ? { listIds: [listId] } : {}),
          }),
        });
      } else {
        res = await brevo(apiKey, `/contacts`, {
          method: "POST",
          body: JSON.stringify({
            email,
            attributes,
            updateEnabled: true,
            ...(listId ? { listIds: [listId] } : {}),
          }),
        });
      }

      if (res.ok) {
        if (exists) { updated++; details.push({ email, status: "mis à jour" }); }
        else { created++; details.push({ email, status: "créé" }); }
      } else {
        errors++;
        console.error(`Brevo ${email} [${res.status}]: ${res.body}`);
        details.push({ email, status: "erreur", http_status: res.status, error: res.body.slice(0, 300) });
      }
    }

    const durationMs = Date.now() - t0;
    const report = {
      mode,
      dry_run: dryRun,
      list_id: listId,
      total_candidates: candidates.length,
      created,
      updated,
      skipped,
      errors,
      duration_ms: durationMs,
      details,
    };

    const { data: logRow } = await admin.from("marketing_sync_logs").insert({
      started_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: durationMs,
      performed_by: userId,
      performed_by_email: userEmail,
      mode,
      total_candidates: candidates.length,
      created_count: created,
      updated_count: updated,
      skipped_count: skipped,
      error_count: errors,
      details: details.slice(0, 500),
    }).select("id").maybeSingle();

    if (!dryRun) {
      await admin.from("marketing_settings").update({ last_sync_at: new Date().toISOString() }).eq("id", 1);
    }

    return json({ ...report, log_id: logRow?.id ?? null });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("sync-brevo-contacts failed:", message);
    return json({ error: message }, 500);
  }
});