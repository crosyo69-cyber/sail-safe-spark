import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_NAME = "KiteSurf Passion";
const FROM_DOMAIN = "notify.notify.kitesurfpassion.fr";
const OWNER_EMAIL = "crosyo69@gmail.com";
const LOGO_URL = 'https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png';

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildCustomerPaymentEmail(activityName: string): string {
  return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Montserrat,Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="background-color:#0F172A;padding:24px 25px;text-align:center;">
      <img src="${LOGO_URL}" alt="KiteSurf Passion" width="180" style="display:block;margin:0 auto;" />
    </td></tr>
    <tr><td style="padding:32px 25px 0;">
      <h1 style="font-size:22px;font-weight:bold;color:#0F172A;margin:0 0 16px;">Votre réservation est confirmée ! ✅</h1>
      <p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 20px;">
        Nous avons bien reçu votre acompte de <strong>50€</strong> pour <strong>${escapeHtml(activityName)}</strong>.
      </p>
    </td></tr>
    <tr><td style="padding:0 25px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:16px;font-size:15px;font-weight:bold;color:#0F172A;border-bottom:1px solid #E2E8F0;">📋 Récapitulatif</td></tr>
        <tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">Prestation</td><td style="padding:10px 16px;font-weight:bold;color:#0F172A;font-size:14px;">${escapeHtml(activityName)}</td></tr>
        <tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">Acompte versé</td><td style="padding:10px 16px;font-weight:bold;color:#0F172A;font-size:14px;">50€</td></tr>
        <tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">Solde</td><td style="padding:10px 16px;font-weight:bold;color:#0F172A;font-size:14px;">À régler le jour J</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 25px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBEB;border-radius:12px;border-left:4px solid #F59E0B;overflow:hidden;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px;font-weight:bold;color:#92400E;font-size:14px;">📞 Important</p>
          <p style="margin:0;color:#92400E;font-size:14px;line-height:1.5;">
            Contactez-nous <strong>la veille de votre venue</strong> pour confirmer votre créneau horaire en fonction des conditions météo.
          </p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 25px 24px;text-align:center;">
      <a href="tel:0672716905" style="display:inline-block;background-color:#F97316;color:#ffffff;font-size:15px;font-weight:bold;border-radius:12px;padding:14px 28px;text-decoration:none;">📞 06 72 71 69 05</a>
    </td></tr>
    <tr><td style="padding:0 25px 24px;">
      <p style="font-size:15px;color:#64748B;line-height:1.6;margin:0;">
        À très bientôt sur l'eau ! 🪁<br><br>
        <strong>L'équipe KiteSurf Passion</strong><br>
        <span style="font-size:13px;color:#94a3b8;">Première école de kitesurf du Var depuis 1999</span>
      </p>
    </td></tr>
    <tr><td style="background-color:#0F172A;padding:16px 25px;text-align:center;">
      <p style="font-size:12px;color:#94a3b8;margin:0;">📍 Spot de l'Almanarre, Hyères (Var) · Première école de kitesurf du Var depuis 1999</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildOwnerPaymentEmail(activityName: string, customerEmail: string, sessionId: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Montserrat,Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="background-color:#0F172A;padding:24px 25px;text-align:center;">
      <img src="${LOGO_URL}" alt="KiteSurf Passion" width="180" style="display:block;margin:0 auto;" />
    </td></tr>
    <tr><td style="padding:24px 25px;">
      <h1 style="font-size:20px;font-weight:bold;color:#0F172A;margin:0 0 16px;">💰 Nouvel acompte reçu</h1>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr style="background-color:#F1F5F9;"><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Prestation</td><td style="padding:10px;border:1px solid #E2E8F0;color:#0F172A;">${escapeHtml(activityName)}</td></tr>
        <tr><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Email client</td><td style="padding:10px;border:1px solid #E2E8F0;"><a href="mailto:${escapeHtml(customerEmail)}" style="color:#0891B2;">${escapeHtml(customerEmail)}</a></td></tr>
        <tr style="background-color:#F1F5F9;"><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Montant</td><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">50€</td></tr>
        <tr><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">ID Stripe</td><td style="padding:10px;border:1px solid #E2E8F0;color:#64748B;font-size:12px;">${escapeHtml(sessionId)}</td></tr>
      </table>
      <p style="font-size:13px;color:#94a3b8;margin:20px 0 0;">Le client a été invité à vous contacter la veille pour confirmer son créneau.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

async function enqueueEmail(
  supabase: any,
  to: string,
  subject: string,
  html: string,
  templateName: string,
  replyTo?: string,
) {
  const messageId = crypto.randomUUID();

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: to,
    status: 'pending',
  });

  const { error } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: FROM_DOMAIN,
      subject,
      html,
      purpose: 'transactional',
      label: templateName,
      queued_at: new Date().toISOString(),
      ...(replyTo ? { reply_to: replyTo } : {}),
    },
  });

  if (error) {
    console.error(`Failed to enqueue ${templateName} email:`, error);
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: to,
      status: 'failed',
      error_message: 'Failed to enqueue email',
    });
    throw new Error(`Failed to enqueue ${templateName} email`);
  }

  console.log(`${templateName} email enqueued for ${to}`);
  return messageId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      console.error("Missing signature or webhook secret");
      return new Response("Missing signature", { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`Received event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email;
      const activityName = session.metadata?.activity_name || "votre activité";

      console.log(`Payment completed for: ${customerEmail}, activity: ${activityName}`);

      if (customerEmail) {
        try {
          await enqueueEmail(
            supabase,
            customerEmail,
            `Confirmation de réservation – ${activityName}`,
            buildCustomerPaymentEmail(activityName),
            'booking_confirmation',
          );
        } catch (error) {
          console.error("Customer email enqueue error:", error instanceof Error ? error.message : error);
        }

        try {
          await enqueueEmail(
            supabase,
            OWNER_EMAIL,
            `💰 Acompte reçu – ${activityName} (${customerEmail})`,
            buildOwnerPaymentEmail(activityName, customerEmail, session.id),
            'booking_owner_notification',
            customerEmail,
          );
        } catch (error) {
          console.error("Owner email enqueue error:", error instanceof Error ? error.message : error);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
