import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activityName, participants } = await req.json();

    if (!activityName || typeof activityName !== "string") {
      return new Response(JSON.stringify({ error: "activityName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const count = Math.max(1, Math.min(6, Math.floor(Number(participants) || 1)));

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    const origin =
      req.headers.get("origin") || "https://www.kitesurfpassion.fr";

    const PRICE_ID = "price_1TAXYhJTWAAnYv4Vnnoy6jIP";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price: PRICE_ID,
          quantity: count,
        },
      ],
      metadata: {
        activity_name: activityName,
        participants: String(count),
      },
      success_url: `${origin}/reservation-confirmee?activity=${encodeURIComponent(activityName)}`,
      cancel_url: `${origin}/contact-reservation-kitesurf-hyeres`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur lors de la création du paiement" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
