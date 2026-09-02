/**
 * F-13 PHASE 6 — Frontière admin (READ-ONLY).
 * ANON et USER_A ne doivent atteindre aucune RPC admin ;
 * l'ADMIN doit conserver l'accès aux RPC admin read-only.
 *
 * Les RPC mutatives (admin_adjust_package_credits, admin_recredit_package,
 * admin_cancel_and_recredit, ...) sont volontairement hors périmètre.
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  ADMIN_READONLY_RPCS,
  ADMIN_TOKEN,
  USER_A_TOKEN,
  callRpc,
  hasAdmin,
  hasAnonKey,
  hasUserA,
  makeRestContext,
} from './fixtures/authorization';

test.describe('F-13 · ANON → RPC admin', () => {
  let anon: APIRequestContext;
  test.beforeAll(async () => {
    test.skip(!hasAnonKey, 'E2E_SUPABASE_ANON_KEY manquant');
    anon = await makeRestContext();
  });
  test.afterAll(async () => await anon?.dispose());

  for (const { fn, args } of ADMIN_READONLY_RPCS) {
    test(`${fn} refusé à anon`, async () => {
      const res = await callRpc(anon, fn, args);
      expect(res.status(), `${fn} doit être refusé`).not.toBe(200);
      expect([401, 403]).toContain(res.status());
    });
  }
});

test.describe('F-13 · USER_A → RPC admin', () => {
  let userA: APIRequestContext;
  test.beforeAll(async () => {
    test.skip(!hasAnonKey || !hasUserA, 'E2E_USER_A_TOKEN manquant');
    userA = await makeRestContext(USER_A_TOKEN);
  });
  test.afterAll(async () => await userA?.dispose());

  for (const { fn, args } of ADMIN_READONLY_RPCS) {
    test(`${fn} refusé à un compte standard`, async () => {
      const res = await callRpc(userA, fn, args);
      // Contrat : soit 401/403 (ACL), soit erreur applicative "not_authorized".
      if (res.status() === 200) {
        const body = JSON.stringify(await res.json());
        expect(body).toMatch(/not_authorized|forbidden|unauthorized/i);
      } else {
        expect([400, 401, 403, 404, 500]).toContain(res.status());
      }
    });
  }

  test('USER_A ne possède pas le rôle admin', async () => {
    const res = await userA.get('user_roles?select=role&role=eq.admin&limit=5');
    expect([200, 401, 403]).toContain(res.status());
    if (res.status() === 200) expect(await res.json()).toEqual([]);
  });
});

test.describe('F-13 · ADMIN → RPC admin read-only', () => {
  let admin: APIRequestContext;
  test.beforeAll(async () => {
    test.skip(!hasAnonKey || !hasAdmin, 'E2E_ADMIN_TOKEN manquant');
    admin = await makeRestContext(ADMIN_TOKEN);
  });
  test.afterAll(async () => await admin?.dispose());

  for (const { fn, args } of ADMIN_READONLY_RPCS) {
    test(`${fn} autorisé pour un administrateur`, async () => {
      const res = await callRpc(admin, fn, args);
      expect(res.status(), `${fn} doit répondre 200`).toBe(200);
    });
  }

  test('blog_comments reste lisible pour un administrateur', async () => {
    const res = await admin.get('blog_comments?select=id&limit=5');
    expect(res.status()).toBe(200);
  });
});
