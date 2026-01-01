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
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received contact form request");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ContactFormRequest = await req.json();
    console.log("Form data received:", { ...data, email: "***" });

    // Validate required fields
    if (!data.name || !data.email || !data.activity) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Nom, email et activité sont requis" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Email to the business owner
    const ownerEmailHtml = `
      <h2>Nouvelle demande de réservation</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Nom</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${data.email}">${data.email}</a></td>
        </tr>
        ${data.phone ? `
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Téléphone</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${data.phone}">${data.phone}</a></td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Activité</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.activity}</td>
        </tr>
        ${data.startDate ? `
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date de début</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.startDate}</td>
        </tr>
        ` : ''}
        ${data.endDate ? `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date de fin</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.endDate}</td>
        </tr>
        ` : ''}
        ${data.participants ? `
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Nombre de participants</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.participants}</td>
        </tr>
        ` : ''}
        ${data.message ? `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Message</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.message}</td>
        </tr>
        ` : ''}
      </table>
      <p style="margin-top: 20px; color: #666;">
        Envoyé depuis le formulaire de contact du site KiteSurf Passion
      </p>
    `;

    // Email confirmation to the customer
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">KiteSurf Passion</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Hyères - L'Almanarre</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #0284c7;">Bonjour ${data.name},</h2>
          
          <p>Nous avons bien reçu votre demande de réservation pour <strong>${data.activity}</strong>.</p>
          
          <p>Notre équipe vous contactera dans les plus brefs délais pour confirmer votre réservation.</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0284c7; margin-top: 0;">Récapitulatif de votre demande</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Activité :</strong> ${data.activity}</li>
              ${data.startDate ? `<li><strong>Date de début :</strong> ${data.startDate}</li>` : ''}
              ${data.endDate ? `<li><strong>Date de fin :</strong> ${data.endDate}</li>` : ''}
              ${data.participants ? `<li><strong>Participants :</strong> ${data.participants}</li>` : ''}
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
            ✉️ <a href="mailto:contact@kitesurfpassion.com" style="color: #60a5fa;">contact@kitesurfpassion.com</a>
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
        from: "KiteSurf Passion <noreply@kitesurfpassion.com>",
        to: ["contact@kitesurfpassion.com"],
        subject: `Nouvelle réservation: ${data.activity} - ${data.name}`,
        html: ownerEmailHtml,
        reply_to: data.email,
      }),
    });

    const ownerResult = await ownerEmailResponse.json();
    console.log("Owner email response:", ownerResult);

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
        from: "KiteSurf Passion <noreply@kitesurfpassion.com>",
        to: [data.email],
        subject: "Confirmation de votre demande - KiteSurf Passion",
        html: customerEmailHtml,
      }),
    });

    const customerResult = await customerEmailResponse.json();
    console.log("Customer email response:", customerResult);

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
