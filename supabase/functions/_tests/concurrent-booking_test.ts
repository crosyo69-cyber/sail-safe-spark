/**
 * Tests d'intégration : protection anti-oversell sur les réservations
 * concurrentes d'une même session.
 *
 * Ces tests appellent la vraie base Supabase via le SERVICE_ROLE_KEY :
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Si ces variables ne sont pas définies (exécution locale sans accès
 * cloud), les tests sont skippés au lieu d'échouer, ce qui permet de
 * garder le pipeline CI vert sur les forks/PRs externes.
 *
 * Ils vérifient :
 *  1. INSERT direct dans `reservations` : N+K tentatives simultanées sur
 *     une session de capacité N → exactement N réussites, 0 oversell,
 *     status = 'closed'.
 *  2. RPC `book_session_with_code` : mêmes invariants depuis des packs
 *     différents bookant la même session en parallèle.
 */

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RUN = Boolean(SUPABASE_URL && SERVICE_KEY);

function client(): SupabaseClient {
  return createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cleanup helper — supprime toutes les données créées par un test. */
async function cleanup(
  sb: SupabaseClient,
  ids: { sessionId?: string; packageIds?: string[] },
) {
  if (ids.sessionId) {
    await sb.from("reservations").delete().eq("session_id", ids.sessionId);
    await sb.from("package_bookings").delete().eq("session_id", ids.sessionId);
    await sb.from("sessions").delete().eq("id", ids.sessionId);
  }
  if (ids.packageIds?.length) {
    await sb.from("client_packages").delete().in("id", ids.packageIds);
  }
}

function futureDate(daysFromNow = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

Deno.test({
  name: "anti-oversell: 8 réservations concurrentes sur une session de capacité 3 → 3 acceptées, session 'closed'",
  ignore: !RUN,
  async fn() {
    const sb = client();
    const CAPACITY = 3;
    const ATTEMPTS = 8;

    // 1. Créer une session ouverte
    const { data: session, error: sErr } = await sb
      .from("sessions")
      .insert({
        date: futureDate(45),
        time_slot: "morning",
        activity: "wingfoil",
        max_participants: CAPACITY,
        status: "open",
      })
      .select()
      .single();
    assertEquals(sErr, null, `session insert failed: ${sErr?.message}`);
    assert(session);

    try {
      // 2. Lancer ATTEMPTS inserts en parallèle (1 place chacun)
      const inserts = Array.from({ length: ATTEMPTS }, (_, i) =>
        sb
          .from("reservations")
          .insert({
            session_id: session.id,
            first_name: "Test",
            last_name: `Concurrent${i}`,
            email: `concurrent-${i}-${Date.now()}@test.local`,
            phone: "0600000000",
            participants: 1,
            status: "pending",
          })
          .select()
          .single(),
      );
      const results = await Promise.all(inserts);

      const succeeded = results.filter((r) => !r.error).length;
      const failed = results.filter((r) => r.error).length;

      // 3. Invariants : pas d'oversell
      assertEquals(
        succeeded,
        CAPACITY,
        `attendu ${CAPACITY} réussites, obtenu ${succeeded} (échecs=${failed})`,
      );
      assertEquals(succeeded + failed, ATTEMPTS);

      // Chaque échec doit être un session_full / session_closed levé par le trigger
      for (const r of results.filter((r) => r.error)) {
        const msg = r.error!.message.toLowerCase();
        assert(
          msg.includes("session_full") || msg.includes("session_closed"),
          `erreur inattendue: ${r.error!.message}`,
        );
      }

      // 4. La session doit être passée en 'closed' automatiquement
      const { data: after } = await sb
        .from("sessions")
        .select("status")
        .eq("id", session.id)
        .single();
      assertEquals(after?.status, "closed", "la session aurait dû être fermée automatiquement");

      // 5. Vérifier le compte réel en base
      const { count } = await sb
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session.id)
        .neq("status", "cancelled");
      assertEquals(count, CAPACITY, "le nombre de places occupées dépasse la capacité");
    } finally {
      await cleanup(sb, { sessionId: session.id });
    }
  },
});

Deno.test({
  name: "anti-oversell: book_session_with_code en parallèle sur une session de capacité 2 → 2 succès maximum",
  ignore: !RUN,
  async fn() {
    const sb = client();
    const CAPACITY = 2;
    const PACKS = 5;

    // Session
    const { data: session, error: sErr } = await sb
      .from("sessions")
      .insert({
        date: futureDate(60),
        time_slot: "early_afternoon",
        activity: "kitesurf",
        max_participants: CAPACITY,
        status: "open",
      })
      .select()
      .single();
    assertEquals(sErr, null);
    assert(session);

    // Packs actifs avec crédits
    const ts = Date.now();
    const packsPayload = Array.from({ length: PACKS }, (_, i) => ({
      package_code: `KP-TEST-${ts}-${i}`,
      first_name: "Pack",
      last_name: `User${i}`,
      email: `pack-${ts}-${i}@test.local`,
      activity: "kitesurf",
      package_type: "Cours à la Carte",
      total_sessions: 3,
      used_sessions: 0,
      status: "active",
    }));
    const { data: packs, error: pErr } = await sb
      .from("client_packages")
      .insert(packsPayload)
      .select();
    assertEquals(pErr, null, `packs insert: ${pErr?.message}`);
    assert(packs && packs.length === PACKS);

    try {
      // Appels RPC concurrents
      const calls = packs.map((p) =>
        sb.rpc("book_session_with_code", {
          p_code: p.package_code,
          p_session_id: session.id,
        }),
      );
      const results = await Promise.all(calls);

      let ok = 0;
      let full = 0;
      for (const r of results) {
        assertEquals(r.error, null, `rpc error inattendu: ${r.error?.message}`);
        const payload = r.data as { ok: boolean; error?: string } | null;
        if (payload?.ok) ok++;
        else if (payload?.error?.includes("session_full") || payload?.error?.includes("session_closed")) full++;
      }

      assertEquals(ok, CAPACITY, `attendu ${CAPACITY} bookings réussis, obtenu ${ok}`);
      assertEquals(ok + full, PACKS, "tous les refus doivent être full/closed");

      // Session fermée
      const { data: after } = await sb
        .from("sessions")
        .select("status")
        .eq("id", session.id)
        .single();
      assertEquals(after?.status, "closed");

      // Compte exact en base
      const { count } = await sb
        .from("package_bookings")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session.id)
        .eq("status", "confirmed");
      assertEquals(count, CAPACITY);
    } finally {
      await cleanup(sb, {
        sessionId: session.id,
        packageIds: packs.map((p) => p.id),
      });
    }
  },
});

Deno.test({
  name: "anti-oversell: mix reservations + package_bookings concurrents sur capacité 4",
  ignore: !RUN,
  async fn() {
    const sb = client();
    const CAPACITY = 4;

    const { data: session } = await sb
      .from("sessions")
      .insert({
        date: futureDate(75),
        time_slot: "late_afternoon",
        activity: "kitesurf",
        max_participants: CAPACITY,
        status: "open",
      })
      .select()
      .single();
    assert(session);

    const ts = Date.now();
    const { data: packs } = await sb
      .from("client_packages")
      .insert(
        Array.from({ length: 3 }, (_, i) => ({
          package_code: `KP-MIX-${ts}-${i}`,
          first_name: "Mix",
          last_name: `User${i}`,
          email: `mix-${ts}-${i}@test.local`,
          activity: "kitesurf",
          package_type: "Cours à la Carte",
          total_sessions: 3,
          used_sessions: 0,
          status: "active",
        })),
      )
      .select();
    assert(packs);

    try {
      // 3 réservations directes (2 places + 1 place + 1 place) + 3 packs (1 place chacun) = 7 tentatives pour 4 places
      const ops: PromiseLike<unknown>[] = [
        sb.from("reservations").insert({
          session_id: session.id,
          first_name: "Direct",
          last_name: "A",
          email: `direct-a-${ts}@test.local`,
          phone: "0600000000",
          participants: 2,
          status: "pending",
        }),
        sb.from("reservations").insert({
          session_id: session.id,
          first_name: "Direct",
          last_name: "B",
          email: `direct-b-${ts}@test.local`,
          phone: "0600000000",
          participants: 1,
          status: "pending",
        }),
        sb.from("reservations").insert({
          session_id: session.id,
          first_name: "Direct",
          last_name: "C",
          email: `direct-c-${ts}@test.local`,
          phone: "0600000000",
          participants: 1,
          status: "pending",
        }),
        ...packs.map((p) =>
          sb.rpc("book_session_with_code", { p_code: p.package_code, p_session_id: session.id }),
        ),
      ];

      await Promise.all(ops);

      // Recompter en base — l'invariant clé : occupied <= capacity
      const { data: resvs } = await sb
        .from("reservations")
        .select("participants")
        .eq("session_id", session.id)
        .neq("status", "cancelled");
      const { count: bookCount } = await sb
        .from("package_bookings")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session.id)
        .eq("status", "confirmed");

      const occupied =
        (resvs ?? []).reduce((acc, r: { participants: number }) => acc + r.participants, 0) +
        (bookCount ?? 0);

      assert(
        occupied <= CAPACITY,
        `OVERSELL détecté : ${occupied} places occupées pour capacité ${CAPACITY}`,
      );

      const { data: after } = await sb
        .from("sessions")
        .select("status")
        .eq("id", session.id)
        .single();

      // Si on a atteint la capacité, la session doit être fermée
      if (occupied >= CAPACITY) {
        assertEquals(after?.status, "closed", "session pleine non fermée automatiquement");
      }
    } finally {
      await cleanup(sb, {
        sessionId: session.id,
        packageIds: packs.map((p) => p.id),
      });
    }
  },
});