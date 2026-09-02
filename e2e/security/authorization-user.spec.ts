/**
 * F-13 PHASE 4 — Accès légitimes de USER_A (compte standard, READ-ONLY).
 * Distingue explicitement "autorisé mais vide" de "accès refusé".
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  USER_A_ID,
  hasAnonKey,
  hasUserA,
  makeRestContext,
  selectFrom,
  USER_A_TOKEN,
} from './fixtures/authorization';

let userA: APIRequestContext;

test.beforeAll(async () => {
  test.skip(!hasAnonKey || !hasUserA, 'E2E_USER_A_TOKEN manquant');
  userA = await makeRestContext(USER_A_TOKEN);
});

test.afterAll(async () => {
  await userA?.dispose();
});

const OWN_SCOPED: Array<{ table: string; query: string }> = [
  { table: 'profiles', query: 'select=id,user_id&limit=20' },
  { table: 'user_roles', query: 'select=user_id,role&limit=20' },
  { table: 'reservations', query: 'select=id,user_id&limit=20' },
  { table: 'assistant_conversations', query: 'select=id,user_id&limit=20' },
];

test.describe('F-13 · USER_A — lectures propres', () => {
  for (const { table, query } of OWN_SCOPED) {
    test(`${table} : autorisé et limité à USER_A`, async () => {
      const res = await selectFrom(userA, table, query);
      // Le statut d'autorisation prime : 200 attendu même si le jeu est vide.
      expect(res.status(), `${table} status`).toBe(200);
      const rows = (await res.json()) as Array<{ user_id?: string }>;
      for (const row of rows) {
        if (row.user_id) expect(row.user_id).toBe(USER_A_ID);
      }
    });
  }

  test('client_packages : aucune donnée d’un autre client', async () => {
    const res = await selectFrom(userA, 'client_packages', 'select=id,email&limit=20');
    expect([200, 401, 403]).toContain(res.status());
    if (res.status() === 200) {
      expect(await res.json()).toEqual([]);
    }
  });

  test('session_credits : aucune donnée sans session client', async () => {
    const res = await selectFrom(userA, 'session_credits', 'select=id,package_id&limit=20');
    expect([200, 401, 403]).toContain(res.status());
    if (res.status() === 200) {
      expect(await res.json()).toEqual([]);
    }
  });

  test('client_credit_wallet (vue security_invoker) : aucune fuite', async () => {
    const res = await selectFrom(userA, 'client_credit_wallet', 'select=*&limit=5');
    if (res.status() === 200) {
      expect(await res.json()).toEqual([]);
    } else {
      expect([401, 403]).toContain(res.status());
    }
  });
});
