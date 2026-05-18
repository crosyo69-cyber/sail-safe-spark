import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_NAME = "KiteSurf Passion";
const FROM_DOMAIN = "kitesurfpassion.fr";
const OWNER_EMAIL = "crosyo69@gmail.com";
const LOGO_URL = 'https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png';

// Map activity display names to database enum values
const ACTIVITY_NAME_MAP: Record<string, string> = {
  "cours particulier kitesurf": "kitesurf",
  "stage 100% glisse": "kitesurf",
  "cours à la carte": "kitesurf",
  "cours wingfoil": "wingfoil",
  "location matériel": "kitesurf",
};

const MAX_BY_ACTIVITY: Record<string, number> = {
  kitesurf: 4,
  wingfoil: 3,
  pumpfoil: 4,
  foil_tracte: 4,
};

function generatePackageCode(): string {
  const year = new Date().getFullYear();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let suffix = "";
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 4; i++) suffix += alphabet[buf[i] % alphabet.length];
  return `KP-${year}-${suffix}`;
}

async function createClientPackage(
  supabase: any,
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  const customerEmail = session.customer_details?.email;
  if (!customerEmail) return null;

  const customerName = session.metadata?.customer_name || session.customer_details?.name || "";
  const activityName = session.metadata?.activity_name || "votre activité";
  const phone = session.metadata?.phone || session.customer_details?.phone || "";
  const participants = Math.max(1, parseInt(session.metadata?.participants || "1", 10));
  const totalSessions = Math.max(
    1,
    parseInt(session.metadata?.total_sessions || String(participants), 10),
  );

  const nameParts = customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || "Client";
  const lastName = nameParts.slice(1).join(" ") || "Stripe";
  const activityEnum = mapActivityToEnum(activityName);

  // Try a few times in case of code collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generatePackageCode();
    const { data, error } = await supabase
      .from("client_packages")
      .insert({
        package_code: code,
        email: customerEmail,
        first_name: firstName,
        last_name: lastName,
        phone,
        activity: activityEnum,
        package_type: activityName,
        total_sessions: totalSessions,
        deposit_amount: participants * 50,
        deposit_paid_at: new Date().toISOString(),
        stripe_session_id: session.id,
        status: "active",
      })
      .select("package_code")
      .single();
    if (!error && data) return data.package_code;
    if (error && !String(error.message).includes("duplicate")) {
      console.error("createClientPackage error:", error);
      return null;
    }
  }
  return null;
}

function mapActivityToEnum(activityName: string): string {
  const normalized = activityName.toLowerCase().trim();
  for (const [key, value] of Object.entries(ACTIVITY_NAME_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  // Fuzzy match
  if (normalized.includes("kite")) return "kitesurf";
  if (normalized.includes("wing")) return "wingfoil";
  if (normalized.includes("pump")) return "pumpfoil";
  if (normalized.includes("foil trac") || normalized.includes("tracté")) return "foil_tracte";
  return "kitesurf";
}

// Auto-enroll a 5-day consecutive stage starting from preferredDate.
// Creates missing sessions and inserts confirmed package_bookings on each day.
async function autoEnrollConsecutiveStage(
  supabase: any,
  packageCode: string,
  activityName: string,
  preferredDate: string,
  totalSessions: number,
) {
  const name = (activityName || "").toLowerCase();
  const isStage =
    name.includes("stage 100") ||
    name.includes("100% glisse") ||
    name.includes("100%glisse") ||
    (name.includes("stage") && totalSessions === 5);
  if (!isStage || !preferredDate || totalSessions < 2) return;

  const { data: pkg } = await supabase
    .from("client_packages")
    .select("id, activity")
    .eq("package_code", packageCode)
    .single();
  if (!pkg) return;

  const activityEnum = pkg.activity;
  const maxParticipants = MAX_BY_ACTIVITY[activityEnum] || 4;
  const start = new Date(`${preferredDate}T00:00:00Z`);

  for (let i = 0; i < totalSessions; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    // Find or create an open session for this day + activity (morning slot)
    let sessionId: string | null = null;
    const { data: existing } = await supabase
      .from("sessions")
      .select("id")
      .eq("date", dateStr)
      .eq("activity", activityEnum)
      .eq("status", "open")
      .limit(1);
    if (existing && existing.length > 0) {
      sessionId = existing[0].id;
    } else {
      const { data: created, error: sErr } = await supabase
        .from("sessions")
        .insert({
          date: dateStr,
          time_slot: "morning",
          activity: activityEnum,
          max_participants: maxParticipants,
          status: "open",
          notes: `Stage auto-créé – ${activityName}`,
        })
        .select("id")
        .single();
      if (sErr) {
        console.error(`autoEnrollConsecutiveStage: session ${dateStr} error`, sErr);
        continue;
      }
      sessionId = created.id;
    }

    const { error: bErr } = await supabase
      .from("package_bookings")
      .upsert(
        { package_id: pkg.id, session_id: sessionId, status: "confirmed" },
        { onConflict: "package_id,session_id" },
      );
    if (bErr) {
      console.error(`autoEnrollConsecutiveStage: booking ${dateStr} error`, bErr);
    }
  }
  console.log(`Auto-enrolled ${packageCode} on ${totalSessions} consecutive days from ${preferredDate}`);
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildCustomerPaymentEmail(activityName: string, participants: number, preferredDate?: string): string {
  return buildCustomerPaymentEmailWithCode(activityName, participants, preferredDate);
}

function buildCustomerPaymentEmailWithCode(
  activityName: string,
  participants: number,
  preferredDate?: string,
  packageCode?: string,
  totalSessions?: number,
): string {
  const amount = participants * 50;
  const participantsLabel = participants > 1 ? `${participants} personnes` : '1 personne';
  const dateRow = preferredDate ? `<tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">Date souhaitée</td><td style="padding:10px 16px;font-weight:bold;color:#0F172A;font-size:14px;">${escapeHtml(preferredDate)}</td></tr>` : '';
  const codeBlock = packageCode ? `
    <tr><td style="padding:0 25px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0891B2,#0F172A);border-radius:12px;overflow:hidden;">
        <tr><td style="padding:20px;text-align:center;">
          <p style="margin:0 0 8px;color:#bae6fd;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Votre code de réservation</p>
          <p style="margin:0 0 12px;color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:3px;font-family:Menlo,monospace;">${escapeHtml(packageCode)}</p>
          <p style="margin:0 0 16px;color:#e0f2fe;font-size:13px;line-height:1.5;">${totalSessions ? `Vous disposez de <strong>${totalSessions} session${totalSessions>1?'s':''}</strong> à réserver librement selon les conditions météo.` : 'Réservez librement vos journées selon les conditions météo.'}</p>
          <a href="https://www.kitesurfpassion.fr/mon-espace/${encodeURIComponent(packageCode)}" style="display:inline-block;background-color:#F97316;color:#ffffff;font-size:14px;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;">📅 Réserver mes journées</a>
        </td></tr>
      </table>
    </td></tr>` : '';
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
        Nous avons bien reçu votre acompte de <strong>${amount}€</strong> pour <strong>${escapeHtml(activityName)}</strong> (${participantsLabel}).
      </p>
    </td></tr>
    ${codeBlock}
    <tr><td style="padding:0 25px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:16px;font-size:15px;font-weight:bold;color:#0F172A;border-bottom:1px solid #E2E8F0;">📋 Récapitulatif</td></tr>
        <tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">Prestation</td><td style="padding:10px 16px;font-weight:bold;color:#0F172A;font-size:14px;">${escapeHtml(activityName)}</td></tr>
        ${dateRow}
        <tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">Participants</td><td style="padding:10px 16px;font-weight:bold;color:#0F172A;font-size:14px;">${participantsLabel}</td></tr>
        <tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">Acompte versé</td><td style="padding:10px 16px;font-weight:bold;color:#0F172A;font-size:14px;">${amount}€</td></tr>
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

function buildOwnerPaymentEmail(activityName: string, customerEmail: string, sessionId: string, participants: number, customerName?: string, phone?: string, preferredDate?: string): string {
  const amount = participants * 50;
  const nameRow = customerName ? `<tr><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Client</td><td style="padding:10px;border:1px solid #E2E8F0;color:#0F172A;">${escapeHtml(customerName)}</td></tr>` : '';
  const phoneRow = phone ? `<tr style="background-color:#F1F5F9;"><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Téléphone</td><td style="padding:10px;border:1px solid #E2E8F0;"><a href="tel:${escapeHtml(phone)}" style="color:#0891B2;">${escapeHtml(phone)}</a></td></tr>` : '';
  const dateRow = preferredDate ? `<tr><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Date souhaitée</td><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">${escapeHtml(preferredDate)}</td></tr>` : '';
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
        ${nameRow}
        <tr><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Email client</td><td style="padding:10px;border:1px solid #E2E8F0;"><a href="mailto:${escapeHtml(customerEmail)}" style="color:#0891B2;">${escapeHtml(customerEmail)}</a></td></tr>
        ${phoneRow}
        ${dateRow}
        <tr style="background-color:#F1F5F9;"><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Participants</td><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">${participants}</td></tr>
        <tr><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Montant</td><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">${amount}€</td></tr>
        <tr style="background-color:#F1F5F9;"><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">ID Stripe</td><td style="padding:10px;border:1px solid #E2E8F0;color:#64748B;font-size:12px;">${escapeHtml(sessionId)}</td></tr>
      </table>
      <p style="font-size:13px;color:#94a3b8;margin:20px 0 0;">Le client a été invité à vous contacter la veille pour confirmer son créneau. L'inscription a été ajoutée automatiquement au calendrier.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
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
  const runId = crypto.randomUUID();

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: to,
    status: 'pending',
  });

  const { error } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      run_id: runId,
      message_id: messageId,
      to,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: FROM_DOMAIN,
      subject,
      html,
      text: stripHtml(html),
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

// Create reservation from Stripe checkout, using preferred date and activity mapping
async function createReservationFromCheckout(
  supabase: any,
  session: Stripe.Checkout.Session,
) {
  const customerEmail = session.customer_details?.email;
  const customerName = session.metadata?.customer_name || session.customer_details?.name || '';
  const activityName = session.metadata?.activity_name || 'votre activité';
  const preferredDate = session.metadata?.preferred_date;
  const phone = session.metadata?.phone || session.customer_details?.phone || 'Non renseigné';
  const participants = Math.max(1, parseInt(session.metadata?.participants || '1', 10));

  if (!customerEmail) {
    console.error('No customer email found in checkout session');
    return;
  }

  // Parse name into first/last
  const nameParts = customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Client';
  const lastName = nameParts.slice(1).join(' ') || 'Stripe';

  // Map activity name to enum
  const activityEnum = mapActivityToEnum(activityName);
  const maxParticipants = MAX_BY_ACTIVITY[activityEnum] || 4;

  // Determine the date for the session
  const sessionDate = preferredDate || new Date().toISOString().split('T')[0];

  // Try to find an existing open session for this date + activity
  const { data: existingSessions } = await supabase
    .from('sessions')
    .select('id, reservation_count:reservations(count)')
    .eq('date', sessionDate)
    .eq('activity', activityEnum)
    .eq('status', 'open')
    .limit(1);

  let sessionId: string;

  if (existingSessions && existingSessions.length > 0) {
    sessionId = existingSessions[0].id;
  } else {
    // Create a session for the preferred date with the correct activity
    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        date: sessionDate,
        time_slot: 'morning',
        activity: activityEnum,
        max_participants: maxParticipants,
        status: 'open',
        notes: `Session auto-créée via réservation Stripe – ${activityName}`,
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
      return;
    }
    sessionId = newSession.id;
  }

  // Insert the reservation
  const { error: reservationError } = await supabase
    .from('reservations')
    .insert({
      session_id: sessionId,
      first_name: firstName,
      last_name: lastName,
      email: customerEmail,
      phone,
      skill_level: 'debutant',
      participants,
      status: 'confirmed',
      stripe_session_id: session.id,
      notes: `Acompte ${participants * 50}€ payé via Stripe – ${activityName}`,
    });

  if (reservationError) {
    console.error('Failed to create reservation:', reservationError);
  } else {
    console.log(`Reservation created for ${customerEmail} on ${sessionDate} (${activityName} → ${activityEnum})`);
  }
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
      const participants = Math.max(1, parseInt(session.metadata?.participants || '1', 10));
      const preferredDate = session.metadata?.preferred_date;
      const customerName = session.metadata?.customer_name;
      const phone = session.metadata?.phone;

      console.log(`Payment completed for: ${customerEmail}, activity: ${activityName}, date: ${preferredDate}, participants: ${participants}`);

      // Create reservation in database
      try {
        await createReservationFromCheckout(supabase, session);
      } catch (error) {
        console.error("Reservation creation error:", error instanceof Error ? error.message : error);
      }

      // Send confirmation emails
      if (customerEmail) {
        // Create client package and capture code for the email
        let packageCode: string | null = null;
        let totalSessions = participants;
        try {
          packageCode = await createClientPackage(supabase, session);
          totalSessions = Math.max(
            1,
            parseInt(session.metadata?.total_sessions || String(participants), 10),
          );
        } catch (error) {
          console.error("Client package creation error:", error instanceof Error ? error.message : error);
        }

        // Auto-enroll consecutive-day stages (Stage 100% Glisse, 5 jours, etc.)
        if (packageCode && preferredDate) {
          try {
            await autoEnrollConsecutiveStage(
              supabase,
              packageCode,
              activityName,
              preferredDate,
              totalSessions,
            );
          } catch (error) {
            console.error("Auto-enroll stage error:", error instanceof Error ? error.message : error);
          }
        }

        try {
          await enqueueEmail(
            supabase,
            customerEmail,
            `Confirmation de réservation – ${activityName}`,
            buildCustomerPaymentEmailWithCode(activityName, participants, preferredDate, packageCode || undefined, totalSessions),
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
            buildOwnerPaymentEmail(activityName, customerEmail, session.id, participants, customerName, phone, preferredDate),
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
