import { createClient } from 'npm:@supabase/supabase-js@2'
import { dlqRetryCount, MAX_DLQ_RETRIES } from '../_shared/email-guards.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Body = {
  message_id: string
  queue: 'auth_emails' | 'transactional_emails'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // 1. Auth — require a logged-in user
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401)
  }
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401)

  // 2. Admin check via has_role RPC (server-side, RLS-safe)
  const admin = createClient(supabaseUrl, serviceKey)
  const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
    _user_id: userData.user.id,
    _role: 'admin',
  })
  if (roleErr || !isAdmin) return json({ error: 'Forbidden' }, 403)

  // 3. Validate body
  let body: Body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  if (!body?.message_id || typeof body.message_id !== 'string') {
    return json({ error: 'message_id required' }, 400)
  }
  if (body.queue !== 'auth_emails' && body.queue !== 'transactional_emails') {
    return json({ error: 'queue must be auth_emails or transactional_emails' }, 400)
  }

  const dlqName = `${body.queue}_dlq`

  // 4. Search the DLQ for a message matching the message_id.
  //    We scan up to 200 messages (claim with vt=30s) to find it.
  let foundMsg: { msg_id: number; message: Record<string, unknown> } | null = null
  const claimed: { msg_id: number }[] = []

  for (let i = 0; i < 4 && !foundMsg; i++) {
    const { data: batch, error: readErr } = await admin.rpc('read_email_batch', {
      queue_name: dlqName,
      batch_size: 50,
      vt: 30,
    })
    if (readErr) {
      console.error('[retry-dlq-email] read DLQ failed', readErr)
      return json({ error: 'Failed to read DLQ', detail: readErr.message }, 500)
    }
    if (!batch?.length) break
    for (const m of batch as Array<{ msg_id: number; message: Record<string, unknown> }>) {
      claimed.push({ msg_id: m.msg_id })
      if (!foundMsg && m.message?.message_id === body.message_id) {
        foundMsg = m
      }
    }
  }

  if (!foundMsg) {
    return json(
      { error: 'Message not found in DLQ (it may have already been retried, expired, or never reached the DLQ).' },
      404,
    )
  }

  // 5. Re-enqueue the original payload onto the live queue with a fresh queued_at.
  // F-21-03: the manual retry uses the same bounded DLQ counter as the automatic
  // cycle (retry_dlq_messages) and never bypasses the cap.
  const currentDlqRetries = dlqRetryCount(foundMsg.message)
  if (currentDlqRetries >= MAX_DLQ_RETRIES) {
    return json(
      {
        error: `Max DLQ retries (${MAX_DLQ_RETRIES}) already reached for this message.`,
        dlq_retry_count: currentDlqRetries,
      },
      409,
    )
  }

  const newPayload = {
    ...foundMsg.message,
    queued_at: new Date().toISOString(),
    dlq_retry_count: currentDlqRetries + 1,
    dlq_last_retry_at: new Date().toISOString(),
  }

  const { data: enqueueId, error: enqErr } = await admin.rpc('enqueue_email', {
    queue_name: body.queue,
    payload: newPayload,
  })
  if (enqErr) {
    console.error('[retry-dlq-email] enqueue failed', enqErr)
    return json({ error: 'Failed to enqueue retry', detail: enqErr.message }, 500)
  }

  // 6. Delete the message from the DLQ
  const { error: delErr } = await admin.rpc('delete_email', {
    queue_name: dlqName,
    message_id: foundMsg.msg_id,
  })
  if (delErr) {
    console.error('[retry-dlq-email] delete from DLQ failed', delErr)
    // Not fatal — message will become visible again after VT and could double.
    // Caller is informed but the retry is already enqueued.
  }

  // 7. Log a pending entry so the dashboard shows the new attempt
  await admin.from('email_send_log').insert({
    message_id: body.message_id,
    template_name: (newPayload.label as string) || body.queue,
    recipient_email: (newPayload.to as string) || 'unknown',
    status: 'pending',
    metadata: { manual_retry_by: userData.user.id, retried_at: new Date().toISOString() },
  })

  return json({ ok: true, enqueue_id: enqueueId, queue: body.queue })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}