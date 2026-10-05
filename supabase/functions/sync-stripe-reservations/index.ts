import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Maps the human-readable Stripe activity name to the DB `activity_type` enum.
// Only kitesurf and wingfoil use the new daily_group flow. Other activity
// names (rental, sea drops…) are still routed to the closest activity so the
// booking can be recorded.
function mapActivityToEnum(activityName: string): string {
  const n = (activityName || "").toLowerCase().trim();
  if (n.includes("100% glisse") || n.includes("100%glisse") || n.includes("stage 100")) return "stage_100_glisse";
  if (n.includes("wing")) return "wingfoil";
  if (n.includes("pump")) return "pumpfoil";
  if (n.includes("foil trac") || n.includes("tracté") || n.includes("tracte")) return "foil_tracte";
  return "kitesurf";
}

type SyncEntry = {
  stripe_session_id: string;
  email: string | null;
  name: string | null;
  activity_name: string | null;
  preferred_date: string | null;
  participants: number;
  status: "already_synced" | "inserted" | "skipped_no_email" | "error";
  detail?: string;
  reservation_id?: string;
};

async function syncOne(
  supabase: any,
  session: Stripe.Checkout.Session,
): Promise<SyncEntry> {
  const customerEmail = session.customer_details?.email ?? null;
  const customerName = session.metadata?.customer_name || session.customer_details?.name || null;
  const activityName = session.metadata?.activity_name || null;
  const preferredDate = session.metadata?.preferred_date || null;
  const phone = session.metadata?.phone || session.customer_details?.phone || "Non renseigné";
  const participants = Math.max(1, parseInt(session.metadata?.participants || "1", 10));

  const base: SyncEntry = {
    stripe_session_id: session.id,
    email: customerEmail,
    name: customerName,
    activity_name: activityName,
    preferred_date: preferredDate,
    participants,
    status: "already_synced",
  };

  // Idempotency
  const { data: existing } = await supabase
    .from("reservations")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return { ...base, status: "already_synced", reservation_id: existing.id };

  // A1 — Stage 100 % Glisse : réservé via client_packages/package_bookings,
  // jamais rattrapé en réservation à la carte.
  const { data: packs, error: packsErr } = await supabase
    .from("client_packages")
    .select("activity")
    .eq("stripe_session_id", session.id);
  if (packsErr) return { ...base, status: "error", detail: `client_packages: ${packsErr.message}` };
  const decision = decideRecovery({
    activityName,
    packActivities: (packs ?? []).map((p: { activity: string }) => p.activity),
  });
  if (decision === "stage_already_booked") {
    return { ...base, status: "already_synced", detail: "stage_packages" };
  }
  if (decision === "stage_left_to_manual") {
    console.warn("sync-stripe-reservations: paiement Stage sans pack, laissé à la gestion manuelle A0", {
      stripe_session_id: session.id,
    });
    return { ...base, status: "skipped_stage", detail: "stage_without_package_manual_handling" };
  }

  if (!customerEmail) {
    return { ...base, status: "skipped_no_email", detail: "No email in Stripe session" };
  }

  const nameParts = (customerName || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "Client";
  const lastName = nameParts.slice(1).join(" ") || "Stripe";
  const activityEnum = mapActivityToEnum(activityName || "kitesurf");
  const sessionDate = preferredDate || new Date().toISOString().split("T")[0];

  // New model: single RPC call, no time_slot. The RPC finds or creates the
  // next daily group for this (date, activity) and inserts the reservation.
  const { data: rpcData, error: rpcError } = await supabase.rpc("book_daily_visitor", {
    p_date: sessionDate,
    p_activity: activityEnum,
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: customerEmail,
    p_phone: phone,
    p_participants: participants,
    p_stripe_session_id: session.id,
    p_notes: `Acompte ${participants * 50}€ payé via Stripe – ${activityName || activityEnum}`,
  });

  if (rpcError) {
    // Notify admin so a human can act (refund / manual booking).
    const amountEuros = ((session.amount_total ?? participants * 5000) / 100).toFixed(2);
    const fullName = `${firstName} ${lastName}`.trim();
    await supabase.rpc("enqueue_admin_notification", {
      p_kind: "stripe_webhook_error",
      p_severity: "warning",
      p_title: `Réservation Stripe bloquée — ${fullName || customerEmail} (${activityName || activityEnum})`,
      p_body:
        `👤 ${fullName || "?"} · ${customerEmail} · ${phone}\n` +
        `🪁 ${activityName || activityEnum} · ${participants} pers · ${amountEuros}€\n` +
        `📅 ${sessionDate}\n` +
        `⚠️  Erreur : ${rpcError.message}\n` +
        `🔗 Stripe : ${session.id}`,
      p_metadata: {
        stripe_session_id: session.id,
        customer_name: fullName,
        phone, email: customerEmail,
        activity_name: activityName, activity: activityEnum,
        date: sessionDate, participants,
        amount_eur: Number(amountEuros),
        error: rpcError.message,
      },
      p_ref_key: `stripe_stuck:${session.id}`,
    }).catch(() => {});
    return { ...base, status: "error", detail: rpcError.message };
  }

  const res = rpcData as any;
  if (res?.already_synced) {
    return { ...base, status: "already_synced", reservation_id: res.reservation_id };
  }
  return { ...base, status: "inserted", reservation_id: res?.reservation_id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ---- Auth gate: service-role token (cron) OR authenticated admin user ----
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    let authorized = token === serviceRoleKey;
    let callerKind = authorized ? "service_role" : "unknown";
    let callerId: string | null = null;

    // Accept any still-valid service-role key (legacy or rotated) by probing
    // an admin-only endpoint with the presented token as the API key.
    if (!authorized) {
      try {
        const probeClient = createClient(Deno.env.get("SUPABASE_URL")!, token);
        const { error: probeError } = await probeClient.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (!probeError) {
          authorized = true;
          callerKind = "service_role_rotated";
        }
      } catch (_) {
        // not a service-role key — fall through to the user path
      }
    }

    if (!authorized) {
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: `Bearer ${token}` } } },
      );
      const { data: userData, error: userErr } = await authClient.auth.getUser(token);
      if (!userErr && userData?.user) {
        const { data: isAdmin } = await authClient.rpc("has_role", {
          _user_id: userData.user.id,
          _role: "admin",
        });
        authorized = isAdmin === true;
        if (authorized) {
          callerKind = "admin";
          callerId = userData.user.id;
        }
      }
    }

    if (!authorized) {
      console.warn("sync-stripe-reservations unauthorized call rejected");
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("sync-stripe-reservations authorized call", { caller: callerKind, caller_id: callerId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey,
    );

    const url = new URL(req.url);
    const lookbackDays = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days") || "60", 10)));
    const since = Math.floor(Date.now() / 1000) - lookbackDays * 86400;

    const sessions: Stripe.Checkout.Session[] = [];
    let starting_after: string | undefined;
    for (let i = 0; i < 20; i++) {
      const page = await stripe.checkout.sessions.list({
        limit: 100,
        status: "complete",
        created: { gte: since },
        ...(starting_after ? { starting_after } : {}),
      });
      sessions.push(...page.data);
      if (!page.has_more || page.data.length === 0) break;
      starting_after = page.data[page.data.length - 1].id;
    }

    const paid = sessions.filter((s) => s.payment_status === "paid");
    const report: SyncEntry[] = [];
    for (const s of paid) {
      try {
        const entry = await syncOne(supabase, s);
        if (entry.status === "error") {
          console.error("sync-stripe-reservations syncOne failed", {
            stripe_session_id: entry.stripe_session_id,
            email: entry.email,
            activity_name: entry.activity_name,
            preferred_date: entry.preferred_date,
            detail: entry.detail,
          });
        }
        report.push(entry);
      } catch (e: any) {
        console.error("sync-stripe-reservations syncOne threw", {
          stripe_session_id: s.id, message: String(e?.message || e),
        });
        report.push({
          stripe_session_id: s.id,
          email: s.customer_details?.email ?? null,
          name: s.customer_details?.name ?? null,
          activity_name: s.metadata?.activity_name ?? null,
          preferred_date: s.metadata?.preferred_date ?? null,
          participants: 1,
          status: "error",
          detail: String(e?.message || e),
        });
      }
    }

    const summary = {
      checked: paid.length,
      already_synced: report.filter((r) => r.status === "already_synced").length,
      inserted: report.filter((r) => r.status === "inserted").length,
      skipped_no_email: report.filter((r) => r.status === "skipped_no_email").length,
      errors: report.filter((r) => r.status === "error").length,
    };
    console.log("sync-stripe-reservations summary", summary);

    return new Response(JSON.stringify({ ok: true, lookback_days: lookbackDays, summary, report }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("sync-stripe-reservations error", error);
    return new Response(JSON.stringify({ ok: false, error: error?.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});