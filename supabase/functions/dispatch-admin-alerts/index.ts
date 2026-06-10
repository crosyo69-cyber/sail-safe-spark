import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_EMAIL = 'crosyo69@gmail.com'
const LOGO_URL = 'https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png'
const SPIKE_404_THRESHOLD = 30 // per hour

function isServiceRoleJwt(token: string): boolean {
  const parts = token.split('.')
  if (parts.length < 2) return false
  try {
    const padded = parts[1].replaceAll('-', '+').replaceAll('_', '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    const claims = JSON.parse(atob(padded)) as { role?: string; exp?: number }
    if (claims.role !== 'service_role') return false
    if (typeof claims.exp === 'number' && claims.exp * 1000 < Date.now()) return false
    return true
  } catch { return false }
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

function renderEmail(notifs: Array<{ kind: string; severity: string; title: string; body: string | null; created_at: string }>): { subject: string; html: string; text: string } {
  const sev = notifs.some((n) => n.severity === 'critical') ? 'critical'
            : notifs.some((n) => n.severity === 'warning') ? 'warning' : 'info'
  const icon = sev === 'critical' ? '🚨' : sev === 'warning' ? '⚠️' : 'ℹ️'
  const accent = sev === 'critical' ? '#dc2626' : '#F97316'
  const subject = `${icon} Kitesurf Passion — ${notifs.length} alerte${notifs.length > 1 ? 's' : ''}`

  const rows = notifs.map((n) => `
    <tr><td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
      <p style="margin:0 0 4px;color:#0F172A;font-weight:bold;font-size:14px;">${escapeHtml(n.title)}</p>
      <p style="margin:0 0 6px;color:#475569;font-size:13px;line-height:1.5;">${escapeHtml(n.body || '')}</p>
      <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">
        ${escapeHtml(n.kind)} · ${new Date(n.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
      </p>
    </td></tr>`).join('')

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
  <tr><td style="background:#0F172A;padding:24px;text-align:center;">
    <img src="${LOGO_URL}" alt="Kitesurf Passion" width="180"/></td></tr>
  <tr><td style="padding:24px 20px 8px;">
    <h1 style="margin:0 0 8px;color:${accent};font-size:20px;">${icon} ${notifs.length} alerte${notifs.length > 1 ? 's' : ''} back-office</h1>
    <p style="margin:0;color:#64748B;font-size:13px;">Récapitulatif des alertes récentes du tableau de bord administrateur.</p>
  </td></tr>
  <tr><td><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">${rows}</table></td></tr>
  <tr><td style="padding:20px;text-align:center;">
    <a href="https://www.kitesurfpassion.fr/admin?tab=alertes" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;">Ouvrir le centre d'alertes</a>
  </td></tr>
  <tr><td style="background:#0F172A;padding:14px;text-align:center;">
    <p style="margin:0;color:#94a3b8;font-size:11px;">Email automatique · Kitesurf Passion</p>
  </td></tr>
</table></body></html>`

  const text = notifs.map((n) => `[${n.severity.toUpperCase()}] ${n.title}\n${n.body || ''}`).join('\n\n')
  return { subject, html, text }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token || !isServiceRoleJwt(token)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // 1) Check 404 spike (last hour)
    const sinceISO = new Date(Date.now() - 3_600_000).toISOString()
    const { count: count404 } = await supabase
      .from('page_404_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sinceISO)
    if ((count404 ?? 0) >= SPIKE_404_THRESHOLD) {
      await supabase.rpc('enqueue_admin_notification', {
        p_kind: '404_spike',
        p_severity: 'warning',
        p_title: `Pic de 404 détecté (${count404} sur la dernière heure)`,
        p_body: `Plus de ${SPIKE_404_THRESHOLD} pages introuvables ont été visitées en 1 h. Vérifier les liens cassés et les redirections.`,
        p_metadata: { count: count404, since: sinceISO },
        p_ref_key: `404_spike:${new Date().toISOString().slice(0, 13)}`,
      })
    }

    // 2) Check DLQ messages (last hour)
    const { data: dlqRows } = await supabase
      .from('email_send_log')
      .select('id, template_name, recipient_email, error_message, created_at')
      .eq('status', 'dlq')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .limit(50)
    if (dlqRows && dlqRows.length > 0) {
      await supabase.rpc('enqueue_admin_notification', {
        p_kind: 'email_dlq',
        p_severity: dlqRows.length >= 5 ? 'critical' : 'warning',
        p_title: `${dlqRows.length} email(s) en DLQ`,
        p_body: `Échecs récents : ${dlqRows.slice(0, 5).map((r) => `${r.template_name} → ${r.recipient_email}`).join(' · ')}`,
        p_metadata: { count: dlqRows.length },
        p_ref_key: `email_dlq:${new Date().toISOString().slice(0, 13)}`,
      })
    }

    // 3) Dispatch email digest for unsent warning/critical notifications
    const { data: pending, error: pendingErr } = await supabase
      .from('admin_notifications')
      .select('id, kind, severity, title, body, created_at')
      .is('email_sent_at', null)
      .in('severity', ['warning', 'critical'])
      .order('created_at', { ascending: false })
      .limit(30)
    if (pendingErr) throw pendingErr

    let emailQueued = false
    if (pending && pending.length > 0) {
      const { subject, html, text } = renderEmail(pending)
      const messageId = crypto.randomUUID()
      const runId = crypto.randomUUID()
      const { error: enqErr } = await supabase.rpc('enqueue_email', {
        queue_name: 'transactional_emails',
        payload: {
          run_id: runId,
          message_id: messageId,
          to: ADMIN_EMAIL,
          from: 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
          sender_domain: 'kitesurfpassion.fr',
          subject, html, text,
          purpose: 'transactional',
          label: 'admin-alert-digest',
          queued_at: new Date().toISOString(),
        },
      })
      if (enqErr) throw enqErr
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'admin-alert-digest',
        recipient_email: ADMIN_EMAIL,
        status: 'pending',
        metadata: { notification_count: pending.length },
      })
      const ids = pending.map((p) => p.id)
      await supabase.from('admin_notifications')
        .update({ email_sent_at: new Date().toISOString() })
        .in('id', ids)
      emailQueued = true
    }

    return new Response(
      JSON.stringify({ ok: true, pending_count: pending?.length ?? 0, email_queued: emailQueued, count_404: count404 ?? 0, dlq_count: dlqRows?.length ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[dispatch-admin-alerts] error', err)
    return new Response(
      JSON.stringify({ ok: false, error: String((err as Error)?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})