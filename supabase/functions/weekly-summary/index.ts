import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

const ACTIVITY_COLORS: Record<string, string> = {
  kitesurf: "#0891B2",
  wingfoil: "#F97316",
  pumpfoil: "#14B8A6",
  foil_tracte: "#1E3A5F",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

interface SessionData {
  id: string;
  date: string;
  activity: string;
  time_slot: string;
  max_participants: number;
  status: string;
  reservations: { id: string; status: string; participants: number; first_name: string; last_name: string }[];
}

function buildSummaryHtml(
  sessions: SessionData[],
  weekStart: string,
  weekEnd: string,
): string {
  // Global stats
  const totalSessions = sessions.length;
  const openSessions = sessions.filter((s) => s.status === "open").length;
  const closedSessions = totalSessions - openSessions;

  const totalCapacity = sessions.reduce((a, s) => a + s.max_participants, 0);
  const totalBooked = sessions.reduce((a, s) => {
    const active = s.reservations.filter((r) => r.status === "confirmed" || r.status === "pending");
    return a + active.reduce((b, r) => b + r.participants, 0);
  }, 0);
  const globalRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

  // Per-activity stats
  const activityStats: Record<string, { capacity: number; booked: number; sessions: number }> = {};
  for (const s of sessions) {
    if (!activityStats[s.activity]) activityStats[s.activity] = { capacity: 0, booked: 0, sessions: 0 };
    activityStats[s.activity].capacity += s.max_participants;
    activityStats[s.activity].sessions += 1;
    const active = s.reservations.filter((r) => r.status === "confirmed" || r.status === "pending");
    activityStats[s.activity].booked += active.reduce((b, r) => b + r.participants, 0);
  }

  const activityRows = Object.entries(activityStats)
    .map(([act, stats]) => {
      const rate = stats.capacity > 0 ? Math.round((stats.booked / stats.capacity) * 100) : 0;
      const color = ACTIVITY_COLORS[act] || "#666";
      const barColor = rate < 50 ? "#EAB308" : rate < 80 ? "#0891B2" : "#22C55E";
      return `
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:#0F172A;border-bottom:1px solid #E2E8F0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;vertical-align:middle;"></span>
            ${ACTIVITY_LABELS[act] || act}
          </td>
          <td style="padding:10px 16px;font-size:14px;color:#64748B;text-align:center;border-bottom:1px solid #E2E8F0;">${stats.sessions}</td>
          <td style="padding:10px 16px;font-size:14px;color:#0F172A;font-weight:bold;text-align:center;border-bottom:1px solid #E2E8F0;">${stats.booked}/${stats.capacity}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #E2E8F0;">
            <div style="background:#E2E8F0;border-radius:4px;height:8px;width:80px;">
              <div style="background:${barColor};border-radius:4px;height:8px;width:${rate}%;"></div>
            </div>
            <span style="font-size:12px;color:${barColor};font-weight:bold;">${rate}%</span>
          </td>
        </tr>`;
    })
    .join("");

  // Daily breakdown
  const sessionsByDate: Record<string, SessionData[]> = {};
  for (const s of sessions) {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
    sessionsByDate[s.date].push(s);
  }

  const dailyRows = Object.entries(sessionsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, daySessions]) => {
      const dayCap = daySessions.reduce((a, s) => a + s.max_participants, 0);
      const dayBooked = daySessions.reduce((a, s) => {
        const active = s.reservations.filter((r) => r.status === "confirmed" || r.status === "pending");
        return a + active.reduce((b, r) => b + r.participants, 0);
      }, 0);
      const dayRate = dayCap > 0 ? Math.round((dayBooked / dayCap) * 100) : 0;
      const barColor = dayRate < 50 ? "#EAB308" : dayRate < 80 ? "#0891B2" : "#22C55E";

      const sessionDetails = daySessions
        .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
        .map((s) => {
          const active = s.reservations.filter((r) => r.status === "confirmed" || r.status === "pending");
          const booked = active.reduce((b, r) => b + r.participants, 0);
          const color = ACTIVITY_COLORS[s.activity] || "#666";
          const statusBadge = s.status === "closed"
            ? `<span style="background:#FEE2E2;color:#DC2626;font-size:10px;padding:2px 6px;border-radius:4px;margin-left:6px;">Fermée</span>`
            : "";
          return `<span style="display:inline-block;margin:2px 4px;font-size:12px;color:#64748B;">
            <span style="color:${color};font-weight:bold;">${ACTIVITY_LABELS[s.activity] || s.activity}</span>
            ${SLOT_LABELS[s.time_slot] || s.time_slot} ${booked}/${s.max_participants}${statusBadge}
          </span>`;
        })
        .join(" · ");

      return `
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:#0F172A;font-weight:600;border-bottom:1px solid #E2E8F0;white-space:nowrap;vertical-align:top;">${formatDate(date)}</td>
          <td style="padding:10px 16px;font-size:14px;border-bottom:1px solid #E2E8F0;vertical-align:top;">
            <div style="margin-bottom:4px;">
              <span style="font-weight:bold;color:#0F172A;">${dayBooked}/${dayCap}</span>
              <span style="color:${barColor};font-weight:bold;margin-left:8px;">${dayRate}%</span>
            </div>
            <div>${sessionDetails}</div>
          </td>
        </tr>`;
    })
    .join("");

  const rateColor = globalRate < 50 ? "#EAB308" : globalRate < 80 ? "#0891B2" : "#22C55E";

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:Montserrat,Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px;margin:0 auto;background:#ffffff;">
    <tr><td style="background-color:#0F172A;padding:24px 25px;text-align:center;">
      <img src="${LOGO_URL}" alt="KiteSurf Passion" width="180" style="display:block;margin:0 auto;" />
    </td></tr>

    <tr><td style="padding:28px 25px 0;">
      <h1 style="font-size:22px;font-weight:bold;color:#0F172A;margin:0 0 6px;">📊 Résumé hebdomadaire</h1>
      <p style="font-size:14px;color:#64748B;margin:0 0 24px;">Semaine du ${formatDate(weekStart)} au ${formatDate(weekEnd)}</p>
    </td></tr>

    <!-- Global Stats -->
    <tr><td style="padding:0 25px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:10px 0;">
        <tr>
          <td style="background:#F1F5F9;border-radius:12px;padding:16px;text-align:center;width:25%;">
            <div style="font-size:28px;font-weight:bold;color:#0F172A;">${totalSessions}</div>
            <div style="font-size:12px;color:#64748B;margin-top:4px;">Sessions</div>
          </td>
          <td style="background:#F1F5F9;border-radius:12px;padding:16px;text-align:center;width:25%;">
            <div style="font-size:28px;font-weight:bold;color:#0F172A;">${totalBooked}</div>
            <div style="font-size:12px;color:#64748B;margin-top:4px;">Inscrits</div>
          </td>
          <td style="background:#F1F5F9;border-radius:12px;padding:16px;text-align:center;width:25%;">
            <div style="font-size:28px;font-weight:bold;color:${rateColor};">${globalRate}%</div>
            <div style="font-size:12px;color:#64748B;margin-top:4px;">Remplissage</div>
          </td>
          <td style="background:#F1F5F9;border-radius:12px;padding:16px;text-align:center;width:25%;">
            <div style="font-size:28px;font-weight:bold;color:#0F172A;">${closedSessions}</div>
            <div style="font-size:12px;color:#64748B;margin-top:4px;">Fermées</div>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Per Activity -->
    <tr><td style="padding:0 25px 24px;">
      <h2 style="font-size:16px;font-weight:bold;color:#0F172A;margin:0 0 12px;">Par activité</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:12px;overflow:hidden;">
        <tr style="background:#E2E8F0;">
          <td style="padding:8px 16px;font-size:12px;font-weight:bold;color:#64748B;">Activité</td>
          <td style="padding:8px 16px;font-size:12px;font-weight:bold;color:#64748B;text-align:center;">Sessions</td>
          <td style="padding:8px 16px;font-size:12px;font-weight:bold;color:#64748B;text-align:center;">Inscrits</td>
          <td style="padding:8px 16px;font-size:12px;font-weight:bold;color:#64748B;">Taux</td>
        </tr>
        ${activityRows}
      </table>
    </td></tr>

    <!-- Daily Breakdown -->
    <tr><td style="padding:0 25px 24px;">
      <h2 style="font-size:16px;font-weight:bold;color:#0F172A;margin:0 0 12px;">Détail par jour</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:12px;overflow:hidden;">
        ${dailyRows || '<tr><td style="padding:16px;text-align:center;color:#64748B;">Aucune session cette semaine</td></tr>'}
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

  // Restrict to service-role callers (cron). Prevents anyone with the anon
  // key from spamming the owner with summary emails on demand.
  {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!token || !serviceKey || token !== serviceKey) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Calculate current week (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const from = weekStart.toISOString().split("T")[0];
    const to = weekEnd.toISOString().split("T")[0];

    console.log(`Generating weekly summary for ${from} to ${to}`);

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("id, date, activity, time_slot, max_participants, status, reservations(id, status, participants, first_name, last_name)")
      .gte("date", from)
      .lte("date", to);

    if (error) {
      console.error("Error fetching sessions:", error);
      throw error;
    }

    const sessionData: SessionData[] = (sessions || []).map((s: any) => ({
      id: s.id,
      date: s.date,
      activity: s.activity,
      time_slot: s.time_slot,
      max_participants: s.max_participants,
      status: s.status,
      reservations: s.reservations || [],
    }));

    const html = buildSummaryHtml(sessionData, from, to);
    const messageId = crypto.randomUUID();
    const runId = crypto.randomUUID();

    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: "weekly_summary",
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
        subject: `📊 Résumé hebdomadaire – Semaine du ${new Date(from).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
        html,
        text: stripHtml(html),
        purpose: "transactional",
        label: "weekly_summary",
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      console.error("Failed to enqueue weekly summary:", enqueueError);
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: "weekly_summary",
        recipient_email: OWNER_EMAIL,
        status: "failed",
        error_message: "Failed to enqueue",
      });
      throw enqueueError;
    }

    console.log("Weekly summary enqueued successfully");

    return new Response(
      JSON.stringify({ success: true, sessions: sessionData.length, week: `${from} → ${to}` }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Weekly summary error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
