import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Windguru station ID for Almanarre
const WINDGURU_STATION_ID = "1061";

interface WindguruData {
  wind_avg?: number;
  wind_max?: number;
  temperature?: number;
  wind_direction?: number;
}

async function fetchWindguruData(): Promise<WindguruData | null> {
  try {
    // Windguru API for station data
    const response = await fetch(
      `https://www.windguru.cz/int/iapi.php?q=station_data_current&id_station=${WINDGURU_STATION_ID}`
    );
    
    if (!response.ok) {
      console.error("Windguru API error:", response.status);
      return null;
    }
    
    const data = await response.json();
    console.log("Windguru data:", JSON.stringify(data));
    
    return {
      wind_avg: data.wind_avg,
      wind_max: data.wind_max,
      temperature: data.temperature,
      wind_direction: data.wind_direction,
    };
  } catch (error) {
    console.error("Error fetching Windguru data:", error);
    return null;
  }
}

function getWindDirection(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

async function sendEmailAlert(
  email: string,
  windData: WindguruData,
  resendApiKey: string
): Promise<boolean> {
  try {
    const resend = new Resend(resendApiKey);

    const windDirection = windData.wind_direction 
      ? getWindDirection(windData.wind_direction) 
      : "N/A";

    const emailResponse = await resend.emails.send({
      from: "Kitesurf Passion <onboarding@resend.dev>",
      to: [email],
      subject: "🪁 Conditions idéales pour le kitesurf à l'Almanarre !",
      html: `
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
                <div class="wind-value">${Math.round(windData.wind_avg || 0)} nœuds</div>
                <div class="wind-label">Vent moyen</div>
              </div>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${Math.round(windData.wind_max || 0)}</div>
                  <div class="stat-label">Rafales (nœuds)</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${windDirection}</div>
                  <div class="stat-label">Direction</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${Math.round(windData.temperature || 0)}°C</div>
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
              <p>Vous recevez cet email car vous êtes abonné aux alertes météo.</p>
              <p><a href="https://kitesurfpassion.fr/spot-kitesurf-almanarre-hyeres-var">Se désabonner</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent to:", email, emailResponse);
    return true;
  } catch (error) {
    console.error("Error sending email to:", email, error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // Fetch current wind data
    const windData = await fetchWindguruData();
    
    if (!windData || windData.wind_avg === undefined) {
      console.log("No wind data available");
      return new Response(
        JSON.stringify({ message: "No wind data available", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Current wind:", windData.wind_avg, "knots");

    // Fetch all enabled subscriptions where current wind is in range
    const { data: subscriptions, error } = await supabase
      .from("weather_alert_subscriptions")
      .select("*")
      .eq("enabled", true)
      .lte("min_wind", windData.wind_avg)
      .gte("max_wind", windData.wind_avg);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw error;
    }

    console.log("Subscriptions to notify:", subscriptions?.length || 0);

    // Send emails to all matching subscriptions
    let sentCount = 0;
    for (const subscription of subscriptions || []) {
      const success = await sendEmailAlert(subscription.email, windData, resendApiKey);
      if (success) sentCount++;
    }

    return new Response(
      JSON.stringify({ 
        message: "Weather alerts processed",
        windSpeed: windData.wind_avg,
        sent: sentCount,
        total: subscriptions?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in weather-alerts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
