import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

// HTML entity encoding to prevent XSS in email content
function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Input validation and sanitization
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
  // Check honeypot - if filled, it's a bot
  if (data.honeypot) {
    console.log("Bot detected via honeypot");
    return { isValid: false, error: "Invalid submission" };
  }

  // Check form timestamp - form should take at least 3 seconds to fill
  if (data.formTimestamp && Date.now() - data.formTimestamp < 3000) {
    console.log("Form submitted too quickly, likely a bot");
    return { isValid: false, error: "Veuillez remplir le formulaire correctement" };
  }

  // Validate required fields
  if (!data.name || !data.email || !data.activity) {
    return { isValid: false, error: "Nom, email et activité sont requis" };
  }

  // Validate and sanitize name
  const name = String(data.name).trim();
  if (name.length < 2 || name.length > 100) {
    return { isValid: false, error: "Le nom doit contenir entre 2 et 100 caractères" };
  }

  // Validate email format
  const email = String(data.email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 255) {
    return { isValid: false, error: "Adresse email invalide" };
  }

  // Validate phone if provided
  const phone = data.phone ? String(data.phone).trim().slice(0, 20) : undefined;
  if (phone && !/^[\d\s\+\-\(\)\.]+$/.test(phone)) {
    return { isValid: false, error: "Numéro de téléphone invalide" };
  }

  // Validate activity
  const activity = String(data.activity).trim().slice(0, 100);
  if (activity.length < 1) {
    return { isValid: false, error: "Activité requise" };
  }

  // Sanitize optional fields
  const startDate = data.startDate ? String(data.startDate).trim().slice(0, 100) : undefined;
  const endDate = data.endDate ? String(data.endDate).trim().slice(0, 100) : undefined;
  const participants = data.participants ? String(data.participants).trim().slice(0, 20) : undefined;
  const message = data.message ? String(data.message).trim().slice(0, 2000) : undefined;

  return {
    isValid: true,
    sanitized: {
      name,
      email,
      phone,
      activity,
      startDate,
      endDate,
      participants,
      message,
    },
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received contact form request");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ContactFormRequest = await req.json();
    console.log("Form data received (sanitized log)");

    // Validate and sanitize input
    const validation = validateAndSanitizeInput(data);
    if (!validation.isValid || !validation.sanitized) {
      console.error("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const sanitized = validation.sanitized;

    // Email to the business owner - all user data is HTML-escaped
    const ownerEmailHtml = `
      <h2>Nouvelle demande de réservation</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Nom</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(sanitized.name)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${escapeHtml(sanitized.email)}">${escapeHtml(sanitized.email)}</a></td>
        </tr>
        ${sanitized.phone ? `
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Téléphone</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${escapeHtml(sanitized.phone)}">${escapeHtml(sanitized.phone)}</a></td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Activité</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(sanitized.activity)}</td>
        </tr>
        ${sanitized.startDate ? `
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date de début</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(sanitized.startDate)}</td>
        </tr>
        ` : ''}
        ${sanitized.endDate ? `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date de fin</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(sanitized.endDate)}</td>
        </tr>
        ` : ''}
        ${sanitized.participants ? `
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Nombre de participants</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(sanitized.participants)}</td>
        </tr>
        ` : ''}
        ${sanitized.message ? `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Message</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(sanitized.message)}</td>
        </tr>
        ` : ''}
      </table>
      <p style="margin-top: 20px; color: #666;">
        Envoyé depuis le formulaire de contact du site KiteSurf Passion
      </p>
    `;

    // Email confirmation to the customer - all user data is HTML-escaped
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">KiteSurf Passion</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Hyères - L'Almanarre</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #0284c7;">Bonjour ${escapeHtml(sanitized.name)},</h2>
          
          <p>Nous avons bien reçu votre demande de réservation pour <strong>${escapeHtml(sanitized.activity)}</strong>.</p>
          
          <p>Notre équipe vous contactera dans les plus brefs délais pour confirmer votre réservation.</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0284c7; margin-top: 0;">Récapitulatif de votre demande</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Activité :</strong> ${escapeHtml(sanitized.activity)}</li>
              ${sanitized.startDate ? `<li><strong>Date de début :</strong> ${escapeHtml(sanitized.startDate)}</li>` : ''}
              ${sanitized.endDate ? `<li><strong>Date de fin :</strong> ${escapeHtml(sanitized.endDate)}</li>` : ''}
              ${sanitized.participants ? `<li><strong>Participants :</strong> ${escapeHtml(sanitized.participants)}</li>` : ''}
            </ul>
          </div>
          
          <p>Pour toute question urgente, n'hésitez pas à nous appeler au <a href="tel:0672716905" style="color: #0284c7;">06 72 71 69 05</a>.</p>
          
          <p>À très bientôt sur l'eau !</p>
          
          <p style="margin-top: 30px;">
            <strong>L'équipe KiteSurf Passion</strong><br>
            <span style="color: #666;">Première école de kitesurf du Var depuis 1999</span>
          </p>
        </div>
        
        <div style="background: #1e3a5f; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0 0 10px 0;">
            📍 52 Avenue Général de Gaulle, 83320 Carqueiranne
          </p>
          <p style="margin: 0;">
            📞 <a href="tel:0672716905" style="color: #60a5fa;">06 72 71 69 05</a> | 
            ✉️ <a href="mailto:crosyo69@gmail.com" style="color: #60a5fa;">crosyo69@gmail.com</a>
          </p>
        </div>
      </div>
    `;

    console.log("Sending email to owner...");
    
    // Send email to business owner using Resend API directly
    const ownerEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "KiteSurf Passion <noreply@kitesurfpassion.fr>",
        to: ["crosyo69@gmail.com"],
        subject: `Nouvelle réservation: ${escapeHtml(sanitized.activity)} - ${escapeHtml(sanitized.name)}`,
        html: ownerEmailHtml,
        reply_to: sanitized.email,
      }),
    });

    const ownerResult = await ownerEmailResponse.json();
    console.log("Owner email sent successfully");

    if (!ownerEmailResponse.ok) {
      throw new Error(ownerResult.message || "Failed to send owner email");
    }

    console.log("Sending confirmation email to customer...");
    
    // Send confirmation email to customer
    const customerEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "KiteSurf Passion <noreply@kitesurfpassion.fr>",
        to: [sanitized.email],
        subject: "Confirmation de votre demande - KiteSurf Passion",
        html: customerEmailHtml,
      }),
    });

    const customerResult = await customerEmailResponse.json();
    console.log("Customer email sent successfully");

    if (!customerEmailResponse.ok) {
      console.error("Failed to send customer email:", customerResult);
      // Don't throw error here, owner email was already sent
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Emails envoyés avec succès" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue. Veuillez réessayer." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);