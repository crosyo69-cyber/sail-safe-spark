import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  claimWebhookEvent,
  createWebhookHandler,
  deterministicMessageId,
  isUniqueViolation,
  type WebhookDeps,
} from "./index.ts";

/** In-memory Supabase double reproducing the SQL uniqueness guarantees. */
function makeFakeSupabase() {
  const events = new Map<string, { status: string }>();
  const packages: Array<Record<string, unknown>> = [];
  const emailLog: Array<Record<string, unknown>> = [];
  const queued: Array<Record<string, unknown>> = [];
  const bookings: Array<Record<string, unknown>> = [];

  const uniqueError = { code: "23505", message: "duplicate key value violates unique constraint" };

  const table = (name: string) => {
    const rows =
      name === "client_packages" ? packages : name === "email_send_log" ? emailLog : bookings;
    const filters: Array<[string, unknown]> = [];
    const api: any = {
      insert(values: Record<string, unknown>) {
        // Emulate uq_client_packages_stripe_session_id
        if (
          name === "client_packages" &&
          values.stripe_session_id &&
          packages.some((p) => p.stripe_session_id === values.stripe_session_id)
        ) {
          return {
            select: () => ({
              single: () => Promise.resolve({ data: null, error: uniqueError }),
            }),
            then: (r: any) => r({ error: uniqueError }),
          };
        }
        // Emulate uq_email_send_log_pending_message_id
        if (
          name === "email_send_log" &&
          values.status === "pending" &&
          emailLog.some((e) => e.message_id === values.message_id && e.status === "pending")
        ) {
          return Promise.resolve({ error: uniqueError });
        }
        rows.push(values);
        const result = { data: values, error: null };
        return {
          select: () => ({ single: () => Promise.resolve(result) }),
          then: (r: any) => r({ error: null }),
        };
      },
      select() {
        return api;
      },
      eq(col: string, val: unknown) {
        filters.push([col, val]);
        return api;
      },
      maybeSingle() {
        const found = rows.find((r) => filters.every(([c, v]) => r[c] === v));
        return Promise.resolve({ data: found ?? null, error: null });
      },
      single() {
        const found = rows.find((r) => filters.every(([c, v]) => r[c] === v));
        return Promise.resolve({ data: found ?? null, error: found ? null : { message: "none" } });
      },
    };
    return api;
  };

  const supabase = {
    from: table,
    rpc(fn: string, args: Record<string, unknown>) {
      if (fn === "claim_stripe_webhook_event") {
        const id = String(args.p_event_id);
        if (events.has(id)) return Promise.resolve({ data: false, error: null });
        events.set(id, { status: "received" });
        return Promise.resolve({ data: true, error: null });
      }
      if (fn === "mark_stripe_webhook_event") {
        const e = events.get(String(args.p_event_id));
        if (e) e.status = String(args.p_status);
        return Promise.resolve({ data: null, error: null });
      }
      if (fn === "enqueue_email") {
        queued.push(args.payload as Record<string, unknown>);
        return Promise.resolve({ data: 1, error: null });
      }
      if (fn === "book_daily_visitor") {
        bookings.push(args);
        return Promise.resolve({ data: { ok: true }, error: null });
      }
      if (fn === "find_or_create_daily_group") {
        return Promise.resolve({ data: "group-1", error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
  };

  return { supabase, events, packages, emailLog, queued, bookings };
}

const EVENT_ID = "evt_test_12345";

function makeEvent(sessionId = "cs_test_1") {
  return {
    id: EVENT_ID,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        customer_details: { email: "client@example.com", name: "Jean Test" },
        metadata: {
          activity_name: "Cours à la Carte",
          participants: "1",
          preferred_date: "2026-07-01",
          customer_name: "Jean Test",
          phone: "0612345678",
          total_sessions: "1",
        },
      },
    },
  } as any;
}

function makeDeps(fake: ReturnType<typeof makeFakeSupabase>, event = makeEvent()): () => WebhookDeps {
  return () => ({
    stripe: { webhooks: { constructEventAsync: () => Promise.resolve(event) } },
    supabase: fake.supabase,
    webhookSecret: "whsec_test",
  });
}

function makeRequest() {
  return new Request("https://example.com/stripe-webhook", {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=fake" },
    body: "{}",
  });
}

Deno.test("webhook: missing signature is rejected before any processing", async () => {
  const fake = makeFakeSupabase();
  const handler = createWebhookHandler(makeDeps(fake));
  const res = await handler(new Request("https://example.com/stripe-webhook", { method: "POST", body: "{}" }));
  await res.text();
  assertEquals(res.status, 400);
  assertEquals(fake.events.size, 0);
});

Deno.test("webhook: the same event processed twice runs the business logic only once", async () => {
  const fake = makeFakeSupabase();
  const handler = createWebhookHandler(makeDeps(fake));

  const first = await handler(makeRequest());
  const firstJson = await first.json();
  const second = await handler(makeRequest());
  const secondJson = await second.json();

  assertEquals(first.status, 200);
  assertEquals(second.status, 200);
  assertEquals(firstJson.duplicate, undefined);
  assertEquals(secondJson.duplicate, true);

  // credits: one package only
  assertEquals(fake.packages.length, 1);
  // emails: one customer + one owner, no duplicates
  assertEquals(fake.queued.length, 2);
  assertEquals(fake.emailLog.filter((e) => e.status === "pending").length, 2);
  // reservation booked once
  assertEquals(fake.bookings.length, 1);
  assertEquals(fake.events.get(EVENT_ID)?.status, "processed");
});

Deno.test("webhook: concurrent deliveries — only the claiming call processes", async () => {
  const fake = makeFakeSupabase();
  const handler = createWebhookHandler(makeDeps(fake));
  const [a, b] = await Promise.all([handler(makeRequest()), handler(makeRequest())]);
  const [ja, jb] = [await a.json(), await b.json()];
  const duplicates = [ja.duplicate, jb.duplicate].filter(Boolean);
  assertEquals(duplicates.length, 1);
  assertEquals(fake.packages.length, 1);
  assertEquals(fake.queued.length, 2);
});

Deno.test("webhook: deterministic message_id for the same event/template/recipient", async () => {
  const a = await deterministicMessageId(EVENT_ID, "booking_confirmation", "Client@Example.com");
  const b = await deterministicMessageId(EVENT_ID, "booking_confirmation", "client@example.com");
  const c = await deterministicMessageId("evt_other", "booking_confirmation", "client@example.com");
  const d = await deterministicMessageId(EVENT_ID, "booking_owner_notification", "client@example.com");
  assertEquals(a, b);
  assert(a !== c);
  assert(a !== d);
  assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(a));
});

Deno.test("webhook: claim fails closed when the dedup RPC errors", async () => {
  const supabase = { rpc: () => Promise.resolve({ data: null, error: { message: "boom" } }) } as any;
  let threw = false;
  try {
    await claimWebhookEvent(supabase, EVENT_ID, "checkout.session.completed");
  } catch {
    threw = true;
  }
  assert(threw, "claim must throw so Stripe retries instead of double-processing");
});

Deno.test("isUniqueViolation detects Postgres 23505", () => {
  assert(isUniqueViolation({ code: "23505", message: "x" }));
  assert(isUniqueViolation({ message: "duplicate key value violates unique constraint" }));
  assertEquals(isUniqueViolation({ code: "42501", message: "permission denied" }), false);
});
