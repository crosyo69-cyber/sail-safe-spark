import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_NAME = "KiteSurf Passion";
const SENDER_DOMAIN = "notify.www.kitesurfpassion.fr";
const FROM_DOMAIN = "notify.www.kitesurfpassion.fr";
const OWNER_EMAIL = "crosyo69@gmail.com";
const LOGO_URL = 'https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png';

interface ContactFormRequest {
  name: string;
  email: string;
  phone?: string;
  activity: string;
  startDate?: string;
  endDate?: string;
  participants?: string;
  message?: string;
  honeypot?: string;
  formTimestamp?: number;
}

function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function validateAndSanitizeInput(data: ContactFormRequest): {
  isValid: boolean;
  error?: string;
  sanitized?: {
    name: string;
    email: string;
    phone?: string;
    activity: string;
    startDate?: string;
    endDate?: string;
    participants?: string;
    message?: string;
  };
} {
  if (data.honeypot) {
    console.log("Bot detected via honeypot");
    return { isValid: false, error: "Invalid submission" };
  }

  if (data.formTimestamp && Date.now() - data.formTimestamp < 3000) {
    console.log("Form submitted too quickly, likely a bot");
    return { isValid: false, error: "Veuillez remplir le formulaire correctement" };
  }

  if (!data.name || !data.email || !data.activity) {
    return { isValid: false, error: "Nom, email et activité sont requis" };
  }

  const name = String(data.name).trim();
  if (name.length < 2 || name.length > 100) {
    return { isValid: false, error: "Le nom doit contenir entre 2 et 100 caractères" };
  }

  const email = String(data.email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 255) {
    return { isValid: false, error: "Adresse email invalide" };
  }

  const phone = data.phone ? String(data.phone).trim().slice(0, 20) : undefined;
  if (phone && !/^[\d\s\+\-\(\)\.]+$/.test(phone)) {
    return { isValid: false, error: "Numéro de téléphone invalide" };
  }

  const activity = String(data.activity).trim().slice(0, 100);
  if (activity.length < 1) {
    return { isValid: false, error: "Activité requise" };
  }

  const startDate = data.startDate ? String(data.startDate).trim().slice(0, 100) : undefined;
  const endDate = data.endDate ? String(data.endDate).trim().slice(0, 100) : undefined;
  const participants = data.participants ? String(data.participants).trim().slice(0, 20) : undefined;
  const message = data.message ? String(data.message).trim().slice(0, 2000) : undefined;

  return {
    isValid: true,
    sanitized: { name, email, phone, activity, startDate, endDate, participants, message },
  };
}

function buildCustomerEmailHtml(sanitized: NonNullable<ReturnType<typeof validateAndSanitizeInput>['sanitized']>): string {
  const detailRows = [
    `<tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">Activité</td><td style="padding:10px 16px;font-weight:bold;color:#0F172A;font-size:14px;">${escapeHtml(sanitized.activity)}</td></tr>`,
    sanitized.startDate ? `<tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">Date souhaitée</td><td style="padding:10px 16px;font-weight:bold;color:#0F172A;font-size:14px;">${escapeHtml(sanitized.startDate)}</td></tr>` : '',
    sanitized.endDate ? `<tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">Date de fin</td><td style="padding:10px 16px;font-weight:bold;color:#0F172A;font-size:14px;">${escapeHtml(sanitized.endDate)}</td></tr>` : '',
    sanitized.participants ? `<tr><td style="padding:10px 16px;color:#64748B;font-size:14px;">Participants</td><td style="padding:10px 16px;font-weight:bold;color:#0F172A;font-size:14px;">${escapeHtml(sanitized.participants)}</td></tr>` : '',
  ].filter(Boolean).join('');

  return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Montserrat,Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <!-- Header -->
    <tr><td style="background-color:#0F172A;padding:24px 25px;text-align:center;">
      <img src="${LOGO_URL}" alt="KiteSurf Passion" width="180" style="display:block;margin:0 auto;" />
    </td></tr>
    
    <!-- Body -->
    <tr><td style="padding:32px 25px 0;">
      <h1 style="font-size:22px;font-weight:bold;color:#0F172A;margin:0 0 16px;">Demande bien reçue !</h1>
      <p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 20px;">
        Bonjour ${escapeHtml(sanitized.name)},<br><br>
        Nous avons bien reçu votre demande de réservation. Notre équipe vous recontactera <strong>sous 24 heures</strong> pour confirmer votre créneau.
      </p>
    </td></tr>

    <!-- Recap card -->
    <tr><td style="padding:0 25px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:16px;font-size:15px;font-weight:bold;color:#0F172A;border-bottom:1px solid #E2E8F0;">
          📋 Récapitulatif de votre demande
        </td></tr>
        ${detailRows}
        ${sanitized.message ? `<tr><td colspan="2" style="padding:10px 16px;color:#64748B;font-size:14px;border-top:1px solid #E2E8F0;">
          <strong>Message :</strong><br>${escapeHtml(sanitized.message)}
        </td></tr>` : ''}
      </table>
    </td></tr>

    <!-- CTA -->
    <tr><td style="padding:0 25px 24px;text-align:center;">
      <p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">
        Pour toute question urgente, appelez-nous directement :
      </p>
      <a href="tel:0672716905" style="display:inline-block;background-color:#F97316;color:#ffffff;font-size:15px;font-weight:bold;border-radius:12px;padding:14px 28px;text-decoration:none;">
        📞 06 72 71 69 05
      </a>
    </td></tr>

    <!-- Sign-off -->
    <tr><td style="padding:0 25px 24px;">
      <p style="font-size:15px;color:#64748B;line-height:1.6;margin:0;">
        À très bientôt sur l'eau ! 🪁<br><br>
        <strong>L'équipe KiteSurf Passion</strong><br>
        <span style="font-size:13px;color:#94a3b8;">Première école de kitesurf du Var depuis 1999</span>
      </p>
    </td></tr>

    <!-- Footer -->
    <tr><td style="background-color:#0F172A;padding:16px 25px;text-align:center;">
      <p style="font-size:12px;color:#94a3b8;margin:0;">
        📍 Spot de l'Almanarre, Hyères (Var) · Première école de kitesurf du Var depuis 1999
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildOwnerEmailHtml(sanitized: NonNullable<ReturnType<typeof validateAndSanitizeInput>['sanitized']>): string {
  const rows = [
    `<tr style="background-color:#F1F5F9;"><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Nom</td><td style="padding:10px;border:1px solid #E2E8F0;color:#0F172A;">${escapeHtml(sanitized.name)}</td></tr>`,
    `<tr><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Email</td><td style="padding:10px;border:1px solid #E2E8F0;"><a href="mailto:${escapeHtml(sanitized.email)}" style="color:#0891B2;">${escapeHtml(sanitized.email)}</a></td></tr>`,
    sanitized.phone ? `<tr style="background-color:#F1F5F9;"><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Téléphone</td><td style="padding:10px;border:1px solid #E2E8F0;"><a href="tel:${escapeHtml(sanitized.phone)}" style="color:#0891B2;">${escapeHtml(sanitized.phone)}</a></td></tr>` : '',
    `<tr><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Activité</td><td style="padding:10px;border:1px solid #E2E8F0;color:#0F172A;">${escapeHtml(sanitized.activity)}</td></tr>`,
    sanitized.startDate ? `<tr style="background-color:#F1F5F9;"><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Date début</td><td style="padding:10px;border:1px solid #E2E8F0;color:#0F172A;">${escapeHtml(sanitized.startDate)}</td></tr>` : '',
    sanitized.endDate ? `<tr><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Date fin</td><td style="padding:10px;border:1px solid #E2E8F0;color:#0F172A;">${escapeHtml(sanitized.endDate)}</td></tr>` : '',
    sanitized.participants ? `<tr style="background-color:#F1F5F9;"><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Participants</td><td style="padding:10px;border:1px solid #E2E8F0;color:#0F172A;">${escapeHtml(sanitized.participants)}</td></tr>` : '',
    sanitized.message ? `<tr><td style="padding:10px;border:1px solid #E2E8F0;font-weight:bold;color:#0F172A;">Message</td><td style="padding:10px;border:1px solid #E2E8F0;color:#0F172A;">${escapeHtml(sanitized.message)}</td></tr>` : '',
  ].filter(Boolean).join('');

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Montserrat,Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="background-color:#0F172A;padding:24px 25px;text-align:center;">
      <img src="${LOGO_URL}" alt="KiteSurf Passion" width="180" style="display:block;margin:0 auto;" />
    </td></tr>
    <tr><td style="padding:24px 25px;">
      <h1 style="font-size:20px;font-weight:bold;color:#0F172A;margin:0 0 16px;">🆕 Nouvelle demande de réservation</h1>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${rows}
      </table>
      <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;">Envoyé depuis le formulaire de contact · kitesurfpassion.fr</p>
    </td></tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received contact form request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const data: ContactFormRequest = await req.json();
    console.log("Form data received");

    const validation = validateAndSanitizeInput(data);
    if (!validation.isValid || !validation.sanitized) {
      console.error("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sanitized = validation.sanitized;

    // 1. Send confirmation email to customer
    const customerHtml = buildCustomerEmailHtml(sanitized);
    console.log("Sending confirmation email to customer...");
    try {
      await sendLovableEmail(
        {
          to: sanitized.email,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject: "Confirmation de votre demande – KiteSurf Passion",
          html: customerHtml,
          text: `Bonjour ${sanitized.name}, nous avons bien reçu votre demande de réservation pour ${sanitized.activity}. Nous vous recontacterons sous 24h. Appelez-nous au 06 72 71 69 05 pour toute question urgente.`,
          purpose: 'transactional',
        },
        { apiKey }
      );
      console.log("Customer confirmation email sent");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send customer email';
      console.error('Customer email error:', message);
      // Continue to send owner notification even if customer email fails
    }

    // 2. Send notification email to owner
    const ownerHtml = buildOwnerEmailHtml(sanitized);
    console.log("Sending notification email to owner...");
    try {
      await sendLovableEmail(
        {
          to: OWNER_EMAIL,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject: `Nouvelle réservation: ${sanitized.activity} – ${sanitized.name}`,
          html: ownerHtml,
          text: `Nouvelle demande de ${sanitized.name} (${sanitized.email}) pour ${sanitized.activity}`,
          purpose: 'transactional',
          reply_to: sanitized.email,
        },
        { apiKey }
      );
      console.log("Owner notification email sent");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send owner email';
      console.error('Owner email error:', message);
      throw new Error('Failed to send notification email');
    }

    return new Response(
      JSON.stringify({ success: true, message: "Emails envoyés avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue. Veuillez réessayer." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
