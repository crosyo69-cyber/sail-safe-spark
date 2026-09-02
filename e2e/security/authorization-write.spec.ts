/**
 * F-13 PHASE 2 — Tests d'autorisation WRITE (négatifs uniquement).
 *
 * Périmètre : uniquement des mutations attendues comme REFUSÉES.
 *   - ANON   → aucune écriture métier
 *   - USER_A → aucune escalade de privilèges (user_roles)
 *   - USER_A → aucune écriture sur les ressources d'un autre utilisateur
 *   - USER_A → aucune RPC administrative mutative
 *
 * Aucune fixture n'est créée : si la frontière d'autorisation tient, aucune
 * donnée n'est persistée et aucun rollback n'est nécessaire. Toute mutation
 * réussie fait échouer le test (STOP, PHASE 12).
 *
 * Ces tests sont SKIP par défaut (voir fixtures/write-guard.ts).
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  ADMIN_TOKEN,
  USER_A_ID,
  USER_A_TOKEN,
  USER_B_EMAIL,
  USER_B_ID,
  callRpc,
  hasAnonKey,
  hasUserA,
  makeRestContext,
} from './fixtures/authorization';
import {
  ADMIN_MUTATIVE_RPCS,
  WRITE_ENABLED,
  WRITE_SKIP_REASON,
  deleteWhere,
  insertInto,
  isWriteDenied,
  updateWhere,
} from './fixtures/write-guard';

test.describe('F-13-W · ANON → écritures métier', () => {
  let anon: APIRequestContext;
  test.beforeAll(async () => {
    test.skip(!WRITE_ENABLED, WRITE_SKIP_REASON);
    test.skip(!hasAnonKey, 'E2E_SUPABASE_ANON_KEY manquant');
    anon = await makeRestContext();
  });
  test.afterAll(async () => await anon?.dispose());

  const targets: Array<{ table: string; row: Record<string, unknown> }> = [
    { table: 'user_roles', row: { user_id: USER_A_ID, role: 'admin' } },
    { table: 'client_packages', row: { email: 'f13-probe@example.invalid' } },
    { table: 'session_credits', row: { activity: 'kitesurf' } },
    { table: 'reservations', row: { email: 'f13-probe@example.invalid' } },
    { table: 'crm_client_profiles', row: { email: 'f13-probe@example.invalid' } },
  ];

  for (const { table, row } of targets) {
    test(`ANON ne peut pas insérer dans ${table}`, async () => {
      const res = await insertInto(anon, table, row);
      expect(isWriteDenied(res.status()), `INSERT anon ${table} doit être refusé`).toBe(true);
    });

    test(`ANON ne peut pas modifier ${table}`, async () => {
      const res = await updateWhere(anon, table, 'id=not.is.null', row);
      if (res.status() === 200) {
        // Autorisation OK uniquement si aucune ligne n'a été affectée.
        expect(await res.json()).toEqual([]);
      } else {
        expect(isWriteDenied(res.status())).toBe(true);
      }
    });

    test(`ANON ne peut pas supprimer dans ${table}`, async () => {
      const res = await deleteWhere(anon, table, 'id=not.is.null');
      if (res.status() === 200) {
        expect(await res.json()).toEqual([]);
      } else {
        expect(isWriteDenied(res.status())).toBe(true);
      }
    });
  }

  for (const { fn, args } of ADMIN_MUTATIVE_RPCS) {
    test(`ANON ne peut pas appeler ${fn}`, async () => {
      const res = await callRpc(anon, fn, args);
      expect([401, 403]).toContain(res.status());
    });
  }
});

test.describe('F-13-W01 · USER_A → escalade user_roles', () => {
  let userA: APIRequestContext;
  test.beforeAll(async () => {
    test.skip(!WRITE_ENABLED, WRITE_SKIP_REASON);
    test.skip(!hasAnonKey || !hasUserA, 'E2E_USER_A_TOKEN manquant');
    userA = await makeRestContext(USER_A_TOKEN);
  });
  test.afterAll(async () => await userA?.dispose());

  test('USER_A ne peut pas s’attribuer le rôle admin', async () => {
    const res = await insertInto(userA, 'user_roles', {
      user_id: USER_A_ID,
      role: 'admin',
    });
    expect(isWriteDenied(res.status()), 'escalade de privilèges détectée').toBe(true);
  });

  test('USER_A ne peut pas promouvoir une ligne user_roles existante', async () => {
    const res = await updateWhere(userA, 'user_roles', `user_id=eq.${USER_A_ID}`, {
      role: 'admin',
    });
    if (res.status() === 200) {
      expect(await res.json()).toEqual([]);
    } else {
      expect(isWriteDenied(res.status())).toBe(true);
    }
  });

  test('contrôle post-test : USER_A n’est pas admin et aucune ligne parasite', async () => {
    const res = await userA.get('user_roles?select=role&role=eq.admin&limit=5');
    expect([200, 401, 403]).toContain(res.status());
    if (res.status() === 200) expect(await res.json()).toEqual([]);
  });
});

test.describe('F-13-W02/W03/W04 · USER_A → ressources de USER_B', () => {
  let userA: APIRequestContext;
  test.beforeAll(async () => {
    test.skip(!WRITE_ENABLED, WRITE_SKIP_REASON);
    test.skip(!hasAnonKey || !hasUserA, 'E2E_USER_A_TOKEN manquant');
    userA = await makeRestContext(USER_A_TOKEN);
  });
  test.afterAll(async () => await userA?.dispose());

  const crossUser: Array<{ id: string; table: string; filter: string; patch: Record<string, unknown> }> = [
    {
      id: 'W02',
      table: 'client_packages',
      filter: `email=eq.${USER_B_EMAIL}`,
      patch: { used_sessions: 0 },
    },
    {
      id: 'W03',
      table: 'session_credits',
      filter: 'status=eq.available',
      patch: { status: 'available' },
    },
    {
      id: 'W04',
      table: 'reservations',
      filter: `user_id=eq.${USER_B_ID}`,
      patch: { status: 'confirmed' },
    },
    {
      id: 'W05',
      table: 'crm_client_profiles',
      filter: `email=eq.${USER_B_EMAIL}`,
      patch: { observations: 'f13-phase2-authz-probe' },
    },
  ];

  for (const { id, table, filter, patch } of crossUser) {
    test(`${id} · USER_A ne peut pas modifier ${table} de USER_B`, async () => {
      const res = await updateWhere(userA, table, filter, patch);
      if (res.status() === 200) {
        // Aucune ligne affectée = frontière respectée (RLS filtre en amont).
        expect(await res.json(), `${table} modifiée par USER_A`).toEqual([]);
      } else {
        expect(isWriteDenied(res.status())).toBe(true);
      }
    });

    test(`${id} · USER_A ne peut pas supprimer dans ${table} de USER_B`, async () => {
      const res = await deleteWhere(userA, table, filter);
      if (res.status() === 200) {
        expect(await res.json()).toEqual([]);
      } else {
        expect(isWriteDenied(res.status())).toBe(true);
      }
    });
  }
});

test.describe('F-13-W06 · USER_A → RPC admin mutatives', () => {
  let userA: APIRequestContext;
  test.beforeAll(async () => {
    test.skip(!WRITE_ENABLED, WRITE_SKIP_REASON);
    test.skip(!hasAnonKey || !hasUserA, 'E2E_USER_A_TOKEN manquant');
    userA = await makeRestContext(USER_A_TOKEN);
  });
  test.afterAll(async () => await userA?.dispose());

  for (const { fn, args } of ADMIN_MUTATIVE_RPCS) {
    test(`${fn} refusé à un compte standard`, async () => {
      const res = await callRpc(userA, fn, args);
      if (res.status() === 200) {
        const body = JSON.stringify(await res.json());
        expect(body, `${fn} exécutée par USER_A`).toMatch(
          /not_authorized|forbidden|unauthorized/i,
        );
      } else {
        expect([400, 401, 403, 404, 409, 500]).toContain(res.status());
      }
    });
  }
});

/**
 * ADMIN : volontairement NON exécuté. Le fonctionnement positif de ces RPC
 * implique une mutation métier (crédits, réservations) — hors périmètre F-13.
 */
test.describe('F-13-W · ADMIN (hors périmètre)', () => {
  test.skip(true, 'RPC admin mutatives non exécutées avec ADMIN : mutation métier interdite');
  test('placeholder', () => {
    expect(ADMIN_TOKEN).toBeDefined();
  });
});
