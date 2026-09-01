import { createClient } from 'npm:@supabase/supabase-js@2'

const ADMIN_EMAIL = 'crosyo69@gmail.com'
const ALERT_FROM = 'Kitesurf Passion <notify@kitesurfpassion.fr>'

// Thresholds
const MAX_QUEUE_DEPTH = 20            // pending messages in a live queue
const MAX_PENDING_AGE_MIN = 15        // oldest unresolved pending > 15 min = stuck
const PENDING_WINDOW_HOURS = 168      // fenêtre d'analyse des pending orphelins (7 jours)
const NEW_DLQ_THRESHOLD = 1           // any new DLQ message in the last hour triggers alert
const LIVE_QUEUES = ['auth_emails', 'transactional_emails']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendAlertEmail(subject: string, html: string): Promise<void> {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    console.error('[health-check] RESEND_API_KEY missing — cannot send alert')
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({ from: ALERT_FROM, to: [ADMIN_EMAIL], subject, html }),
  })
  const body = await res.text()
  if (!res.ok) console.error(`[health-check] Alert send failed ${res.status}: ${body}`)
}


// Vérifie qu'un JWT bearer porte le rôle service_role (cron/admin scripts).
// Compare claim.role plutôt que la valeur brute du SUPABASE_SERVICE_ROLE_KEY
// car la clé fournie par le vault/cron peut être un JWT distinct signé par
// le même provider Supabase.
function isServiceRoleJwt(token: string): boolean {
  const parts = token.split(".");
  if (parts.length < 2) return false;
  try {
    const padded = parts[1].replaceAll("-", "+").replaceAll("_", "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const claims = JSON.parse(atob(padded)) as { role?: string; exp?: number };
    if (claims.role !== "service_role") return false;
    if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Restrict to service-role callers (cron / admin scripts).
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!token || !isServiceRoleJwt(token)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const issues: string[] = []
  const report: Record<string, unknown> = {}

  try {
    // 1. Check pgmq queue depths via security-definer RPC
    const { data: queueRows, error: qErr } = await supabase.rpc('get_email_queue_status')
    if (qErr) issues.push(`Lecture file email impossible: ${qErr.message}`)
    report.queues = queueRows || []

    const liveQueueRows = (queueRows || []) as Array<{
      queue_name: string
      queue_length: number
      oldest_msg_age_sec: number | null
    }>

    let liveQueueDepth = 0
    for (const q of liveQueueRows) {
      if (LIVE_QUEUES.includes(q.queue_name)) {
        liveQueueDepth += q.queue_length ?? 0
        if ((q.queue_length ?? 0) > MAX_QUEUE_DEPTH) {
          issues.push(`File "${q.queue_name}" engorgée: ${q.queue_length} messages en attente.`)
        }
        if (q.oldest_msg_age_sec && q.oldest_msg_age_sec > MAX_PENDING_AGE_MIN * 60) {
          issues.push(
            `File "${q.queue_name}" bloquée: message le plus ancien ${Math.round(q.oldest_msg_age_sec / 60)} min.`,
          )
        }
      }
    }

    // 2. Check stuck "pending" rows in email_send_log.
    // email_send_log est un journal append-only : une ligne "pending" est normale
    // dès lors qu'une ligne terminale (sent/failed/...) portant le MÊME message_id
    // existe. Seuls les pending réellement ORPHELINS sur une fenêtre récente
    // constituent un incident — le stock historique ne doit pas alerter.
    const cutoff = new Date(Date.now() - MAX_PENDING_AGE_MIN * 60_000).toISOString()
    const windowStart = new Date(Date.now() - PENDING_WINDOW_HOURS * 3600_000).toISOString()
    const { data: stuckRows, error: stuckErr } = await supabase
      .from('email_send_log')
      .select('message_id, template_name, recipient_email, created_at')
      .eq('status', 'pending')
      .lt('created_at', cutoff)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: true })
      .limit(500)

    if (stuckErr) {
      issues.push(`Lecture email_send_log impossible: ${stuckErr.message}`)
    } else if (stuckRows && stuckRows.length > 0) {
      // Filter: keep only message_ids that have NO subsequent terminal status
      const ids = stuckRows.map((r) => r.message_id).filter(Boolean)
      const { data: terminal } = await supabase
        .from('email_send_log')
        .select('message_id')
        .in('message_id', ids as string[])
        .in('status', ['sent', 'dlq', 'failed', 'suppressed', 'bounced'])
      const resolvedSet = new Set((terminal || []).map((r: any) => r.message_id))
      const trulyStuck = stuckRows.filter((r) => r.message_id && !resolvedSet.has(r.message_id))
      report.pendingWindowHours = PENDING_WINDOW_HOURS
      report.pendingRowsInWindow = stuckRows.length
      report.stuckPending = trulyStuck
      if (trulyStuck.length > 0) {
        issues.push(`${trulyStuck.length} email(s) réellement orphelin(s) en "pending" depuis +${MAX_PENDING_AGE_MIN} min.`)
      }
    }

    // 3. Check recent DLQ activity (last hour)
    const dlqCutoff = new Date(Date.now() - 3600_000).toISOString()
    const { data: dlqRows, error: dlqErr } = await supabase
      .from('email_send_log')
      .select('id, template_name, recipient_email, error_message, created_at')
      .eq('status', 'dlq')
      .gte('created_at', dlqCutoff)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!dlqErr && dlqRows && dlqRows.length >= NEW_DLQ_THRESHOLD) {
      report.recentDlq = dlqRows
      issues.push(`${dlqRows.length} email(s) tombé(s) en DLQ dans la dernière heure.`)
    }

    // 4. Verify cron job exists & active only while there are live messages to process.
    // Lovable Emails schedules the processor on demand; when queues are empty,
    // the cron job may be absent and that is a healthy idle state.
    if (liveQueueDepth > 0) {
      const { data: cronRows } = await supabase
        .from('cron_job_status')
        .select('*')
      if (cronRows) {
        const job = (cronRows as any[]).find((c) => c.jobname === 'process-email-queue')
        report.cronJob = job
        if (!job) issues.push('Cron "process-email-queue" introuvable alors que des emails sont en attente.')
        else if (!job.active) issues.push('Cron "process-email-queue" désactivé alors que des emails sont en attente.')
      }
    } else {
      report.cronJob = 'idle_not_required'
    }

    // 5. Send alert if any issue
    if (issues.length > 0) {
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
          <h2 style="color:#dc2626;">⚠️ Alerte file email — Kitesurf Passion</h2>
          <p>Le contrôle automatique a détecté des problèmes :</p>
          <ul>${issues.map((i) => `<li>${i}</li>`).join('')}</ul>
          <h3>Détails</h3>
          <pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:11px;overflow:auto;">${
            JSON.stringify(report, null, 2).replace(/</g, '&lt;')
          }</pre>
          <p style="color:#666;font-size:12px;">Vérifie la file email dans l'admin (onglet Emails) ou les logs de process-email-queue.</p>
        </div>`
      await sendAlertEmail(`[KSP] File email: ${issues.length} problème(s) détecté(s)`, html)
    }

    return new Response(
      JSON.stringify({ ok: true, issues, report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[health-check] fatal', err)
    // Try to alert about the health-check itself failing
    await sendAlertEmail(
      '[KSP] ⚠️ Health-check file email en erreur',
      `<p>Le contrôle automatique a échoué :</p><pre>${String(err?.stack || err)}</pre>`,
    )
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})