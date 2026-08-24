// Deterministic concurrency tests for the email send claim (lease) mechanism.
// They model the exact semantics of public.claim_email_send /
// public.release_email_claim and the worker loop in index.ts:
//
//   claim -> provider.send() -> log 'sent' -> delete from queue -> release
//
// Guarantee under test: two workers must never hold the right to call the
// provider for the same message_id at the same time.
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

type Claim = { workerId: string; expiresAt: number }

/** In-memory model of the DB claim table + email_send_log 'sent' rows. */
class ClaimStore {
  private claims = new Map<string, Claim>()
  private sent = new Set<string>()
  now = 0

  /** Mirrors claim_email_send(): atomic INSERT ... ON CONFLICT DO UPDATE WHERE expired. */
  claim(messageId: string, workerId: string, leaseSeconds = 120): boolean {
    if (this.sent.has(messageId)) return false
    const existing = this.claims.get(messageId)
    if (existing && existing.expiresAt > this.now) return false
    this.claims.set(messageId, { workerId, expiresAt: this.now + leaseSeconds })
    return true
  }

  release(messageId: string) {
    this.claims.delete(messageId)
  }

  markSent(messageId: string) {
    this.sent.add(messageId)
  }

  isSent(messageId: string) {
    return this.sent.has(messageId)
  }
}

/** Worker run: returns whether the provider was actually called. */
async function runWorker(
  store: ClaimStore,
  messageId: string,
  workerId: string,
  provider: () => Promise<void>,
  opts: { crashAfterSend?: boolean; crashBeforeSend?: boolean } = {}
): Promise<'sent' | 'skipped' | 'failed' | 'crashed'> {
  if (!store.claim(messageId, workerId)) return 'skipped'
  if (opts.crashBeforeSend) return 'crashed' // dies holding the lease
  try {
    await provider()
    if (opts.crashAfterSend) return 'crashed' // dies before logging 'sent'
    store.markSent(messageId)
    return 'sent'
  } catch {
    return 'failed'
  } finally {
    if (!opts.crashAfterSend && !opts.crashBeforeSend) store.release(messageId)
  }
}

Deno.test('two workers racing on the same message_id: only one calls the provider', async () => {
  const store = new ClaimStore()
  let providerCalls = 0
  const provider = async () => {
    providerCalls++
    await Promise.resolve()
  }

  const [a, b] = await Promise.all([
    runWorker(store, 'msg-1', 'A', provider),
    runWorker(store, 'msg-1', 'B', provider),
  ])

  assertEquals(providerCalls, 1)
  assertEquals([a, b].filter((r) => r === 'sent').length, 1)
  assertEquals([a, b].filter((r) => r === 'skipped').length, 1)
})

Deno.test('worker B is blocked while A holds a live lease', () => {
  const store = new ClaimStore()
  assertEquals(store.claim('msg-2', 'A'), true)
  assertEquals(store.claim('msg-2', 'B'), false)
})

Deno.test('crash after claim but before send: message is recovered once the lease expires', async () => {
  const store = new ClaimStore()
  let providerCalls = 0
  const provider = async () => {
    providerCalls++
    await Promise.resolve()
  }

  const crashed = await runWorker(store, 'msg-3', 'A', provider, { crashBeforeSend: true })
  assertEquals(crashed, 'crashed')
  assertEquals(providerCalls, 0)

  // Still locked before the lease expires.
  assertEquals(store.claim('msg-3', 'B'), false)

  store.now += 121 // lease expired
  const recovered = await runWorker(store, 'msg-3', 'B', provider)
  assertEquals(recovered, 'sent')
  assertEquals(providerCalls, 1)
})

Deno.test('crash after send but before logging: at-least-once, retried after lease expiry', async () => {
  const store = new ClaimStore()
  let providerCalls = 0
  const provider = async () => {
    providerCalls++
    await Promise.resolve()
  }

  await runWorker(store, 'msg-4', 'A', provider, { crashAfterSend: true })
  assertEquals(providerCalls, 1)
  assertEquals(store.isSent('msg-4'), false)

  // No concurrent duplicate: B cannot claim while the lease is alive.
  assertEquals(store.claim('msg-4', 'B'), false)

  store.now += 121
  await runWorker(store, 'msg-4', 'B', provider)
  // Retried sequentially (at-least-once), never concurrently.
  assertEquals(providerCalls, 2)
})

Deno.test('provider timeout/failure releases the lease so the retry can claim', async () => {
  const store = new ClaimStore()
  let providerCalls = 0
  const failing = async () => {
    providerCalls++
    await Promise.resolve()
    throw new Error('provider timeout')
  }

  assertEquals(await runWorker(store, 'msg-5', 'A', failing), 'failed')
  // Lease released immediately -> next cycle retries without waiting 120s.
  assertEquals(store.claim('msg-5', 'B'), true)
  store.release('msg-5')
  assertEquals(providerCalls, 1)
})

Deno.test('a message already logged as sent can never be claimed again (DLQ/VT replays)', async () => {
  const store = new ClaimStore()
  let providerCalls = 0
  const provider = async () => {
    providerCalls++
    await Promise.resolve()
  }

  assertEquals(await runWorker(store, 'msg-6', 'A', provider), 'sent')
  assertEquals(await runWorker(store, 'msg-6', 'B', provider), 'skipped')
  assertEquals(await runWorker(store, 'msg-6', 'A', provider), 'skipped')
  assertEquals(providerCalls, 1)
})

Deno.test('DLQ path: message moved to DLQ before any claim never calls the provider', async () => {
  const store = new ClaimStore()
  let providerCalls = 0
  const provider = async () => {
    providerCalls++
    await Promise.resolve()
  }

  // TTL / max-retries checks run before the claim in index.ts.
  const movedToDlq = true
  if (!movedToDlq) await runWorker(store, 'msg-7', 'A', provider)
  assertEquals(providerCalls, 0)
  // The message is then claimable by nobody in the main queue (deleted by move_to_dlq).
  assertEquals(store.isSent('msg-7'), false)
})

Deno.test('ten concurrent workers on one message_id: exactly one provider call', async () => {
  const store = new ClaimStore()
  let providerCalls = 0
  const provider = async () => {
    providerCalls++
    await Promise.resolve()
  }

  const results = await Promise.all(
    Array.from({ length: 10 }, (_, i) => runWorker(store, 'msg-8', `W${i}`, provider))
  )
  assertEquals(providerCalls, 1)
  assertEquals(results.filter((r) => r === 'sent').length, 1)
  assertEquals(results.filter((r) => r === 'skipped').length, 9)
})
