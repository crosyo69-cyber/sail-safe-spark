// F-22-01 / F-22-06 — Inscription météo sécurisée (double opt-in).
// Remplace l'INSERT anon direct : validation + rate guard fail-closed +
// demande "pending" + token de confirmation + e-mail via la chaîne F-21.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.kitesurfpassion.fr";
const FROM_DOMAIN = "kitesurfpassion.fr";
const SITE_NAME = "Kitesurf Passion";

// Réponse volontairement uniforme : ne révèle jamais l'état d'une adresse tierce.
const UNIFORM_OK = {
  success: true,
  message: "Si cette adresse est éligible, vous recevrez un e-mail de confirmation.",
};

export function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return value.length > 0 && value.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function clampWind(min: unknown, max: unknown): { min: number; max: number } {
  const toInt = (v: unknown, fallback: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), 60) : fallback;
  };
  let lo = toInt(min, 10);
  let hi = toInt(max, 30);
  if (lo > hi) [lo, hi] = [hi, lo];
  return { min: lo, max: hi };
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0]?.trim() ?? "";
  if (first) return first;
  const real = (req.headers.get("x-real-ip") ?? "").trim();
  return real || "unknown-ip";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Fail-closed : si le guard est indisponible, la demande est refusée.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

async function rateGuard(
  supabase: Db,
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
    return json({ error: "Service temporairement indisponible" }, 503);
  }
  if (allowed !== true) {
    return json({ error: "Trop de demandes. Merci de réessayer plus tard." }, 429);
  }
  return null;
}

function buildHtml(confirmUrl: string, min: number, max: number) {
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#fff;font-family:Inter,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
      <tr><td style="background:#0F172A;color:#fff;padding:20px 24px;font-family:Montserrat,Arial,sans-serif;">
        <h1 style="margin:0;font-size:20px;">Confirmez vos alertes météo</h1>
      </td></tr>
      <tr><td style="padding:24px;color:#0F172A;">
        <p>Une inscription aux alertes météo de Kitesurf Passion (vent entre ${min} et ${max} nœuds) a été demandée avec cette adresse.</p>
        <p>Cliquez ci-dessous pour activer vos alertes :</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${confirmUrl}" style="background:#F97316;color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:bold;">Confirmer mes alertes météo</a>
        </p>
        <p style="font-size:12px;color:#64748B;">Ce lien expire dans 48 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail : aucune alerte ne sera envoyée.</p>
      </td></tr>
    </table>
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---------- Confirmation (double opt-in) ----------
    if (body?.action === "confirm") {
      const token = String(body.token ?? "");
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(token)) return json({ success: false, confirmed: false }, 400);

      const ipBlocked = await rateGuard(supabase, "weather_confirm_ip", clientIp(req), 20, "1 hour");
      if (ipBlocked) return ipBlocked;

      const { data, error } = await supabase.rpc("confirm_weather_subscription", { p_token: token });
      if (error) {
        console.error("confirm_weather_subscription failed", error.message);
        return json({ success: false, confirmed: false }, 500);
      }
      return json({ success: data === true, confirmed: data === true });
    }

    // ---------- Demande d'inscription ----------
    const { honeypot, formTimestamp } = body ?? {};
    if (honeypot) return json(UNIFORM_OK);
    if (formTimestamp && Date.now() - Number(formTimestamp) < 2000) return json(UNIFORM_OK);

    const email = normalizeEmail(body?.email);
    if (!isValidEmail(email)) return json({ error: "Adresse email invalide" }, 400);
    const { min, max } = clampWind(body?.min_wind, body?.max_wind);

    const ipBlocked = await rateGuard(supabase, "weather_subscribe_ip", clientIp(req), 5, "15 minutes");
    if (ipBlocked) return ipBlocked;
    const emailBlocked = await rateGuard(supabase, "weather_subscribe_email", email, 3, "1 hour");
    if (emailBlocked) return emailBlocked;

    const { data: existing } = await supabase
      .from("weather_alert_subscriptions")
      .select("id, confirmed")
      .eq("email", email)
      .maybeSingle();

    let subscriptionId: string;

    if (existing) {
      subscriptionId = existing.id as string;
      await supabase
        .from("weather_alert_subscriptions")
        .update({ min_wind: min, max_wind: max, updated_at: new Date().toISOString() })
        .eq("id", subscriptionId);
      // Déjà confirmé : aucune nouvelle sollicitation, réponse identique.
      if (existing.confirmed) return json(UNIFORM_OK);
    } else {
      const { data: created, error: insErr } = await supabase
        .from("weather_alert_subscriptions")
        .insert({ email, min_wind: min, max_wind: max, enabled: true, confirmed: false })
        .select("id")
        .single();
      if (insErr || !created) {
        console.error("weather subscription insert failed", insErr?.message);
        return json(UNIFORM_OK);
      }
      subscriptionId = created.id as string;
    }

    const { data: confirmToken, error: tokErr } = await supabase.rpc("issue_link_token", {
      p_purpose: "weather_confirm",
      p_subject_id: subscriptionId,
      p_expires_at: null,
    });
    if (tokErr || !confirmToken) {
      console.error("issue_link_token failed", tokErr?.message);
      return json(UNIFORM_OK);
    }

    const confirmUrl = `${SITE}/desabonnement-alertes?confirm=${confirmToken}`;
    const messageId = crypto.randomUUID();

    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: "weather_confirm",
      recipient_email: email,
      status: "pending",
    });

    const { error: enqErr } = await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        run_id: crypto.randomUUID(),
        message_id: messageId,
        to: email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: FROM_DOMAIN,
        subject: "Confirmez vos alertes météo – Kitesurf Passion",
        html: buildHtml(confirmUrl, min, max),
        text: `Confirmez vos alertes météo : ${confirmUrl}`,
        purpose: "transactional",
        label: "weather_confirm",
        queued_at: new Date().toISOString(),
      },
    });
    if (enqErr) console.error("enqueue error", enqErr.message);

    return json(UNIFORM_OK);
  } catch (e) {
    console.error("weather-subscribe error", e instanceof Error ? e.message : e);
    return json({ error: "Erreur serveur" }, 500);
  }
});
