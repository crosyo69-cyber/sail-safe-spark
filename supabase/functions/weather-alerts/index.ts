import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Almanarre coordinates
const ALMANARRE_LAT = 43.0667;
const ALMANARRE_LON = 6.1333;

interface WindData {
  wind_avg: number;
  wind_max: number;
  temperature: number;
  wind_direction: number;
}

async function fetchWindData(): Promise<WindData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${ALMANARRE_LAT}&longitude=${ALMANARRE_LON}&current=wind_speed_10m,wind_gusts_10m,temperature_2m,wind_direction_10m&wind_speed_unit=kn`
    );

    if (!response.ok) {
      console.error("Open-Meteo API error:", response.status);
      return null;
    }

    const data = await response.json();
    console.log("Open-Meteo data:", JSON.stringify(data.current));

    return {
      wind_avg: data.current.wind_speed_10m,
      wind_max: data.current.wind_gusts_10m,
      temperature: data.current.temperature_2m,
      wind_direction: data.current.wind_direction_10m,
    };
  } catch (error) {
    console.error("Error fetching wind data:", error);
    return null;
  }
}

function getWindDirection(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

const FROM_DOMAIN = "kitesurfpassion.fr";
const SITE_NAME = "Kitesurf Passion";

function buildAlertHtml(windData: WindData, unsubscribeToken: string): string {
  const windDirection = getWindDirection(windData.wind_direction);
  const unsubscribeUrl = `https://kitesurfpassion.fr/desabonnement-alertes?token=${unsubscribeToken}`;
  return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f0f9ff; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .wind-card { background: linear-gradient(135deg, #ecfeff, #cffafe); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .wind-value { font-size: 48px; font-weight: bold; color: #0891b2; }
            .wind-label { color: #64748b; font-size: 14px; margin-top: 5px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #334155; }
            .stat-label { color: #64748b; font-size: 12px; }
            .cta { text-align: center; margin: 30px 0; }
            .cta a { background: #0891b2; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            .footer a { color: #0891b2; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🪁 Alerte Kitesurf</h1>
              <p>Les conditions sont parfaites !</p>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Les conditions météo à l'Almanarre sont actuellement <strong>idéales pour le kitesurf</strong> !</p>
              
              <div class="wind-card">
                <div class="wind-value">${Math.round(windData.wind_avg)} nœuds</div>
                <div class="wind-label">Vent moyen</div>
              </div>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${Math.round(windData.wind_max)}</div>
                  <div class="stat-label">Rafales (nœuds)</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${windDirection}</div>
                  <div class="stat-label">Direction</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${Math.round(windData.temperature)}°C</div>
                  <div class="stat-label">Température</div>
                </div>
              </div>
              
              <div class="cta">
                <a href="https://kitesurfpassion.fr/spot-kitesurf-almanarre-hyeres-var">Voir les conditions en direct</a>
              </div>
              
              <p>À bientôt sur l'eau ! 🌊</p>
              <p><strong>L'équipe Kitesurf Passion</strong></p>
            </div>
            <div class="footer">
              <p>Vous recevez cet email car vous êtes abonné aux alertes météo de Kitesurf Passion.</p>
              <p><a href="${unsubscribeUrl}">Se désabonner des alertes météo</a></p>
            </div>
          </div>
        </body>
        </html>
  `;
}

// F-22-02 : l'alerte passe désormais par la chaîne e-mail F-21
// (enqueue_email -> process-email-queue -> suppression list / log / DLQ / retry).
// Aucun appel direct au fournisseur depuis cette fonction.
async function enqueueEmailAlert(
  supabase: any,
  email: string,
  windData: WindData,
  unsubscribeToken: string,
): Promise<boolean> {
  const messageId = crypto.randomUUID();
  const { error: logErr } = await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: "weather_alert",
    recipient_email: email,
    status: "pending",
  });
  if (logErr) console.error("email_send_log insert failed", logErr.message);

  const { error } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      run_id: crypto.randomUUID(),
      message_id: messageId,
      to: email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: FROM_DOMAIN,
      subject: "Conditions idéales pour le kitesurf à l'Almanarre !",
      html: buildAlertHtml(windData, unsubscribeToken),
      text: `Vent moyen ${Math.round(windData.wind_avg)} noeuds a l'Almanarre. https://kitesurfpassion.fr/spot-kitesurf-almanarre-hyeres-var`,
      purpose: "transactional",
      label: "weather_alert",
      queued_at: new Date().toISOString(),
    },
  });
  if (error) {
    console.error("enqueue_email failed for weather alert", error.message);
    return false;
  }
  return true;
}
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Restrict to service-role callers (pg_cron / admin scripts).
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  // Compare the raw bearer to the configured service-role key. Direct equality
  // with the server secret prevents forged role claims from invoking bulk emails.
  if (!token || !serviceKey || token !== serviceKey) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch current wind data from Open-Meteo
    const windData = await fetchWindData();

    if (!windData || windData.wind_avg === undefined) {
      console.log("No wind data available");
      return new Response(
        JSON.stringify({ message: "No wind data available", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const windSpeed = Math.round(windData.wind_avg);
    console.log("Current wind:", windSpeed, "knots (rounded from", windData.wind_avg, ")");

    // Fetch all enabled subscriptions where current wind is in range
    const { data: subscriptions, error } = await supabase
      .from("weather_alert_subscriptions")
      .select("id, email")
      .eq("enabled", true)
      .lte("min_wind", windSpeed)
      .gte("max_wind", windSpeed);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw error;
    }

    console.log("Subscriptions to notify:", subscriptions?.length || 0);

    // Send emails to all matching subscriptions
    let sentCount = 0;
    for (const subscription of subscriptions || []) {
      // D-4-FIX-2 : token de désinscription émis en mémoire (hash seul persisté)
      const { data: unsubToken } = await supabase.rpc("issue_link_token", {
        p_purpose: "weather_unsubscribe",
        p_subject_id: subscription.id,
        p_expires_at: null,
      });
      if (!unsubToken) {
        console.error("issue_link_token failed for a weather subscription");
        continue;
      }
      const success = await sendEmailAlert(
        subscription.email,
        windData,
        unsubToken as string,
        resendApiKey
      );
      if (success) sentCount++;
    }

    return new Response(
      JSON.stringify({
        message: "Weather alerts processed",
        windSpeed: windData.wind_avg,
        windGusts: windData.wind_max,
        temperature: windData.temperature,
        windDirection: getWindDirection(windData.wind_direction),
        sent: sentCount,
        total: subscriptions?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in weather-alerts function:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

Deno.serve(handler);
