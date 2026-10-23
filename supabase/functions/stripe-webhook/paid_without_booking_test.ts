// Tests de la correction critique : paiement Stripe encaissé sans réservation.
// Aucun appel réel : Stripe, Supabase, e-mails et notifications sont simulés.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createWebhookHandler, type WebhookDeps } from "./index.ts";

type FakeOptions = {
  bookResult?: { ok: boolean; reservation_id?: string; error?: string };
  bookNetworkError?: boolean;
  incidentFails?: boolean;
};

function makeFake(opts: FakeOptions = {}) {
  const events = new Map<string, { status: string }>();
  const packages: Array<Record<string, unknown>> = [];
  const emailLog: Array<Record<string, unknown>> = [];
  const queued: Array<Record<string, unknown>> = [];
  const reservations: Array<Record<string, unknown>> = [];
  const notifications: Array<Record<string, unknown>> = [];
  const uniqueError = { code: "23505", message: "duplicate key value violates unique constraint" };

  const table = (name: string) => {
    const rows =
      name === "client_packages"
        ? packages
        : name === "email_send_log"
          ? emailLog
          : name === "reservations"
            ? reservations
            : [];
    const filters: Array<[string, unknown]> = [];
    const api: any = {
      upsert() { return Promise.resolve({ data: null, error: null }); },
      insert(values: Record<string, unknown>) {
        if (
          name === "client_packages" &&
          values.stripe_session_id &&
          packages.some((p) => p.stripe_session_id === values.stripe_session_id)
        ) {
          return Promise.resolve({ error: uniqueError });
        }
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
          then: (r: any) => r(result),
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
      if (fn === "enqueue_admin_notification") {
        if (opts.incidentFails) return Promise.resolve({ data: null, error: { message: "db down" } });
        if (notifications.some((n) => n.ref_key === args.p_ref_key)) {
          return Promise.resolve({ data: null, error: null }); // idempotent
        }
        notifications.push(args);
        return Promise.resolve({ data: 1, error: null });
      }
      if (fn === "book_daily_visitor") {
        if (opts.bookNetworkError) {
          return Promise.resolve({ data: null, error: { message: "connection reset" } });
        }
        const r = opts.bookResult ?? { ok: true, reservation_id: "res-1" };
        if (r.ok && r.reservation_id) {
          reservations.push({ id: r.reservation_id, stripe_session_id: args.p_stripe_session_id });
        }
        return Promise.resolve({ data: r, error: null });
      }
      if (fn === "book_stage_for_participants") {
        return Promise.resolve({
          data: { ok: false, error: "day_group_limit_reached", detail: "jour 5 saturé" },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    },
  };

  return { supabase, events, packages, emailLog, queued, reservations, notifications };
}

const SESSION_ID = "cs_test_paid_1";

function makeEvent(eventId: string, sessionId = SESSION_ID, activity = "Cours à la Carte") {
  return {
    id: eventId,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        amount_total: 5000,
        currency: "eur",
        payment_status: "paid",
        customer_details: { email: "client@example.com", name: "Jean Test" },
        metadata: {
          activity_name: activity,
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

function makeDeps(fake: ReturnType<typeof makeFake>, event: unknown): () => WebhookDeps {
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

const labels = (fake: ReturnType<typeof makeFake>) => fake.queued.map((q) => q.label);

Deno.test("1. refus après paiement : aucun forfait, aucune confirmation, incident enregistré", async () => {
  const fake = makeFake({ bookResult: { ok: false, error: "day_group_limit_reached" } });
  const res = await createWebhookHandler(makeDeps(fake, makeEvent("evt_refused")))(makeRequest());
  await res.text();

  assertEquals(res.status, 200);
  assertEquals(fake.packages.length, 0, "aucun forfait actif indu");
  assertEquals(fake.reservations.length, 0);
  assert(!labels(fake).includes("booking_confirmation"), "aucune confirmation client");
  assert(!labels(fake).includes("booking_owner_notification"));
  assert(labels(fake).includes("booking_payment_problem"), "e-mail honnête au client");
  assertEquals(fake.notifications.length, 1, "incident durable enregistré");
  const incident = fake.notifications[0] as any;
  assertEquals(incident.p_kind, "paid_booking_failed");
  assertEquals(incident.p_ref_key, `paid_booking_failed:${SESSION_ID}`);
  assertEquals(incident.p_metadata.amount_cents, 5000);
  assertEquals(incident.p_metadata.currency, "eur");
  assertEquals(incident.p_metadata.customer_email, "client@example.com");
  assertEquals(incident.p_metadata.phone, "0612345678");
  assertEquals(incident.p_metadata.participants, 1);
  assertEquals(fake.events.get("evt_refused")?.status, "failed");
});

Deno.test("2. échec de l'enregistrement de l'incident : 500, événement non clos, reprise possible", async () => {
  const fake = makeFake({ bookResult: { ok: false, error: "day_group_limit_reached" }, incidentFails: true });
  const res = await createWebhookHandler(makeDeps(fake, makeEvent("evt_incident_fail")))(makeRequest());
  await res.text();

  assertEquals(res.status, 500);
  assertEquals(fake.packages.length, 0);
  assertEquals(fake.notifications.length, 0);
  assert(fake.events.get("evt_incident_fail")?.status !== "processed", "événement non marqué processed");
});

Deno.test("3. interruption après réclamation (erreur réseau) : reprise sûre sans doublon", async () => {
  // 1re livraison : panne réseau pendant la réservation → indéterminé, 500.
  const fake = makeFake({ bookNetworkError: true });
  const first = await createWebhookHandler(makeDeps(fake, makeEvent("evt_crash")))(makeRequest());
  await first.text();
  assertEquals(first.status, 500);
  assertEquals(fake.packages.length, 0);
  assert(!labels(fake).includes("booking_confirmation"));
  assertEquals(fake.notifications.length, 1, "incident indéterminé conservé");
  assert(fake.events.get("evt_crash")?.status !== "processed");

  // Stripe retente le MÊME événement → réclamation déjà faite, rejeu ignoré.
  const fakeRetry = makeFake();
  fakeRetry.events.set("evt_crash", { status: "received" });
  const dup = await createWebhookHandler(makeDeps(fakeRetry, makeEvent("evt_crash")))(makeRequest());
  const dupJson = await dup.json();
  assertEquals(dupJson.duplicate, true);
});

Deno.test("4. résultat indéterminé : aucune confirmation prématurée", async () => {
  const fake = makeFake({ bookNetworkError: true });
  const res = await createWebhookHandler(makeDeps(fake, makeEvent("evt_unknown")))(makeRequest());
  await res.text();
  assertEquals(res.status, 500);
  assert(!labels(fake).includes("booking_confirmation"), "aucune confirmation");
  assert(!labels(fake).includes("booking_payment_problem"), "pas d'e-mail définitif non plus");
  assertEquals(fake.packages.length, 0);
});

Deno.test("5. deux événements distincts pour le même paiement : une seule confirmation", async () => {
  const fake = makeFake();
  const handler1 = createWebhookHandler(makeDeps(fake, makeEvent("evt_A", SESSION_ID)));
  const handler2 = createWebhookHandler(makeDeps(fake, makeEvent("evt_B", SESSION_ID)));
  await (await handler1(makeRequest())).text();
  await (await handler2(makeRequest())).text();

  // La réservation est relue (idempotence côté RPC réel) ; ici le mock la
  // réenregistre, mais les e-mails sont dédupliqués par message_id déterministe
  // clé sur session.id : une seule confirmation et une seule alerte propriétaire.
  assertEquals(labels(fake).filter((l) => l === "booking_confirmation").length, 1);
  assertEquals(labels(fake).filter((l) => l === "booking_owner_notification").length, 1);
  assertEquals(fake.packages.length, 1, "un seul forfait par session Stripe");
});

Deno.test("6. réservation déclarée créée sans reservation_id : traité comme indéterminé", async () => {
  const fake = makeFake({ bookResult: { ok: true } });
  const res = await createWebhookHandler(makeDeps(fake, makeEvent("evt_noid")))(makeRequest());
  await res.text();
  assertEquals(res.status, 500);
  assertEquals(fake.packages.length, 0);
  assert(!labels(fake).includes("booking_confirmation"));
  assertEquals(fake.notifications.length, 1);
});

Deno.test("7. parcours nominal : réservation vérifiée, forfait et notifications conformes", async () => {
  const fake = makeFake();
  const res = await createWebhookHandler(makeDeps(fake, makeEvent("evt_ok")))(makeRequest());
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(fake.reservations.length, 1);
  assertEquals(fake.packages.length, 1);
  assert(labels(fake).includes("booking_confirmation"));
  assert(labels(fake).includes("booking_owner_notification"));
  assertEquals(fake.events.get("evt_ok")?.status, "processed");
});

Deno.test("8. Stage refusé au 5e jour : aucune écriture partielle, incident, aucune confirmation", async () => {
  const fake = makeFake();
  const event = makeEvent("evt_stage", "cs_test_stage_1", "Stage 100% Glisse");
  const res = await createWebhookHandler(makeDeps(fake, event))(makeRequest());
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(fake.packages.length, 0, "aucun pack créé par le webhook");
  assertEquals(fake.reservations.length, 0);
  assert(!labels(fake).includes("booking_confirmation"), "aucune confirmation client");
  assert(labels(fake).includes("booking_payment_problem"), "e-mail honnête au client");
  assert(labels(fake).includes("stage_payment_failed_admin"), "alerte admin");
  assertEquals(fake.notifications.length, 1);
  assertEquals((fake.notifications[0] as any).p_kind, "stripe_stage_payment_failed");
  assertEquals(fake.events.get("evt_stage")?.status, "failed");
});
