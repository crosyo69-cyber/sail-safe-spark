import { isServiceRoleRequest } from "../_shared/service-role-auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parisHour, parisYesterday, eur } from "./briefing-utils.ts";

const json = { "Content-Type": "application/json" };
const OWNER_EMAIL = "crosyo69@gmail.com";
const FROM_DOMAIN = "kitesurfpassion.fr";
const SEND_HOUR_PARIS = 9;
const MODEL = "openai/gpt-6-astra";

const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

async function stripeYesterday(startTs: number, endTs: number) {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return { ok: false as const, error: "clé Stripe absente" };
  const url = `https://api.stripe.com/v1/charges?limit=100&created[gte]=${startTs}&created[lt]=${endTs}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!r.ok) return { ok: false as const, error: `Stripe ${r.status}` };
  const body = await r.json();
  const paid = (body.data ?? []).filter((c: any) => c.paid && c.status === "succeeded" && c.currency === "eur");
  const gross = paid.reduce((a: number, c: any) => a + c.amount, 0);
  const refunded = paid.reduce((a: number, c: any) => a + (c.amount_refunded ?? 0), 0);
  return { ok: true as const, count: paid.length, gross, refunded, truncated: !!body.has_more };
}

async function writeWithAI(facts: unknown): Promise<string | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  const r = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, ...json },
    body: JSON.stringify({
      model: MODEL,
      reasoning: { effort: "low" },
      max_output_tokens: 1500,
      instructions: "Tu rédiges le briefing matinal du gérant d'une école de kitesurf à Hyères. Français, vouvoiement, 5 à 8 phrases courtes, factuel. Utilise uniquement les chiffres fournis, n'invente rien. Si une donnée est indisponible, dis-le. Termine par les 1 à 3 actions prioritaires du jour.",
      input: JSON.stringify(facts),
    }),
  });
  if (!r.ok) { console.error("AI gateway", r.status, await r.text()); return null; }
  const out = await r.json();
  const text = out.output_text ?? out.output?.flatMap((o: any) => o.content ?? []).map((c: any) => c.text ?? "").join("") ?? "";
  return text.trim() || null;
}

Deno.serve(async (req) => {
  if (!isServiceRoleRequest(req)) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: json });
  const body = await req.json().catch(() => ({}));
  const force = body?.force === true;
  const now = new Date();
  // Cron fires at 07:00 and 08:00 UTC; only the run matching 09:00 Paris sends (DST-safe).
  if (!force && parisHour(now) !== SEND_HOUR_PARIS) return new Response(JSON.stringify({ skipped: "hour" }), { headers: json });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const y = parisYesterday(now);
  const dedupe = `daily-briefing-${y.date}`;
  const { data: already } = await supabase.from("email_send_log").select("id").eq("message_id", dedupe).limit(1);
  if (already?.length && !force) return new Response(JSON.stringify({ skipped: "already_sent" }), { headers: json });

  const [stripe, resas, packs, notifs, actions, waitlist, today] = await Promise.all([
    stripeYesterday(y.startTs, y.endTs),
    supabase.from("reservations").select("participants,status,client_activity").gte("created_at", y.startIso).lt("created_at", y.endIso),
    supabase.from("client_packages").select("activity,package_type").gte("created_at", y.startIso).lt("created_at", y.endIso),
    supabase.from("admin_notifications").select("severity,title").is("read_at", null).order("created_at", { ascending: false }).limit(10),
    supabase.from("assistant_prepared_actions").select("title,priority").eq("status", "pending").limit(10),
    supabase.from("daily_waitlist").select("id", { count: "exact", head: true }).eq("status", "waiting"),
    supabase.from("daily_groups").select("activity,status").eq("date", y.today),
  ]);

  const r = resas.data ?? [];
  const facts = {
    jour: y.date,
    ventes_stripe: stripe.ok
      ? { paiements: stripe.count, encaisse: eur(stripe.gross), rembourse: eur(stripe.refunded), incomplet: stripe.truncated }
      : { indisponible: stripe.error },
    reservations: resas.error ? "indisponible" : {
      nouvelles: r.length,
      confirmees: r.filter((x: any) => x.status === "confirmed").length,
      annulees: r.filter((x: any) => x.status === "cancelled").length,
      participants: r.filter((x: any) => x.status !== "cancelled").reduce((a: number, x: any) => a + (x.participants || 1), 0),
    },
    packs_achetes: packs.error ? "indisponible" : (packs.data ?? []).length,
    taches_ouvertes: {
      alertes_non_lues: (notifs.data ?? []).map((n: any) => `${n.severity}: ${n.title}`),
      actions_a_valider: (actions.data ?? []).map((a: any) => a.title),
      liste_attente: waitlist.count ?? "indisponible",
    },
    groupes_aujourdhui: (today.data ?? []).length,
  };

  const aiText = await writeWithAI(facts);
  const summary = aiText ?? "Le résumé rédigé n'a pas pu être généré ce matin. Voici les chiffres bruts.";
  const factsHtml = `<pre style="white-space:pre-wrap;font-size:12px;color:#475569;background:#f8fafc;padding:12px;border-radius:8px;">${esc(JSON.stringify(facts, null, 2))}</pre>`;
  const html = `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#fff;font-family:Arial,sans-serif;">
<table width="100%" style="max-width:600px;margin:0 auto;"><tr><td style="background:#0F172A;padding:20px;color:#fff;font-size:18px;font-weight:bold;">Briefing du ${esc(y.label)}</td></tr>
<tr><td style="padding:20px;color:#0F172A;font-size:15px;line-height:1.6;">${esc(summary).replace(/\n/g, "<br>")}</td></tr>
<tr><td style="padding:0 20px 20px;">${factsHtml}</td></tr>
<tr><td style="padding:0 20px 24px;"><a href="https://www.kitesurfpassion.fr/admin" style="background:#F97316;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold;">Ouvrir l'administration</a></td></tr></table></body></html>`;

  await supabase.from("email_send_log").insert({ message_id: dedupe, template_name: "daily_briefing", recipient_email: OWNER_EMAIL, status: "pending" });
  const { error } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      run_id: crypto.randomUUID(), message_id: dedupe, to: OWNER_EMAIL,
      from: `KiteSurf Passion <noreply@${FROM_DOMAIN}>`, sender_domain: FROM_DOMAIN,
      subject: `☀️ Briefing du ${y.label}`, html, text: `${summary}\n\n${JSON.stringify(facts, null, 2)}`,
      purpose: "transactional", label: "daily_briefing", queued_at: new Date().toISOString(),
    },
  });
  if (error) {
    await supabase.from("email_send_log").insert({ message_id: dedupe, template_name: "daily_briefing", recipient_email: OWNER_EMAIL, status: "failed", error_message: "enqueue failed" });
    return new Response(JSON.stringify({ error: "enqueue failed" }), { status: 500, headers: json });
  }
  return new Response(JSON.stringify({ sent: true, ai: !!aiText, facts }), { headers: json });
});
