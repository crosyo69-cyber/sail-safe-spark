import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.kitesurfpassion.fr";
const FROM_DOMAIN = "kitesurfpassion.fr";
const SITE_NAME = "Kitesurf Passion";

import { ACTIVITY_LABELS, buildHtml, buildText } from "./template.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // ---- AuthZ : admin connecté OU appel service-role (cron interne) ----
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let isAuthorized = token === serviceKey;
    if (!isAuthorized) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await userClient.rpc("has_role", {
        _user_id: userData.user.id, _role: "admin",
      });
      isAuthorized = Boolean(isAdmin);
    }
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({} as any));
    const groupId: string | undefined = body.groupId ?? body.dailyGroupId;
    if (!groupId) {
      return new Response(JSON.stringify({ error: "groupId required" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: group, error: gErr } = await supabase
      .from("daily_groups")
      .select("id,date,activity,notes")
      .eq("id", groupId)
      .single();
    if (gErr || !group) return new Response(JSON.stringify({ error: "Group not found" }), { status: 404, headers: corsHeaders });
    const source: { date: string; activity: string; note: string | null } = {
      date: group.date,
      activity: group.activity as string,
      note: group.notes,
    };

    // map activity to subscriber activity keys
    const targetKey =
      source.activity === "pumpfoil" ? "kitefoil" :
      source.activity === "wingfoil" ? "wingfoil" : "kitesurf";

    const { data: subs } = await supabase
      .from("last_minute_subscribers")
      .select("id,email,activities")
      .eq("confirmed", true)
      .contains("activities", [targetKey]);

    let sent = 0;
    for (const sub of subs || []) {
      const messageId = crypto.randomUUID();
      const runId = crypto.randomUUID();
      const bookUrl = `${SITE}/dernieres-minutes`;
      // D-4-FIX-2 : token émis en mémoire (hash seul persisté), jamais relu en base.
      const { data: unsubToken } = await supabase.rpc("issue_link_token", {
        p_purpose: "last_minute_unsubscribe",
        p_subject_id: sub.id,
        p_expires_at: null,
      });
      const unsubscribeUrl = unsubToken
        ? `${SITE}/alerte-derniere-minute?unsubscribe=${unsubToken}`
        : `${SITE}/alerte-derniere-minute`;
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: "last_minute_alert",
        recipient_email: sub.email,
        status: "pending",
      });
      const { error: enqErr } = await supabase.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          run_id: runId,
          message_id: messageId,
          to: sub.email,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: FROM_DOMAIN,
          subject: `🔥 Nouvelle journée ${ACTIVITY_LABELS[source.activity] || source.activity} dispo !`,
          html: buildHtml({
            activity: source.activity,
            date: source.date,
            note: source.note,
            bookUrl,
            unsubscribeUrl,
          }),
          text: buildText({ activity: source.activity, date: source.date, note: source.note, bookUrl }),
          purpose: "transactional",
          label: "last_minute_alert",
          queued_at: new Date().toISOString(),
        },
      });
      if (!enqErr) sent++;
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500, headers: corsHeaders });
  }
});