/**
 * F-13 PHASES 7/8 — RPC publiques SECURITY DEFINER (READ-ONLY).
 *
 * Périmètre volontairement restreint aux RPC read-only :
 *  - get_*_by_session avec des tokens invalides (aucune session touchée) ;
 *  - get_daily_availability (agrégat public non nominatif).
 *
 * Hors périmètre (BLOCKED — WRITE REQUIRED) : request_otp, verify_otp,
 * join_waitlist, save_marketing_preferences*, book_*, cancel_* — toutes
 * mutatives (OTP, e-mails, compteurs de rate-limit, données métier).
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { callRpc, hasAnonKey, makeRestContext } from './fixtures/authorization';

let anon: APIRequestContext;

test.beforeAll(async () => {
  test.skip(!hasAnonKey, 'E2E_SUPABASE_ANON_KEY manquant');
  anon = await makeRestContext();
});

test.afterAll(async () => await anon?.dispose());

const SESSION_RPCS = [
  'get_package_by_session',
  'get_wallet_by_session',
  'get_credits_by_session',
  'get_credit_reminders_by_session',
  'get_package_credits_history_by_session',
  'get_marketing_preferences_by_session',
] as const;

const INVALID_TOKENS: Array<[string, string]> = [
  ['token vide', ''],
  ['token synthétique', 'not-a-real-session-token'],
  ['token aléatoire', 'a'.repeat(64)],
];

test.describe('F-13 · RPC session avec tokens invalides', () => {
  for (const fn of SESSION_RPCS) {
    for (const [label, token] of INVALID_TOKENS) {
      test(`${fn} — ${label} ne renvoie aucune donnée`, async () => {
        const res = await callRpc(anon, fn, { p_token: token });
        if (res.status() !== 200) {
          expect([400, 401, 403, 404]).toContain(res.status());
          return;
        }
        const body = await res.json();
        const serialized = JSON.stringify(body ?? null);
        expect(serialized).not.toMatch(/@/); // aucun e-mail exposé
        expect(
          body === null ||
            (Array.isArray(body) && body.length === 0) ||
            serialized === '{}' ||
            /invalid|not_found|false|null/i.test(serialized),
        ).toBe(true);
      });
    }
  }
});

test.describe('F-13 · agrégats publics', () => {
  test('get_daily_availability ne contient aucune donnée nominative', async () => {
    const res = await callRpc(anon, 'get_daily_availability', { p_date: '2026-09-15' });
    expect(res.status()).toBe(200);
    const serialized = JSON.stringify(await res.json());
    expect(serialized).not.toMatch(/@/);
    expect(serialized).not.toMatch(/first_name|last_name|phone|package_code|email/i);
  });
});

test.describe('F-13 · RPC réservées (non exposées à anon)', () => {
  for (const fn of ['admin_search_wallets', 'crm_list_clients', 'assistant_list_actions']) {
    test(`${fn} refusé à anon`, async () => {
      const res = await callRpc(anon, fn, {});
      expect(res.status()).not.toBe(200);
    });
  }
});
