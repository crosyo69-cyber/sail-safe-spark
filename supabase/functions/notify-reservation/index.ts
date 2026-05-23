import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_NAME = "KiteSurf Passion";
const FROM_DOMAIN = "kitesurfpassion.fr";
const OWNER_EMAIL = "crosyo69@gmail.com";
const LOGO_URL = "https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png";

const ACTIVITY_LABELS: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Pumpfoil",
  foil_tracte: "Foil tracté",
};

const SLOT_LABELS: Record<string, string> = {
  morning: "Matin",
  early_afternoon: "Début d'après-midi",
  late_afternoon: "Fin d'après-midi",
};

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

function escapeHtml(text: string | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

interface ReservationNotification {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  participants: number;
  skill_level: string;
  activity: string;
  time_slot: string;
  date: string;
  source: string;
  type?: "new" | "cancelled";
}

function buildNotificationHtml(data: ReservationNotification): string {
  const isCancellation = data.type === "cancelled";

  const formattedDate = new Date(data.date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sourceBadge = data.source === "admin"
    ? `<span style="background:#DBEAFE;color:#1D4ED8;font-size:11px;padding:3px 8px;border-radius:6px;font-weight:bold;">Admin</span>`
    : `<span style="background:#D1FAE5;color:#065F46;font-size:11px;padding:3px 8px;border-radius:6px;font-weight:bold;">En ligne</span>`;

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Montserrat,Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="background-color:#0F172A;padding:24px 25px;text-align:center;">
      <img src="${LOGO_URL}" alt="KiteSurf Passion" width="180" style="display:block;margin:0 auto;" />
    </td></tr>
    <tr><td style="padding:28px 25px 0;">
      <h1 style="font-size:20px;font-weight:bold;color:#0F172A;margin:0 0 8px;">
        ${isCancellation ? "❌ Annulation d'inscription" : "🆕 Nouvelle inscription"} ${sourceBadge}
      </h1>
      <p style="font-size:14px;color:#64748B;margin:0 0 20px;">
        ${isCancellation ? "Une inscription vient d'être annulée." : "Un stagiaire vient de s'inscrire à une session."}
      </p>
    </td></tr>
    <tr><td style="padding:0 25px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;border-radius:12px;overflow:hidden;">
        <tr style="background:#E2E8F0;">
          <td colspan="2" style="padding:12px 16px;font-size:14px;font-weight:bold;color:#0F172A;">📋 Détails de l'inscription</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:#64748B;border-bottom:1px solid #E2E8F0;width:40%;">Stagiaire</td>
          <td style="padding:10px 16px;font-size:14px;font-weight:bold;color:#0F172A;border-bottom:1px solid #E2E8F0;">${escapeHtml(data.first_name)} ${escapeHtml(data.last_name)}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:#64748B;border-bottom:1px solid #E2E8F0;">Email</td>
          <td style="padding:10px 16px;font-size:14px;color:#0891B2;border-bottom:1px solid #E2E8F0;">
            <a href="mailto:${escapeHtml(data.email)}" style="color:#0891B2;text-decoration:none;">${escapeHtml(data.email)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:#64748B;border-bottom:1px solid #E2E8F0;">Téléphone</td>
          <td style="padding:10px 16px;font-size:14px;color:#0F172A;border-bottom:1px solid #E2E8F0;">
            <a href="tel:${escapeHtml(data.phone)}" style="color:#0891B2;text-decoration:none;">${escapeHtml(data.phone)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:#64748B;border-bottom:1px solid #E2E8F0;">Activité</td>
          <td style="padding:10px 16px;font-size:14px;font-weight:bold;color:#0F172A;border-bottom:1px solid #E2E8F0;">${escapeHtml(ACTIVITY_LABELS[data.activity] || data.activity)}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:#64748B;border-bottom:1px solid #E2E8F0;">Créneau</td>
          <td style="padding:10px 16px;font-size:14px;color:#0F172A;border-bottom:1px solid #E2E8F0;">${formattedDate} — ${escapeHtml(SLOT_LABELS[data.time_slot] || data.time_slot)}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:#64748B;border-bottom:1px solid #E2E8F0;">Participants</td>
          <td style="padding:10px 16px;font-size:14px;font-weight:bold;color:#0F172A;border-bottom:1px solid #E2E8F0;">${data.participants}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:#64748B;">Niveau</td>
          <td style="padding:10px 16px;font-size:14px;color:#0F172A;">${escapeHtml(LEVEL_LABELS[data.skill_level] || data.skill_level)}</td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="background-color:#0F172A;padding:16px 25px;text-align:center;">
      <p style="font-size:12px;color:#94a3b8;margin:0;">📍 Spot de l'Almanarre, Hyères (Var) · Première école de kitesurf du Var depuis 1999</p>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check: only authenticated admins (or service_role) may send
    // owner-notification emails. Prevents anyone with the anon key from
    // spamming the inbox with arbitrary content.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
    const token = authHeader.slice("Bearer ".length).trim();

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // Allow service-role bypass only when the bearer token matches the
    // server-held service-role key exactly (cryptographically verified, since
    // the key is a signed JWT). Decoding the payload alone would let an
    // attacker forge `role: service_role` and bypass auth.
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const isServiceRole = !!token && !!serviceKey && token === serviceKey;

    if (!isServiceRole) {
      const { data: userData, error: userErr } = await authClient.auth.getUser(token);
      if (userErr || !userData?.user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      const { data: isAdmin } = await authClient.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const data: ReservationNotification = await req.json();

    if (!data.first_name || !data.last_name || !data.email || !data.activity || !data.date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Length validation to prevent oversized payloads
    const maxLen = (v: string | undefined, n: number) => !v || v.length <= n;
    if (
      !maxLen(data.first_name, 100) ||
      !maxLen(data.last_name, 100) ||
      !maxLen(data.email, 254) ||
      !maxLen(data.phone, 40) ||
      !maxLen(data.activity, 50) ||
      !maxLen(data.time_slot, 50) ||
      !maxLen(data.skill_level, 50) ||
      !maxLen(data.source, 50) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
      typeof data.participants !== "number" || data.participants < 1 || data.participants > 20
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid field values" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const html = buildNotificationHtml(data);
    const messageId = crypto.randomUUID();
    const runId = crypto.randomUUID();
    const activityLabel = ACTIVITY_LABELS[data.activity] || data.activity;

    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: "reservation_notification",
      recipient_email: OWNER_EMAIL,
      status: "pending",
    });

    const { error: enqueueError } = await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        run_id: runId,
        message_id: messageId,
        to: OWNER_EMAIL,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: FROM_DOMAIN,
        subject: data.type === "cancelled"
          ? `❌ Annulation: ${data.first_name} ${data.last_name} — ${activityLabel}`
          : `🆕 Nouvelle inscription: ${data.first_name} ${data.last_name} — ${activityLabel}`,
        html,
        text: stripHtml(html),
        purpose: "transactional",
        label: "reservation_notification",
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      console.error("Failed to enqueue reservation notification:", enqueueError);
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: "reservation_notification",
        recipient_email: OWNER_EMAIL,
        status: "failed",
        error_message: "Failed to enqueue",
      });
      throw enqueueError;
    }

    console.log(`Reservation notification enqueued for ${data.first_name} ${data.last_name}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Reservation notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
