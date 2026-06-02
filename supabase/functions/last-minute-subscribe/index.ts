import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.kitesurfpassion.fr";
const FROM_DOMAIN = "kitesurfpassion.fr";
const SITE_NAME = "Kitesurf Passion";

function buildHtml(confirmUrl: string, unsubscribeUrl: string) {
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#fff;font-family:Inter,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
      <tr><td style="background:#0F172A;color:#fff;padding:20px 24px;font-family:Montserrat,Arial,sans-serif;">
        <h1 style="margin:0;font-size:20px;">Confirmez vos alertes Dernière Minute</h1>
      </td></tr>
      <tr><td style="padding:24px;color:#0F172A;">
        <p>Merci de votre inscription aux alertes Dernière Minute de Kitesurf Passion.</p>
        <p>Cliquez ci-dessous pour activer vos alertes :</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${confirmUrl}" style="background:#F97316;color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:bold;">Confirmer mon inscription</a>
        </p>
        <p style="font-size:12px;color:#64748B;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email ou
          <a href="${unsubscribeUrl}" style="color:#0891B2;">cliquez ici</a> pour vous désinscrire.</p>
      </td></tr>
    </table>
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, activities, honeypot, formTimestamp } = await req.json();
    if (honeypot) return new Response(JSON.stringify({ error: "Invalid" }), { status: 400, headers: corsHeaders });
    if (formTimestamp && Date.now() - formTimestamp < 2500) {
      return new Response(JSON.stringify({ error: "Trop rapide" }), { status: 400, headers: corsHeaders });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email invalide" }), { status: 400, headers: corsHeaders });
    }
    const cleanActivities = Array.isArray(activities)
      ? activities.filter((a: string) => ["kitesurf", "wingfoil", "kitefoil"].includes(a))
      : [];
    if (cleanActivities.length === 0) {
      return new Response(JSON.stringify({ error: "Sélectionnez au moins une activité" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // upsert (allow re-subscribe with new tokens if already exists but unconfirmed)
    const { data: existing } = await supabase
      .from("last_minute_subscribers")
      .select("id, confirmed, confirm_token, unsubscribe_token")
      .eq("email", email)
      .maybeSingle();

    let confirmToken: string;
    let unsubToken: string;

    if (existing) {
      if (existing.confirmed) {
        // already confirmed: just update activities
        await supabase.from("last_minute_subscribers").update({ activities: cleanActivities, updated_at: new Date().toISOString() }).eq("id", existing.id);
        return new Response(JSON.stringify({ success: true, alreadyConfirmed: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      confirmToken = existing.confirm_token as string;
      unsubToken = existing.unsubscribe_token as string;
      await supabase.from("last_minute_subscribers").update({ activities: cleanActivities, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      const { data: created, error } = await supabase
        .from("last_minute_subscribers")
        .insert({ email, activities: cleanActivities })
        .select("confirm_token, unsubscribe_token")
        .single();
      if (error || !created) {
        return new Response(JSON.stringify({ error: "Inscription impossible" }), { status: 500, headers: corsHeaders });
      }
      confirmToken = created.confirm_token as string;
      unsubToken = created.unsubscribe_token as string;
    }

    const confirmUrl = `${SITE}/alerte-derniere-minute?confirm=${confirmToken}`;
    const unsubscribeUrl = `${SITE}/alerte-derniere-minute?unsubscribe=${unsubToken}`;

    const messageId = crypto.randomUUID();
    const runId = crypto.randomUUID();
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: "last_minute_confirm",
      recipient_email: email,
      status: "pending",
    });
    const { error: enqErr } = await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        run_id: runId,
        message_id: messageId,
        to: email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: FROM_DOMAIN,
        subject: "Confirmez vos alertes Dernière Minute – Kitesurf Passion",
        html: buildHtml(confirmUrl, unsubscribeUrl),
        text: `Confirmez votre inscription : ${confirmUrl}`,
        purpose: "transactional",
        label: "last_minute_confirm",
        queued_at: new Date().toISOString(),
      },
    });
    if (enqErr) console.error("enqueue error", enqErr);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500, headers: corsHeaders });
  }
});