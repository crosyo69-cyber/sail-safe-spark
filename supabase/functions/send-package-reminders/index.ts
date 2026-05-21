import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_NAME = "KiteSurf Passion";
const FROM_DOMAIN = "kitesurfpassion.fr";
const LOGO_URL =
  "https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png";

function escapeHtml(t: string) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function buildReminderEmail(opts: {
  firstName: string;
  activity: string;
  dateLabel: string;
  timeSlot: string;
  packageCode: string;
}) {
  const { firstName, activity, dateLabel, timeSlot, packageCode } = opts;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
  <tr><td style="background:#0F172A;padding:24px;text-align:center;">
    <img src="${LOGO_URL}" alt="KiteSurf Passion" width="180" />
  </td></tr>
  <tr><td style="padding:32px 25px 0;">
    <h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Rappel : votre session ${escapeHtml(activity)} dans 2 jours 🪁</h1>
    <p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">
      Bonjour ${escapeHtml(firstName)}, votre session est programmée le <strong>${escapeHtml(dateLabel)}</strong> (${escapeHtml(timeSlot)}).
    </p>
    <p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 20px;">
      📞 Appelez-nous la veille au <a href="tel:0672716905" style="color:#0891B2;font-weight:bold;">06 72 71 69 05</a> pour confirmer le créneau selon la météo.
    </p>
  </td></tr>
  <tr><td style="padding:0 25px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0891B2,#0F172A);border-radius:12px;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0 0 8px;color:#bae6fd;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Votre code</p>
        <p style="margin:0 0 14px;color:#fff;font-size:24px;font-weight:bold;letter-spacing:3px;font-family:Menlo,monospace;">${escapeHtml(packageCode)}</p>
        <a href="https://www.kitesurfpassion.fr/mon-espace/${encodeURIComponent(packageCode)}" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;">Gérer ma réservation</a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#0F172A;padding:16px 25px;text-align:center;">
    <p style="font-size:12px;color:#94a3b8;margin:0;">📍 Spot de l'Almanarre, Hyères · Première école du Var depuis 1999</p>
  </td></tr>
</table></body></html>`;
}

async function enqueueEmail(
  supabase: any,
  to: string,
  subject: string,
  html: string,
  templateName: string,
) {
  const messageId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: to,
    status: "pending",
  });
  const { error } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      run_id: runId,
      message_id: messageId,
      to,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: FROM_DOMAIN,
      subject,
      html,
      text: stripHtml(html),
      purpose: "transactional",
      label: templateName,
      queued_at: new Date().toISOString(),
    },
  });
  if (error) {
    console.error("enqueue error", error);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Restrict to service-role callers (cron only).
  {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    let role: string | undefined;
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(
          atob(parts[1].replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(parts[1].length / 4) * 4, "=")),
        );
        role = payload?.role;
      }
    } catch { /* ignore */ }
    if (role !== "service_role") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Target date = today + 2 days (Europe/Paris assumed via server)
  const today = new Date();
  const target = new Date(today);
  target.setDate(target.getDate() + 2);
  const targetDate = target.toISOString().split("T")[0];

  const { data: bookings, error } = await supabase
    .from("package_bookings")
    .select(
      "id, status, sessions:session_id (date, time_slot, activity), package:package_id (package_code, first_name, email)",
    )
    .eq("status", "confirmed");

  if (error) {
    console.error("query error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  const slotLabels: Record<string, string> = {
    morning: "Matin",
    afternoon: "Après-midi",
    fullday: "Journée complète",
  };

  for (const b of bookings || []) {
    const s = (b as any).sessions;
    const p = (b as any).package;
    if (!s || !p?.email || s.date !== targetDate) continue;

    // Dedupe via email_send_log on a deterministic message_id key check
    const { data: existing } = await supabase
      .from("email_send_log")
      .select("id")
      .eq("template_name", "package_reminder")
      .eq("recipient_email", p.email)
      .filter("metadata->>booking_id", "eq", b.id)
      .limit(1);
    if (existing && existing.length > 0) continue;

    const html = buildReminderEmail({
      firstName: p.first_name || "",
      activity: s.activity,
      dateLabel: new Date(s.date).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      timeSlot: slotLabels[s.time_slot] || s.time_slot,
      packageCode: p.package_code,
    });

    const ok = await enqueueEmail(
      supabase,
      p.email,
      `Rappel : votre session ${s.activity} dans 2 jours`,
      html,
      "package_reminder",
    );
    if (ok) {
      await supabase.from("email_send_log").insert({
        message_id: crypto.randomUUID(),
        template_name: "package_reminder",
        recipient_email: p.email,
        status: "pending",
        metadata: { booking_id: b.id, session_date: s.date },
      });
      sent++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, target_date: targetDate, sent }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});