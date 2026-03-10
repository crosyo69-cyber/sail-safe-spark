import Stripe from "https://esm.sh/stripe@14.21.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      console.error("Missing signature or webhook secret");
      return new Response("Missing signature", { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`Received event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const customerEmail = session.customer_details?.email;
      const activityName =
        session.line_items?.data?.[0]?.description ||
        session.metadata?.activity_name ||
        "votre activité";

      // Retrieve line items to get product description
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 1,
      });
      const description = lineItems.data?.[0]?.description || activityName;

      // Extract the activity name from "Acompte – Cours Particulier Kitesurf"
      const cleanActivityName = description.replace(/^Acompte\s*[–-]\s*/, "");

      console.log(`Payment completed for: ${customerEmail}, activity: ${cleanActivityName}`);

      if (customerEmail) {
        // Send confirmation email to customer
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">KiteSurf Passion</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Hyères - L'Almanarre</p>
            </div>
            
            <div style="padding: 30px; background: #ffffff;">
              <h2 style="color: #0284c7;">Votre réservation est confirmée !</h2>
              
              <p>Bonjour,</p>
              
              <p>Nous avons bien reçu votre acompte de <strong>50€</strong> pour <strong>${escapeHtml(cleanActivityName)}</strong>.</p>
              
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0284c7; margin-top: 0;">Récapitulatif</h3>
                <ul style="padding-left: 20px; line-height: 1.8;">
                  <li><strong>Prestation :</strong> ${escapeHtml(cleanActivityName)}</li>
                  <li><strong>Acompte versé :</strong> 50€</li>
                  <li><strong>Solde :</strong> à régler le jour de votre cours</li>
                </ul>
              </div>

              <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-weight: bold; color: #92400e;">📞 Important</p>
                <p style="margin: 10px 0 0 0; color: #92400e;">
                  Contactez-nous <strong>la veille de votre venue</strong> pour confirmer votre créneau horaire en fonction des conditions météo.
                </p>
              </div>
              
              <p>
                <strong>Téléphone :</strong> 
                <a href="tel:0672716905" style="color: #0284c7; font-size: 18px; font-weight: bold;">06 72 71 69 05</a>
              </p>
              
              <p style="margin-top: 30px;">À très bientôt sur l'eau ! 🪁</p>
              
              <p>
                <strong>L'équipe KiteSurf Passion</strong><br>
                <span style="color: #666;">Première école de kitesurf du Var depuis 1999</span>
              </p>
            </div>
            
            <div style="background: #1e3a5f; padding: 20px; text-align: center; color: white;">
              <p style="margin: 0 0 10px 0;">📍 Spot de l'Almanarre, Hyères (Var)</p>
              <p style="margin: 0;">
                📞 <a href="tel:0672716905" style="color: #60a5fa;">06 72 71 69 05</a> | 
                ✉️ <a href="mailto:crosyo69@gmail.com" style="color: #60a5fa;">crosyo69@gmail.com</a>
              </p>
              <p style="margin: 10px 0 0 0;">
                <a href="https://www.kitesurfpassion.fr" style="color: #60a5fa;">www.kitesurfpassion.fr</a>
              </p>
            </div>
          </div>
        `;

        // Send to customer
        const customerRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "KiteSurf Passion <noreply@kitesurfpassion.fr>",
            to: [customerEmail],
            subject: `Confirmation de réservation – ${escapeHtml(cleanActivityName)}`,
            html: emailHtml,
          }),
        });

        const customerResult = await customerRes.json();
        if (!customerRes.ok) {
          console.error("Failed to send customer email:", customerResult);
        } else {
          console.log("Customer confirmation email sent successfully");
        }

        // Send notification to owner
        const ownerRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "KiteSurf Passion <noreply@kitesurfpassion.fr>",
            to: ["crosyo69@gmail.com"],
            subject: `💰 Acompte reçu – ${escapeHtml(cleanActivityName)} (${customerEmail})`,
            html: `
              <h2>Nouvel acompte reçu !</h2>
              <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                <tr style="background: #f5f5f5;">
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Prestation</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(cleanActivityName)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email client</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${escapeHtml(customerEmail)}">${escapeHtml(customerEmail)}</a></td>
                </tr>
                <tr style="background: #f5f5f5;">
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>Montant</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>50€</strong></td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>ID Stripe</strong></td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${session.id}</td>
                </tr>
              </table>
              <p style="margin-top: 15px; color: #666;">
                Le client a été invité à vous contacter la veille pour confirmer son créneau.
              </p>
            `,
            reply_to: customerEmail,
          }),
        });

        const ownerResult = await ownerRes.json();
        if (!ownerRes.ok) {
          console.error("Failed to send owner notification:", ownerResult);
        } else {
          console.log("Owner notification email sent successfully");
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
