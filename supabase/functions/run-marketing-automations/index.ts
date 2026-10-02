import { isServiceRoleToken } from "../_shared/service-role-auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_NAME = "KiteSurf Passion";
const FROM_DOMAIN = "kitesurfpassion.fr";
const LOGO_URL =
  "https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png";
const SITE_URL = "https://www.kitesurfpassion.fr";

type Automation = {
  id: string;
  name: string;
  active: boolean;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  required_topic: string | null;
  email_subject: string;
  email_html: string;
  email_cta_label: string | null;
  email_cta_url: string | null;
  delay_days: number;
  priority: number;
  dedupe_window_days: number;
  max_recipients: number;
};

type Candidate = {
  email: string;
  first_name: string | null;
  last_name: string | null;
  dedupe_key: string;
  context: Record<string, unknown>;
};

function escapeHtml(t: string) {
  return String(t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function renderTemplate(tpl: string, c: Candidate): string {
  const ctx = c.context ?? {};
  const vars: Record<string, string> = {
    prenom: c.first_name ?? "",
    nom: c.last_name ?? "",
    email: c.email,
    credits: String(ctx.credits_remaining ?? ""),
    expiration: ctx.next_expiry ? String(ctx.next_expiry).slice(0, 10) : "",
    derniere_seance: ctx.last_date ? String(ctx.last_date).slice(0, 10) : "",
    niveau: String(ctx.level ?? ""),
  };
  return tpl.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, k: string) =>
    escapeHtml(vars[k.toLowerCase()] ?? ""));
}

function wrapEmail(opts: {
  subject: string; bodyHtml: string; ctaLabel?: string | null; ctaUrl?: string | null; token?: string | null;
}) {
  const cta = opts.ctaLabel && opts.ctaUrl
    ? `<tr><td style="padding:0 25px 28px;text-align:center;">
        <a href="${escapeHtml(opts.ctaUrl)}" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:14px 28px;text-decoration:none;">${escapeHtml(opts.ctaLabel)}</a>
      </td></tr>` : "";
  const prefUrl = opts.token
    ? `${SITE_URL}/preferences-marketing?token=${encodeURIComponent(opts.token)}`
    : `${SITE_URL}/preferences-marketing`;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Montserrat,Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;">
  <tr><td style="background:#0F172A;padding:24px;text-align:center;">
    <img src="${LOGO_URL}" alt="KiteSurf Passion" width="180" />
  </td></tr>
  <tr><td style="padding:32px 25px 8px;color:#0F172A;font-size:15px;line-height:1.6;">
    <h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">${escapeHtml(opts.subject)}</h1>
    ${opts.bodyHtml}
  </td></tr>
  ${cta}
  <tr><td style="background:#0F172A;padding:18px 25px;text-align:center;">
    <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;">📍 Hyères / Carqueiranne · Première école du Var depuis 1999</p>
    <p style="font-size:11px;color:#64748b;margin:0;">
      <a href="${prefUrl}" style="color:#94a3b8;">Gérer mes préférences marketing / me désinscrire</a>
    </p>
  </td></tr>
</table></body></html>`;
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let caller = "cron";
  if (!isServiceRoleToken(token)) {

    const { data: userData } = await admin.auth.getUser(token);
    const uid = userData?.user?.id;
    if (!uid) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: uid, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    caller = userData!.user!.email ?? uid;
  }

  let body: { mode?: string; automation_id?: string; preview_limit?: number } = {};
  try { body = await req.json(); } catch { /* cron sends {time} or nothing */ }

  // SÉCURITÉ : mode réel uniquement si explicitement demandé.
  const mode: "test" | "live" = body.mode === "live" ? "live" : "test";
  const previewLimit = Math.min(Math.max(body.preview_limit ?? 20, 1), 100);

  // Sélection des automatisations
  let automations: Automation[] = [];
  if (body.automation_id) {
    const { data, error } = await admin
      .from("marketing_automations").select("*").eq("id", body.automation_id).maybeSingle();
    if (error || !data) {
      return new Response(JSON.stringify({ error: error?.message ?? "Automation introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    automations = [data as Automation];
  } else {
    const { data, error } = await admin.rpc("marketing_automations_due");
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    automations = (data ?? []) as Automation[];
  }

  const report: unknown[] = [];

  for (const a of automations) {
    const startedAt = new Date().toISOString();
    const { data: runRow } = await admin.from("marketing_automation_runs").insert({
      automation_id: a.id, mode, status: "running", triggered_by: caller, started_at: startedAt,
    }).select("id").single();
    const runId = runRow?.id as string | undefined;

    const finish = async (
      status: string,
      recipients: number,
      skipped: number,
      result: Record<string, unknown>,
      error?: string,
      campaignId?: string | null,
    ) => {
      if (runId) {
        await admin.from("marketing_automation_runs").update({
          status, recipients_count: recipients, skipped_count: skipped,
          result, error: error ?? null, campaign_id: campaignId ?? null,
          finished_at: new Date().toISOString(),
        }).eq("id", runId);
      }
      report.push({ automation: a.name, id: a.id, mode, status, recipients, skipped, error });
    };

    try {
      if (mode === "live" && !a.active) {
        await finish("skipped", 0, 0, { reason: "automation inactive" });
        continue;
      }

      const { data: cands, error: candErr } = await admin.rpc("marketing_automation_candidates", {
        p_automation_id: a.id, p_limit: a.max_recipients ?? 500,
      });
      if (candErr) throw new Error(candErr.message);
      const candidates = (cands ?? []) as Candidate[];

      // Anti-doublon : exclut les destinataires déjà servis (même clé ou fenêtre)
      const emails = candidates.map((c) => c.email);
      let sentBefore: { email: string; dedupe_key: string; sent_at: string }[] = [];
      if (emails.length > 0) {
        const since = new Date(Date.now() - (a.dedupe_window_days ?? 30) * 86400000).toISOString();
        const { data: prev } = await admin
          .from("marketing_automation_sends")
          .select("email, dedupe_key, sent_at")
          .eq("automation_id", a.id)
          .in("email", emails)
          .gte("sent_at", since);
        sentBefore = (prev ?? []) as typeof sentBefore;
      }
      const already = new Set(sentBefore.map((s) => `${s.email.toLowerCase()}|${s.dedupe_key}`));
      const alreadyWindow = new Set(sentBefore.map((s) => s.email.toLowerCase()));

      const fresh = candidates.filter((c) =>
        !already.has(`${c.email.toLowerCase()}|${c.dedupe_key}`) &&
        !alreadyWindow.has(c.email.toLowerCase()));
      const skipped = candidates.length - fresh.length;

      if (mode === "test") {
        await finish("success", fresh.length, skipped, {
          dry_run: true,
          eligible: candidates.length,
          preview: fresh.slice(0, previewLimit).map((c) => ({
            email: c.email, first_name: c.first_name, dedupe_key: c.dedupe_key,
            subject: renderTemplate(a.email_subject, c),
          })),
        });
        continue;
      }

      if (fresh.length === 0) {
        await finish("success", 0, skipped, { note: "aucun destinataire éligible" });
        await admin.rpc("marketing_automation_schedule_next", { p_automation_id: a.id });
        continue;
      }

      // Campagne générée (traçabilité)
      const { data: campaign } = await admin.from("marketing_campaigns").insert({
        name: `[Auto] ${a.name} — ${new Date().toISOString().slice(0, 10)}`,
        subject: a.email_subject,
        content_html: a.email_html,
        cta_label: a.email_cta_label,
        cta_url: a.email_cta_url,
        status: "sent",
        recipients_count: fresh.length,
        audience: { automation_id: a.id, trigger: a.trigger_type },
        created_by_email: caller,
      }).select("id").single();

      // Jetons de préférences pour le lien de désinscription
      const { data: prefs } = await admin
        .from("marketing_preferences")
        .select("email, consent")
        .in("email", fresh.map((c) => c.email));
      const tokenByEmail = new Map(
        ((prefs ?? []) as { email: string; consent: boolean }[])
          .map((p) => [p.email.toLowerCase(), p]),
      );

      let sent = 0;
      let refused = 0;
      for (const c of fresh) {
        const pref = tokenByEmail.get(c.email.toLowerCase());
        // Double contrôle du consentement juste avant l'envoi
        if (pref && pref.consent === false) { refused++; continue; }

        // D-4-FIX-2 : jeton de préférences émis en mémoire (hash seul persisté)
        const { data: prefToken } = await admin.rpc("marketing_issue_pref_token", {
          p_email: c.email,
        });

        const messageId = crypto.randomUUID();
        const html = wrapEmail({
          subject: renderTemplate(a.email_subject, c),
          bodyHtml: renderTemplate(a.email_html, c),
          ctaLabel: a.email_cta_label,
          ctaUrl: a.email_cta_url,
          token: (prefToken as string | null) ?? null,
        });
        await admin.from("email_send_log").insert({
          message_id: messageId,
          template_name: `automation_${a.trigger_type}`,
          recipient_email: c.email,
          status: "pending",
        });
        const { error: qErr } = await admin.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            run_id: runId ?? crypto.randomUUID(),
            message_id: messageId,
            to: c.email,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: FROM_DOMAIN,
            subject: renderTemplate(a.email_subject, c),
            html,
            text: stripHtml(html),
            purpose: "marketing",
            label: `automation_${a.trigger_type}`,
            queued_at: new Date().toISOString(),
          },
        });
        if (qErr) { console.error("enqueue error", qErr.message); continue; }
        await admin.from("marketing_automation_sends").insert({
          automation_id: a.id, run_id: runId, email: c.email, dedupe_key: c.dedupe_key,
        });
        sent++;
      }

      await finish("success", sent, skipped + refused, {
        eligible: candidates.length, refused_consent: refused,
      }, undefined, campaign?.id ?? null);
      await admin.rpc("marketing_automation_schedule_next", { p_automation_id: a.id });
    } catch (e) {
      await finish("error", 0, 0, {}, e instanceof Error ? e.message : String(e));
    }
  }

  return new Response(JSON.stringify({ mode, processed: automations.length, report }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
