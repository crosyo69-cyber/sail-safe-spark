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

  // Try each time_slot in order — if morning is closed/full, fall back to
  // afternoon slots so paid customers don't stay stuck forever.
  const SLOTS: Array<"morning" | "early_afternoon" | "late_afternoon"> = [
    "morning", "early_afternoon", "late_afternoon",
  ];

  async function findOrCreateSession(slot: string): Promise<{ id: string | null; err?: string }> {
    const { data: existing } = await supabase
      .from("sessions")
      .select("id, status")
      .eq("date", sessionDate)
      .eq("activity", activityEnum)
      .eq("time_slot", slot)
      .maybeSingle();
    if (existing?.id) return { id: existing.id };
    const { data: created, error: sErr } = await supabase
      .from("sessions")
      .insert({
        date: sessionDate,
        time_slot: slot,
        activity: activityEnum,
        max_participants: maxParticipants,
        status: "open",
        notes: `Session auto-créée via sync Stripe – ${activityName || activityEnum}`,
      })
      .select("id")
      .single();
    if (created?.id) return { id: created.id };
    // Race: someone inserted it concurrently
    const { data: fb } = await supabase
      .from("sessions").select("id")
      .eq("date", sessionDate).eq("activity", activityEnum).eq("time_slot", slot)
      .maybeSingle();
    return { id: fb?.id ?? null, err: sErr?.message };
  }

  let lastErr = "";
  let preferredClosed = false;
  let preferredClosedReason = "";
  const slotAttempts: Array<{
    slot: string;
    session_id: string | null;
    outcome: "assigned" | "closed" | "full" | "lookup_failed" | "error";
    detail?: string;
    occupancy?: any;
  }> = [];

  const SLOT_LABEL: Record<string, string> = {
    morning: "Matin",
    early_afternoon: "Début d'après-midi",
    late_afternoon: "Fin d'après-midi",
  };
  const fullName = `${firstName} ${lastName}`.trim();
  const amountEuros = ((session.amount_total ?? participants * 5000) / 100).toFixed(2);

  for (const slot of SLOTS) {
    const { id: sessionId, err: findErr } = await findOrCreateSession(slot);
    if (!sessionId) {
      lastErr = findErr || "session lookup failed";
      slotAttempts.push({ slot, session_id: null, outcome: "lookup_failed", detail: lastErr });
      continue;
    }

    // Snapshot occupancy for diagnostics (best-effort).
    let occupancy: any = undefined;
    try {
      const { data: occ } = await supabase.rpc("get_slot_occupancy", {
        p_date: sessionDate, p_slot: slot,
      });
      occupancy = occ;
    } catch { /* ignore */ }

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
        notes: `Acompte ${participants * 50}€ payé via Stripe – ${activityName || activityEnum} (sync auto${slot !== "morning" ? `, créneau ${slot}` : ""})`,
      })
      .select("id")
      .single();

    if (!resErr) {
      slotAttempts.push({ slot, session_id: sessionId, outcome: "assigned", occupancy });
      // If the customer's preferred (morning) slot was closed/full and we
      // silently placed them on an afternoon fallback, still alert admins so
      // they can confirm the schedule change with the customer.
      if (preferredClosed && slot !== "morning") {
        const alternativesTried = slotAttempts
          .filter(a => a.slot !== slot)
          .map(a => `${SLOT_LABEL[a.slot] || a.slot} → ${a.outcome}`).join(" · ");
        await supabase.rpc("enqueue_admin_notification", {
          p_kind: "stripe_webhook_error",
          p_severity: "info",
          p_title: `Basculement créneau — ${fullName || customerEmail} (${activityName || activityEnum})`,
          p_body:
            `👤 ${fullName || "?"} · ${customerEmail} · ${phone}\n` +
            `🪁 ${activityName || activityEnum} · ${participants} pers · ${amountEuros}€\n` +
            `📅 ${sessionDate} — créneau demandé : Matin (${preferredClosedReason})\n` +
            `✅ Placé sur : ${SLOT_LABEL[slot] || slot}\n` +
            `🔎 Créneaux testés : ${alternativesTried || "—"}\n` +
            `🔗 Stripe : ${session.id}`,
          p_metadata: {
            stripe_session_id: session.id,
            customer_name: fullName,
            phone,
            email: customerEmail,
            activity_name: activityName,
            activity: activityEnum,
            date: sessionDate,
            preferred_slot: "morning",
            assigned_slot: slot,
            assigned_session_id: sessionId,
            participants,
            amount_eur: Number(amountEuros),
            reason: preferredClosedReason,
            slot_attempts: slotAttempts,
          },
          p_ref_key: `stripe_slot_shift:${session.id}`,
        }).catch(() => {});
      }
      return { ...base, status: "inserted", reservation_id: insRes?.id };
    }

    const msg = String(resErr.message || "").toLowerCase();
    if (msg.includes("duplicate")) {
      const { data: ex2 } = await supabase
        .from("reservations").select("id").eq("stripe_session_id", session.id).maybeSingle();
      return { ...base, status: "already_synced", reservation_id: ex2?.id };
    }
    lastErr = resErr.message;
    const outcome: "closed" | "full" | "error" =
      msg.includes("slot_full") ? "full"
      : msg.includes("session_closed") ? "closed"
      : "error";
    slotAttempts.push({ slot, session_id: sessionId, outcome, detail: resErr.message, occupancy });
    // Only fall through to next slot when the session/slot is unavailable.
    if (!msg.includes("session_closed") && !msg.includes("slot_full")) break;
    if (slot === "morning") {
      preferredClosed = true;
      preferredClosedReason = msg.includes("slot_full") ? "slot_full" : "session_closed";
    }
  }

  // All slots exhausted — notify admins once (idempotent via ref_key) so a
  // human can manually reopen a session, refund, or contact the customer,
  // instead of the cron retrying and error-logging forever.
  const attemptsSummary = slotAttempts
    .map(a => `${SLOT_LABEL[a.slot] || a.slot} → ${a.outcome}`).join(" · ");

  // Find real availabilities in the next 14 days for the same activity so the
  // customer email can propose concrete alternatives instead of a generic
  // "contact us" message.
  type Alt = { date: string; time_slot: string; taken: number; capacity: number };
  const alternatives: Alt[] = [];
  try {
    const from = sessionDate;
    const toDate = new Date(sessionDate + "T00:00:00Z");
    toDate.setUTCDate(toDate.getUTCDate() + 14);
    const to = toDate.toISOString().split("T")[0];
    const { data: candidates } = await supabase
      .from("sessions")
      .select("date, time_slot, status")
      .eq("activity", activityEnum)
      .eq("status", "open")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true })
      .limit(50);
    for (const c of (candidates || [])) {
      if (c.date === sessionDate) continue; // same day already tried
      const { data: occ } = await supabase.rpc("get_slot_occupancy", {
        p_date: c.date, p_slot: c.time_slot,
      });
      const capacity = Number((occ as any)?.capacity ?? 0);
      const taken = Number((occ as any)?.taken ?? 0);
      if (capacity > 0 && taken < capacity) {
        alternatives.push({ date: c.date, time_slot: c.time_slot, taken, capacity });
        if (alternatives.length >= 6) break;
      }
    }
  } catch { /* best-effort */ }

  // Send customer email once (idempotent via deterministic message_id).
  try {
    const msgId = `stripe-stuck-${session.id}`;
    const { data: already } = await supabase
      .from("email_send_log")
      .select("message_id")
      .eq("message_id", msgId)
      .maybeSingle();
    if (!already && customerEmail) {
      const fmtDate = (d: string) => {
        const [y, m, day] = d.split("-");
        return `${day}/${m}/${y}`;
      };
      const activityLabel = activityName || activityEnum;
      const resumeBase = "https://www.kitesurfpassion.fr/reserver";
      const resumeParams = (extra: Record<string, string> = {}) => {
        const p = new URLSearchParams({
          activity: activityEnum,
          participants: String(participants),
          email: customerEmail,
          name: fullName,
          ref: session.id.slice(-8),
          ...extra,
        });
        return `${resumeBase}?${p.toString()}`;
      };
      const resumeUrl = resumeParams();
      const altRows = alternatives.length
        ? alternatives.map(a => `
            <tr><td style="padding:0;border-bottom:1px solid #e2e8f0;">
              <a href="${resumeParams({ date: a.date, slot: a.time_slot })}" style="display:block;padding:10px 12px;color:#0F172A;font-size:14px;text-decoration:none;">
                <strong>${fmtDate(a.date)}</strong> · ${SLOT_LABEL[a.time_slot] || a.time_slot}
                <span style="color:#64748B;">— ${a.capacity - a.taken} place(s)</span>
                <span style="float:right;color:#0891B2;font-weight:bold;">Réserver →</span>
              </a>
            </td></tr>`).join("")
        : `<tr><td style="padding:12px;color:#64748B;font-size:14px;">Aucun créneau libre dans les 14 prochains jours — contactez-nous au 06 72 71 69 05.</td></tr>`;

      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
<tr><td style="background:#0F172A;padding:24px;text-align:center;">
<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180"/></td></tr>
<tr><td style="padding:32px 25px 0;">
<h1 style="font-size:22px;color:#0F172A;margin:0 0 12px;">Bonjour ${firstName},</h1>
<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 12px;">
Nous avons bien reçu votre acompte pour <strong>${activityLabel}</strong> le <strong>${fmtDate(sessionDate)}</strong>.
Malheureusement, tous les créneaux de cette journée sont désormais complets — nous ne pouvons pas confirmer cette date.
</p>
<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">
✅ <strong>Votre acompte est conservé.</strong> Cliquez sur le bouton ci-dessous pour reprendre votre réservation en un clic — vos informations sont pré-remplies.
</p>
<div style="text-align:center;margin:0 0 8px;">
<a href="${resumeUrl}" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:14px 28px;text-decoration:none;font-size:15px;">🔄 Reprendre ma réservation</a>
</div>
<p style="font-size:12px;color:#94a3b8;text-align:center;margin:0 0 8px;">Réf. paiement : ${session.id.slice(-8)}</p>
</td></tr>
<tr><td style="padding:0 25px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;overflow:hidden;">
<tr><td style="padding:12px;background:#0891B2;color:#fff;font-weight:bold;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
Créneaux disponibles (cliquez pour réserver)</td></tr>
${altRows}
</table></td></tr>
<tr><td style="padding:0 25px 24px;">
<p style="font-size:13px;color:#64748B;margin:0;">Une question ? Appelez-nous au <strong>06 72 71 69 05</strong> — nous replacerons votre acompte manuellement.</p>
</td></tr>
<tr><td style="background:#0F172A;padding:16px 25px;text-align:center;">
<p style="font-size:12px;color:#94a3b8;margin:0;">📍 Spot de l'Almanarre, Hyères · Kitesurf Passion depuis 1999</p>
</td></tr></table></body></html>`;

      const text = `Bonjour ${firstName},\n\nVotre acompte pour ${activityLabel} le ${fmtDate(sessionDate)} est bien reçu, mais tous les créneaux de la journée sont complets.\n\n` +
        `🔄 Reprendre ma réservation : ${resumeUrl}\n\n` +
        (alternatives.length
          ? `Créneaux alternatifs (liens directs) :\n${alternatives.map(a => `- ${fmtDate(a.date)} ${SLOT_LABEL[a.time_slot] || a.time_slot} (${a.capacity - a.taken} place(s)) : ${resumeParams({ date: a.date, slot: a.time_slot })}`).join("\n")}`
          : `Aucun créneau libre sous 14 jours — appelez-nous au 06 72 71 69 05.`) +
        `\n\nVotre acompte est conservé.`;

      await supabase.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          run_id: crypto.randomUUID(),
          message_id: msgId,
          to: customerEmail,
          from: "KiteSurf Passion <noreply@kitesurfpassion.fr>",
          sender_domain: "kitesurfpassion.fr",
          subject: `Session complète — alternatives pour votre ${activityLabel}`,
          html,
          text,
          purpose: "transactional",
          label: "stripe-stuck-alternatives",
          queued_at: new Date().toISOString(),
        },
      });
      await supabase.from("email_send_log").insert({
        message_id: msgId,
        template_name: "stripe-stuck-alternatives",
        recipient_email: customerEmail,
        status: "pending",
      });
    }
  } catch (e) {
    console.error("stripe-stuck customer email failed", { stripe_session_id: session.id, err: String((e as any)?.message || e) });
  }

  await supabase.rpc("enqueue_admin_notification", {
    p_kind: "stripe_webhook_error",
    p_severity: "warning",
    p_title: `Réservation Stripe bloquée — ${fullName || customerEmail} (${activityName || activityEnum})`,
    p_body:
      `👤 ${fullName || "?"} · ${customerEmail} · ${phone}\n` +
      `🪁 ${activityName || activityEnum} · ${participants} pers · ${amountEuros}€\n` +
      `📅 ${sessionDate} — tous les créneaux indisponibles\n` +
      `🔎 Créneaux testés : ${attemptsSummary || "—"}\n` +
      `⚠️  Dernière erreur : ${lastErr || "all slots closed"}\n` +
      `➡️  Action : rouvrir un créneau, contacter le client ou rembourser.\n` +
      `🔗 Stripe : ${session.id}`,
    p_metadata: {
      stripe_session_id: session.id,
      customer_name: fullName,
      phone,
      email: customerEmail,
      activity_name: activityName,
      activity: activityEnum,
      date: sessionDate,
      preferred_slot: "morning",
      participants,
      amount_eur: Number(amountEuros),
      last_error: lastErr,
      slot_attempts: slotAttempts,
    },
    p_ref_key: `stripe_stuck:${session.id}`,
  }).catch(() => { /* best-effort — notification signature may differ */ });

  return { ...base, status: "error", detail: `reservation insert failed: ${lastErr || "all slots closed"}` };
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