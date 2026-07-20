import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTIVITY_NAME_MAP: Record<string, string> = {
  "cours particulier kitesurf": "kitesurf",
  "stage 100% glisse": "stage_100_glisse",
  "cours à la carte": "kitesurf",
  "cours wingfoil": "wingfoil",
  "location matériel": "kitesurf",
};

const MAX_BY_ACTIVITY: Record<string, number> = {
  kitesurf: 4,
  wingfoil: 3,
  pumpfoil: 4,
  foil_tracte: 4,
  stage_100_glisse: 4,
};

function mapActivityToEnum(activityName: string): string {
  const normalized = (activityName || "").toLowerCase().trim();
  if (normalized.includes("100% glisse") || normalized.includes("100%glisse") || normalized.includes("stage 100")) {
    return "stage_100_glisse";
  }
  for (const [key, value] of Object.entries(ACTIVITY_NAME_MAP)) {
    if (normalized && (normalized.includes(key) || key.includes(normalized))) return value;
  }
  if (normalized.includes("kite")) return "kitesurf";
  if (normalized.includes("wing")) return "wingfoil";
  if (normalized.includes("pump")) return "pumpfoil";
  if (normalized.includes("foil trac") || normalized.includes("tracté")) return "foil_tracte";
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

  // Idempotency check
  const { data: existing } = await supabase
    .from("reservations")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return { ...base, status: "already_synced", reservation_id: existing.id };

  if (!customerEmail) {
    return { ...base, status: "skipped_no_email", detail: "No email in Stripe session" };
  }

  const nameParts = (customerName || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "Client";
  const lastName = nameParts.slice(1).join(" ") || "Stripe";

  const activityEnum = mapActivityToEnum(activityName || "kitesurf");
  const maxParticipants = MAX_BY_ACTIVITY[activityEnum] || 4;
  const sessionDate = preferredDate || new Date().toISOString().split("T")[0];

  // Find or create session for that date + activity
  const { data: existingSessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("date", sessionDate)
    .eq("activity", activityEnum)
    .eq("time_slot", "morning")
    .limit(1);

  let sessionId: string | null = null;
  if (existingSessions && existingSessions.length > 0) {
    sessionId = existingSessions[0].id;
  } else {
    const { data: created, error: sErr } = await supabase
      .from("sessions")
      .insert({
        date: sessionDate,
        time_slot: "morning",
        activity: activityEnum,
        max_participants: maxParticipants,
        status: "open",
        notes: `Session auto-créée via sync Stripe – ${activityName || activityEnum}`,
      })
      .select("id")
      .single();
    if (sErr || !created) {
      // Race / pre-existing row with non-open status: fetch it regardless of status.
      const { data: fallback } = await supabase
        .from("sessions")
        .select("id")
        .eq("date", sessionDate)
        .eq("activity", activityEnum)
        .eq("time_slot", "morning")
        .maybeSingle();
      if (fallback?.id) {
        sessionId = fallback.id;
      } else {
        return { ...base, status: "error", detail: `session create failed: ${sErr?.message}` };
      }
    } else {
      sessionId = created.id;
    }
  }

  const { data: insRes, error: resErr } = await supabase
    .from("reservations")
    .insert({
      session_id: sessionId,
      first_name: firstName,
      last_name: lastName,
      email: customerEmail,
      phone,
      skill_level: "debutant",
      participants,
      status: "confirmed",
      stripe_session_id: session.id,
      notes: `Acompte ${participants * 50}€ payé via Stripe – ${activityName || activityEnum} (sync auto)`,
    })
    .select("id")
    .single();

  if (resErr) {
    // Race condition: another worker just inserted the same one
    if (String(resErr.message || "").toLowerCase().includes("duplicate")) {
      const { data: ex2 } = await supabase
        .from("reservations").select("id").eq("stripe_session_id", session.id).maybeSingle();
      return { ...base, status: "already_synced", reservation_id: ex2?.id };
    }
    return { ...base, status: "error", detail: `reservation insert failed: ${resErr.message}` };
  }

  return { ...base, status: "inserted", reservation_id: insRes?.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const lookbackDays = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days") || "60", 10)));
    const since = Math.floor(Date.now() / 1000) - lookbackDays * 86400;

    // Paginate completed checkout sessions
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
          stripe_session_id: s.id,
          email: s.customer_details?.email ?? null,
          activity_name: s.metadata?.activity_name ?? null,
          preferred_date: s.metadata?.preferred_date ?? null,
          message: String(e?.message || e),
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