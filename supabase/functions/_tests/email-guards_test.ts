import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  countCurrentLifeFailures,
  dlqRetryCount,
  isSuppressedForPurpose,
  MAX_DLQ_RETRIES,
  normalizeEmail,
  sanitizeHeaderValue,
} from "../_shared/email-guards.ts";

// --- F-21-01 : suppression list -------------------------------------------
Deno.test("TEST 1 — marketing vers adresse supprimée : bloqué", () => {
  const rows = [{ email: "A@Example.com", reason: "unsubscribe" }];
  assertEquals(isSuppressedForPurpose(rows, "a@example.com", "marketing").blocked, true);
});

Deno.test("TEST 1b — hard bounce bloque aussi le transactionnel", () => {
  const rows = [{ email: "a@example.com", reason: "hard_bounce" }];
  assertEquals(isSuppressedForPurpose(rows, "a@example.com", "transactional").blocked, true);
});

Deno.test("TEST 3 — transactionnel non impacté par une désinscription marketing", () => {
  const rows = [{ email: "a@example.com", reason: "unsubscribe" }];
  assertEquals(isSuppressedForPurpose(rows, "a@example.com", "transactional").blocked, false);
});

Deno.test("adresse absente de la suppression list : autorisée", () => {
  assertEquals(isSuppressedForPurpose([], "a@example.com", "marketing").blocked, false);
});

// --- F-21-03 : compteur d'échecs ------------------------------------------
Deno.test("TEST 4 — les échecs antérieurs au DLQ ne comptent pas", () => {
  const rows = [
    { status: "failed", created_at: "2026-01-01T10:00:00Z" },
    { status: "failed", created_at: "2026-01-01T10:01:00Z" },
    { status: "failed", created_at: "2026-01-01T10:02:00Z" },
    { status: "failed", created_at: "2026-01-01T10:03:00Z" },
    { status: "failed", created_at: "2026-01-01T10:04:00Z" },
    { status: "dlq", created_at: "2026-01-01T10:05:00Z" },
    { status: "failed", created_at: "2026-01-01T11:00:00Z" },
  ];
  assertEquals(countCurrentLifeFailures(rows), 1);
});

Deno.test("sans DLQ, tous les échecs comptent (plafond conservé)", () => {
  const rows = Array.from({ length: 5 }, (_, i) => ({
    status: "failed",
    created_at: `2026-01-01T10:0${i}:00Z`,
  }));
  assertEquals(countCurrentLifeFailures(rows), 5);
});

Deno.test("TEST 11 — compteur DLQ borné", () => {
  assertEquals(dlqRetryCount({}), 0);
  assertEquals(dlqRetryCount({ dlq_retry_count: 2 }), 2);
  assertEquals(dlqRetryCount({ dlq_retry_count: "x" }), 0);
  assertEquals(MAX_DLQ_RETRIES, 3);
});

// --- F-21-04 : CRLF --------------------------------------------------------
Deno.test("TEST 5 — CRLF retiré du sujet", () => {
  assertEquals(
    sanitizeHeaderValue("Sujet\r\nBcc: attaquant@evil.test"),
    "Sujet Bcc: attaquant@evil.test",
  );
});

Deno.test("TEST 6 — CRLF retiré du Reply-To, adresse valide préservée", () => {
  assertEquals(sanitizeHeaderValue("contact@kitesurfpassion.fr"), "contact@kitesurfpassion.fr");
  assertEquals(sanitizeHeaderValue("a@b.fr\nX-Inject: 1"), "a@b.fr X-Inject: 1");
  assertEquals(sanitizeHeaderValue(undefined), undefined);
  assertEquals(sanitizeHeaderValue("   "), undefined);
});

Deno.test("normalizeEmail", () => {
  assertEquals(normalizeEmail("  A@B.FR "), "a@b.fr");
});
