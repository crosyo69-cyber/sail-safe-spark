import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.kitesurfpassion.fr";
const FROM_DOMAIN = "kitesurfpassion.fr";
const SITE_NAME = "Kitesurf Passion";

// E-2-FIX : clé de rate-limit jamais vide (p_key vide => bypass du guard).
function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0]?.trim() ?? "";
  if (first) return first;
  const real = (req.headers.get("x-real-ip") ?? "").trim();
  return real || "unknown-ip";
}

// Retourne null si autorisé, sinon une Response (429 bloqué / 503 guard indisponible).
async function rateGuard(
  supabase: any,
  context: string,
  key: string,
  limit: number,
  window: string,
): Promise<Response | null> {
  const { data: allowed, error } = await supabase.rpc("public_rate_guard", {
    p_context: context,
    p_key: key && key.trim() ? key : "unknown-key",
    p_limit: limit,
    p_window: window,
  });
  if (error) {
    console.error("rate guard unavailable", context, error.message);
    return new Response(JSON.stringify({ error: "Service temporairement indisponible" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (allowed !== true) {
    return new Response(JSON.stringify({ error: "Trop de demandes. Merci de réessayer plus tard." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}


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

    // D-4-FIX-2 (R5 phase C) : les tokens ne sont JAMAIS relus depuis la base.
    // Ils sont émis en mémoire côté serveur (issue_link_token) et seul le hash est persisté.
    const { data: existing } = await supabase
      .from("last_minute_subscribers")
      .select("id, confirmed")
      .eq("email", email)
      .maybeSingle();

    let subscriberId: string;

    if (existing) {
      if (existing.confirmed) {
        // already confirmed: just update activities
        await supabase.from("last_minute_subscribers").update({ activities: cleanActivities, updated_at: new Date().toISOString() }).eq("id", existing.id);
        return new Response(JSON.stringify({ success: true, alreadyConfirmed: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      subscriberId = existing.id as string;
      await supabase.from("last_minute_subscribers").update({ activities: cleanActivities, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      const { data: created, error } = await supabase
        .from("last_minute_subscribers")
        .insert({ email, activities: cleanActivities })
        .select("id")
        .single();
      if (error || !created) {
        return new Response(JSON.stringify({ error: "Inscription impossible" }), { status: 500, headers: corsHeaders });
      }
      subscriberId = created.id as string;
    }

    // Nouveau token de confirmation à chaque envoi (non destructif : les anciens
    // hashes restent valides — modèle multi-token public_link_tokens).
    const { data: confirmToken, error: cErr } = await supabase.rpc("issue_link_token", {
      p_purpose: "last_minute_confirm",
      p_subject_id: subscriberId,
      p_expires_at: null,
    });
    const { data: unsubToken, error: uErr } = await supabase.rpc("issue_link_token", {
      p_purpose: "last_minute_unsubscribe",
      p_subject_id: subscriberId,
      p_expires_at: null,
    });
    if (cErr || uErr || !confirmToken || !unsubToken) {
      console.error("issue_link_token failed", cErr?.message ?? uErr?.message);
      return new Response(JSON.stringify({ error: "Inscription impossible" }), { status: 500, headers: corsHeaders });
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