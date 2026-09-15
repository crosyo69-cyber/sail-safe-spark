import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveOrigin, assertSafeRedirectUrl } from "./origin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, idempotency-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Minimal contract used by the handler. Tests inject a fake; production uses
// the real Stripe SDK via createStripeClient().
export interface CheckoutClient {
  checkout: {
    sessions: {
      create(
        params: Record<string, unknown>,
        options?: { idempotencyKey?: string },
      ): Promise<{ url: string | null }>;
    };
  };
}

/**
 * Idempotency-Key contract (P0-1).
 *
 * The client generates ONE key per payment intention and reuses it verbatim
 * across retries of that intention. The key is forwarded to Stripe so that
 * duplicate requests return the SAME Checkout Session instead of creating a
 * new one. A request without a valid key is rejected: this function is now
 * declared idempotent and must not silently create unbounded sessions.
 */
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9._:-]{16,255}$/;

export function readIdempotencyKey(req: Request): string | null {
  const raw = req.headers.get("Idempotency-Key") ?? req.headers.get("idempotency-key");
  if (!raw) return null;
  const key = raw.trim();
  return IDEMPOTENCY_KEY_RE.test(key) ? key : null;
}

/** Log-safe fingerprint: never print the raw key. */
function keyFingerprint(key: string): string {
  return `${key.slice(0, 4)}…${key.slice(-4)} (len=${key.length})`;
}

interface RateGuardClient {
  rpc(
    functionName: "public_rate_guard",
    args: { p_context: string; p_key: string; p_limit: number; p_window: string },
  ): Promise<{ data: boolean | null; error: { message?: string } | null }>;
  // F-27-01 : capacité métier d'un daily_group (source de vérité SQL).
  rpc(
    functionName: "default_max_participants",
    args: { _activity: string },
  ): Promise<{ data: number | null; error: { message?: string } | null }>;
}


function createRateGuardClient(): RateGuardClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Rate guard configuration is unavailable");
  }
  return createClient(supabaseUrl, serviceRoleKey) as unknown as RateGuardClient;
}

/**
 * The edge proxy supplies the right-most forwarded address. A non-empty
 * fallback is mandatory because an empty key bypasses public_rate_guard.
 */
export function clientIp(req: Request): string {
  const forwarded = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const forwardedIp = forwarded.at(-1);
  if (forwardedIp) return forwardedIp.slice(0, 128);

  const realIp = (req.headers.get("x-real-ip") ?? "").trim();
  return realIp ? realIp.slice(0, 128) : "unknown-ip";
}

async function rateGuard(
  supabase: RateGuardClient,
  context: string,
  key: string,
  limit: number,
  window: string,
): Promise<Response | null> {
  const { data: allowed, error } = await supabase.rpc("public_rate_guard", {
    p_context: context,
    p_key: key.trim() || "unknown-ip",
    p_limit: limit,
    p_window: window,
  });

  if (error) {
    console.error("create-checkout rate guard unavailable", context, error.message ?? "unknown error");
    return new Response(JSON.stringify({ error: "Service temporairement indisponible" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (allowed !== true) {
    return new Response(JSON.stringify({ error: "Trop de demandes. Merci de réessayer plus tard." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return null;
}

function createStripeClient(): CheckoutClient {
  return new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
  }) as unknown as CheckoutClient;
}

export function createHandler(
  stripeFactory: () => CheckoutClient = createStripeClient,
  originResolver: (rawOrigin: string | null) => string = (raw) => resolveOrigin(raw),
  rateGuardFactory: () => RateGuardClient = createRateGuardClient,
) {
  return async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const idempotencyKey = readIdempotencyKey(req);
    if (!idempotencyKey) {
      return new Response(
        JSON.stringify({
          error:
            "Idempotency-Key header is required (16-255 chars, [A-Za-z0-9._:-]).",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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

    // F-27-01 : la validation métier (activité connue + capacité réelle) doit
    // se faire AVANT tout appel Stripe. Le client service_role est donc créé
    // ici : il sert à la fois à lire la capacité et aux garde-fous F-05.1.
    let rateGuardClient: RateGuardClient;
    try {
      rateGuardClient = rateGuardFactory();
    } catch (error) {
      console.error("create-checkout rate guard configuration unavailable", error);
      return new Response(JSON.stringify({ error: "Service temporairement indisponible" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Activité inconnue → rejet (pas de repli silencieux vers kitesurf).
    const activityEnum = resolveActivityEnum(activityName);
    if (!activityEnum) {
      return new Response(JSON.stringify({ error: `Activité inconnue : "${activityName}".` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Capacité maximale d'un daily_group : source de vérité SQL, la même que
    // celle appliquée par enforce_daily_group_capacity. Fail-closed.
    const { data: maxParticipants, error: capacityError } = await rateGuardClient.rpc(
      "default_max_participants",
      { _activity: activityEnum },
    );
    if (capacityError || typeof maxParticipants !== "number" || !Number.isInteger(maxParticipants) || maxParticipants < 1) {
      console.error("create-checkout capacity lookup unavailable", capacityError?.message ?? "invalid capacity");
      return new Response(JSON.stringify({ error: "Service temporairement indisponible" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const count = parseParticipants(participants);
    if (count === null) {
      return new Response(JSON.stringify({ error: "participants doit être un entier positif." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (count > maxParticipants) {
      return new Response(
        JSON.stringify({
          error:
            `Un groupe "${activityName}" accueille au maximum ${maxParticipants} participant${maxParticipants > 1 ? "s" : ""}. ` +
            `Merci de nous contacter pour un groupe plus important.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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

    // F-05.1: both windows are checked before Stripe is touched. The service
    // role is required because public_rate_attempts is intentionally private.
    const ip = clientIp(req);
    const shortWindow = await rateGuard(rateGuardClient, "create_checkout_ip_10m", ip, 3, "10 minutes");
    if (shortWindow) return shortWindow;
    const hourlyWindow = await rateGuard(rateGuardClient, "create_checkout_ip_1h", ip, 10, "1 hour");
    if (hourlyWindow) return hourlyWindow;


    const origin = originResolver(req.headers.get("origin"));

    const PRICE_ID = "price_1TAXYhJTWAAnYv4Vnnoy6jIP";

    const successUrl = `${origin}/reservation-confirmee?activity=${encodeURIComponent(activityName)}`;
    const cancelUrl = `${origin}/contact-reservation-kitesurf-hyeres`;

    // Defense in depth: strictly validate every redirect URL handed to Stripe.
    // Rejects non-https, explicit ports, upper-case hosts, userinfo, and any
    // host not in the active allowlist — even if resolveOrigin() is ever
    // weakened upstream.
    try {
      assertSafeRedirectUrl(successUrl);
      assertSafeRedirectUrl(cancelUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid redirect origin" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = stripeFactory();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price: PRICE_ID,
          // Acompte = nombre de séances × 50 €. Pour les activités facturées
          // par participant (cours particulier, location, foil tracté,
          // déposes en mer), packSessions == count donc le montant reste
          // identique. Pour les packs (Cours à la Carte, Wingfoil) et le
          // Stage 100 % Glisse, l'acompte suit désormais le nombre de
          // séances réservées (ex. 5 jours de stage → 250 €).
          quantity: packSessions,
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
      success_url: successUrl,
      cancel_url: cancelUrl,
    }, { idempotencyKey });

    console.log(
      `create-checkout: session created (idempotencyKey=${keyFingerprint(idempotencyKey)}, activity="${activityName}", sessions=${packSessions})`,
    );

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    const message = error instanceof Error ? error.message : "Erreur lors de la création du paiement";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  };
}

if (import.meta.main) {
  Deno.serve(createHandler());
}
