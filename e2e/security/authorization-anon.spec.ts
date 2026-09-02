/**
 * F-13 PHASE 1/2/3 — Autorisation ANON (READ-ONLY).
 * Vérifie que l'identité anonyme ne lit aucune donnée sensible, que
 * `has_role` n'est plus exposé, et que les surfaces publiques restent OK.
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  SENSITIVE_TABLES,
  hasAnonKey,
  isDenied,
  makeRestContext,
  callRpc,
  selectFrom,
} from './fixtures/authorization';

let anon: APIRequestContext;

test.beforeAll(async () => {
  test.skip(!hasAnonKey, 'E2E_SUPABASE_ANON_KEY manquant');
  anon = await makeRestContext();
});

test.afterAll(async () => {
  await anon?.dispose();
});

test.describe('F-13 · ANON — tables sensibles', () => {
  for (const table of SENSITIVE_TABLES) {
    test(`anon ne lit pas ${table}`, async () => {
      const res = await selectFrom(anon, table);
      if (isDenied(res.status())) {
        expect(isDenied(res.status())).toBe(true);
        return;
      }
      // 200 accepté uniquement si RLS renvoie un jeu vide.
      expect(res.status(), `${table} status`).toBe(200);
      expect(await res.json(), `${table} doit être vide sous RLS`).toEqual([]);
    });
  }
});

test.describe('F-13 · ANON — oracle has_role (régression F-12-02)', () => {
  test('rpc/has_role est refusé à anon', async () => {
    const res = await callRpc(anon, 'has_role', {
      _user_id: '00000000-0000-0000-0000-000000000000',
      _role: 'admin',
    });
    expect(isDenied(res.status())).toBe(true);
    expect(res.status()).not.toBe(200);
  });
});

test.describe('F-13 · ANON — surfaces publiques', () => {
  test('blog_comments reste lisible et limité aux commentaires approuvés', async () => {
    const res = await selectFrom(anon, 'blog_comments', 'select=id,is_approved&limit=50');
    expect(res.status()).toBe(200);
    const rows = (await res.json()) as Array<{ is_approved: boolean }>;
    expect(rows.every((r) => r.is_approved === true)).toBe(true);
  });

  test('daily_groups reste lisible', async () => {
    const res = await selectFrom(anon, 'daily_groups', 'select=id,date,activity&limit=5');
    expect(res.status()).toBe(200);
  });

  test('daily_groups.notes reste non exposé', async () => {
    const res = await selectFrom(anon, 'daily_groups', 'select=id,notes&limit=1');
    expect(res.status()).not.toBe(200);
  });

  test('analytics_events est en écriture seule pour anon (lecture refusée/vide)', async () => {
    const res = await selectFrom(anon, 'analytics_events');
    if (res.status() === 200) {
      expect(await res.json()).toEqual([]);
    } else {
      expect(isDenied(res.status())).toBe(true);
    }
  });
});
