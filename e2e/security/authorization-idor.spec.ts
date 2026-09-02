/**
 * F-13 PHASE 5 — IDOR USER_A → USER_B (READ-ONLY).
 * Aucune donnée de USER_B ne doit être atteignable depuis USER_A,
 * ni par user_id, ni par e-mail, ni par identifiant arbitraire.
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  USER_B_EMAIL,
  USER_B_ID,
  USER_A_TOKEN,
  hasAnonKey,
  hasUserA,
  makeRestContext,
  selectFrom,
} from './fixtures/authorization';

let userA: APIRequestContext;

test.beforeAll(async () => {
  test.skip(!hasAnonKey || !hasUserA, 'E2E_USER_A_TOKEN manquant');
  userA = await makeRestContext(USER_A_TOKEN);
});

test.afterAll(async () => {
  await userA?.dispose();
});

const BY_USER_ID = [
  'profiles',
  'user_roles',
  'reservations',
  'assistant_conversations',
] as const;

test.describe('F-13 · IDOR par user_id', () => {
  for (const table of BY_USER_ID) {
    test(`${table} : USER_A ne lit pas les lignes de USER_B`, async () => {
      const res = await selectFrom(userA, table, `select=*&user_id=eq.${USER_B_ID}&limit=5`);
      expect([200, 401, 403]).toContain(res.status());
      if (res.status() === 200) {
        expect(await res.json()).toEqual([]);
      }
    });
  }
});

const BY_EMAIL = ['client_packages', 'crm_client_profiles', 'marketing_preferences'] as const;

test.describe('F-13 · IDOR par e-mail', () => {
  for (const table of BY_EMAIL) {
    test(`${table} : USER_A ne lit pas les données de USER_B via email`, async () => {
      const res = await selectFrom(
        userA,
        table,
        `select=*&email=eq.${encodeURIComponent(USER_B_EMAIL)}&limit=5`,
      );
      expect([200, 401, 403]).toContain(res.status());
      if (res.status() === 200) {
        expect(await res.json()).toEqual([]);
      }
    });
  }
});

test.describe('F-13 · IDOR sur tables admin-only', () => {
  for (const table of ['email_send_log', 'admin_notifications', 'package_bookings'] as const) {
    test(`${table} : refusé ou vide pour USER_A`, async () => {
      const res = await selectFrom(userA, table, 'select=*&limit=5');
      expect([200, 401, 403]).toContain(res.status());
      if (res.status() === 200) {
        expect(await res.json()).toEqual([]);
      }
    });
  }
});
