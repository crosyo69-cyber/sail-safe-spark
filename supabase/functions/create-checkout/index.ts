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
    const { activityName, participants, preferredDate, phone, customerName, totalSessions } = await req.json();

    if (!activityName || typeof activityName !== "string") {
      return new Response(JSON.stringify({ error: "activityName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!preferredDate || typeof preferredDate !== "string") {
      return new Response(JSON.stringify({ error: "preferredDate is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!phone || typeof phone !== "string") {
      return new Response(JSON.stringify({ error: "phone is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!customerName || typeof customerName !== "string") {
      return new Response(JSON.stringify({ error: "customerName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const count = Math.max(1, Math.min(6, Math.floor(Number(participants) || 1)));
    const packSessions = Math.max(1, Math.min(20, Math.floor(Number(totalSessions) || count)));

    // Server-side validation: total_sessions must match the activity's allowed pack sizes.
    const name = String(activityName).toLowerCase();
    let allowed: number[];
    if (name.includes("carte")) {
      allowed = [1, 3, 5, 10];
    } else if (name.includes("wingfoil")) {
      allowed = [1, 3, 5];
    } else if (name.includes("100%") || name.includes("100% glisse") || name.includes("stage 100")) {
      allowed = [5];
    } else {
      // per-participant activities (cours particulier, location, foil tracté, déposes en mer)
      allowed = [1, 2, 3, 4, 5, 6];
      // must equal participant count
      if (packSessions !== count) {
        return new Response(
          JSON.stringify({
            error: `Pour "${activityName}", total_sessions doit être égal au nombre de participants (${count}).`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }
    if (!allowed.includes(packSessions)) {
      return new Response(
        JSON.stringify({
          error: `Pack invalide pour "${activityName}". Valeurs autorisées : ${allowed.join(", ")}.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    const ALLOWED_ORIGINS = new Set([
      "https://www.kitesurfpassion.fr",
      "https://kitesurfpassion.fr",
      "https://www.kitesurfpassion.com",
      "https://kitesurfpassion.com",
    ]);
    const rawOrigin = req.headers.get("origin") ?? "";
    const origin = ALLOWED_ORIGINS.has(rawOrigin)
      ? rawOrigin
      : "https://www.kitesurfpassion.fr";

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
        preferred_date: preferredDate,
        phone: phone.trim(),
        customer_name: customerName.trim(),
        total_sessions: String(packSessions),
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
