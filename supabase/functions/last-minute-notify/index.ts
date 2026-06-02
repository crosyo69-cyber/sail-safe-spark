import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.kitesurfpassion.fr";
const FROM_DOMAIN = "kitesurfpassion.fr";
const SITE_NAME = "Kitesurf Passion";

const ACTIVITY_LABELS: Record<string, string> = {
  kitesurf: "Kitesurf",
  wingfoil: "Wingfoil",
  pumpfoil: "Kitefoil / Pumpfoil",
};
const SLOT_LABELS: Record<string, string> = {
  morning: "Matin",
  early_afternoon: "Début d'après-midi",
  late_afternoon: "Fin d'après-midi",
};

function buildHtml(opts: { activity: string; date: string; slot: string; note: string | null; label: string | null; bookUrl: string; unsubscribeUrl: string }) {
  const badge =
    opts.label === "wind"
      ? `<span style="background:#0891B2;color:#fff;padding:6px 12px;border-radius:999px;font-size:13px;">🌬️ Conditions exceptionnelles</span>`
      : `<span style="background:#F97316;color:#fff;padding:6px 12px;border-radius:999px;font-size:13px;">🔥 Session Dernière Minute</span>`;
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#fff;font-family:Inter,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
      <tr><td style="background:#0F172A;color:#fff;padding:20px 24px;font-family:Montserrat,Arial,sans-serif;">
        <h1 style="margin:0;font-size:20px;">Nouveau créneau ouvert !</h1>
      </td></tr>
      <tr><td style="padding:24px;color:#0F172A;">
        <p style="margin:0 0 12px;">${badge}</p>
        <h2 style="margin:8px 0;font-size:22px;">${ACTIVITY_LABELS[opts.activity] || opts.activity} — ${opts.date}</h2>
        <p style="margin:0 0 8px;"><strong>Créneau :</strong> ${SLOT_LABELS[opts.slot] || opts.slot}</p>
        ${opts.note ? `<p style="margin:0 0 8px;"><strong>Météo :</strong> ${opts.note}</p>` : ""}
        <p style="text-align:center;margin:28px 0;">
          <a href="${opts.bookUrl}" style="background:#F97316;color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:bold;">Je réserve ma place</a>
        </p>
        <p style="font-size:12px;color:#64748B;">Les places partent vite. <a href="${opts.unsubscribeUrl}" style="color:#0891B2;">Se désabonner</a></p>
      </td></tr>
    </table>
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return new Response(JSON.stringify({ error: "sessionId required" }), { status: 400, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: session, error: sErr } = await supabase
      .from("sessions")
      .select("id,date,time_slot,activity,weather_note,last_minute_label,is_last_minute")
      .eq("id", sessionId)
      .single();
    if (sErr || !session) return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: corsHeaders });

    // map session activity to subscriber activity keys
    const targetKey =
      session.activity === "pumpfoil" ? "kitefoil" :
      session.activity === "wingfoil" ? "wingfoil" : "kitesurf";

    const { data: subs } = await supabase
      .from("last_minute_subscribers")
      .select("email,unsubscribe_token,activities")
      .eq("confirmed", true)
      .contains("activities", [targetKey]);

    let sent = 0;
    for (const sub of subs || []) {
      const messageId = crypto.randomUUID();
      const runId = crypto.randomUUID();
      const bookUrl = `${SITE}/dernieres-minutes`;
      const unsubscribeUrl = `${SITE}/alerte-derniere-minute?unsubscribe=${sub.unsubscribe_token}`;
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: "last_minute_alert",
        recipient_email: sub.email,
        status: "pending",
      });
      const { error: enqErr } = await supabase.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          run_id: runId,
          message_id: messageId,
          to: sub.email,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: FROM_DOMAIN,
          subject: `🔥 Nouveau créneau ${ACTIVITY_LABELS[session.activity] || session.activity} dispo !`,
          html: buildHtml({
            activity: session.activity,
            date: session.date,
            slot: session.time_slot,
            note: session.weather_note,
            label: session.last_minute_label,
            bookUrl,
            unsubscribeUrl,
          }),
          text: `Nouveau créneau ${session.activity} le ${session.date} — ${bookUrl}`,
          purpose: "transactional",
          label: "last_minute_alert",
          queued_at: new Date().toISOString(),
        },
      });
      if (!enqErr) sent++;
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500, headers: corsHeaders });
  }
});