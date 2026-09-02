/**
 * F-13 PHASE 2 — Garde d'exécution des tests WRITE.
 *
 * Aucun test mutatif ne s'exécute par défaut. Trois conditions cumulatives :
 *   1. E2E_ALLOW_WRITE=1            → opt-in explicite de l'opérateur
 *   2. E2E_WRITE_TARGET=disposable  → confirmation d'un backend jetable
 *   3. tokens d'identité présents   → sinon skip (jamais converti en PASS)
 *
 * Périmètre autorisé : UNIQUEMENT des tentatives d'écriture attendues comme
 * REFUSÉES (ANON, USER_A hors de ses droits). Aucune fixture n'est créée, donc
 * aucun rollback n'est requis : si la frontière tient, rien n'est persisté.
 * Si une mutation réussit, le test échoue → STOP (condition PHASE 12).
 */
import { type APIRequestContext, type APIResponse } from '@playwright/test';

export const WRITE_ENABLED =
  process.env.E2E_ALLOW_WRITE === '1' &&
  process.env.E2E_WRITE_TARGET === 'disposable';

export const WRITE_SKIP_REASON =
  'F-13 PHASE 2 : écriture désactivée (E2E_ALLOW_WRITE=1 + E2E_WRITE_TARGET=disposable requis sur un backend jetable)';

/** Une mutation est-elle correctement refusée ? */
export function isWriteDenied(status: number): boolean {
  // 401/403 : ACL/RLS. 404 : fonction non exposée. 400/409/500 : rejet applicatif.
  return status !== 200 && status !== 201 && status !== 204;
}

/** INSERT PostgREST (attendu : refusé). */
export function insertInto(
  ctx: APIRequestContext,
  table: string,
  row: Record<string, unknown>,
): Promise<APIResponse> {
  return ctx.post(table, { data: row });
}

/** UPDATE PostgREST ciblé (attendu : refusé ou 0 ligne affectée). */
export function updateWhere(
  ctx: APIRequestContext,
  table: string,
  filter: string,
  patch: Record<string, unknown>,
): Promise<APIResponse> {
  return ctx.patch(`${table}?${filter}`, {
    data: patch,
    headers: { Prefer: 'return=representation' },
  });
}

/** DELETE PostgREST ciblé (attendu : refusé ou 0 ligne affectée). */
export function deleteWhere(
  ctx: APIRequestContext,
  table: string,
  filter: string,
): Promise<APIResponse> {
  return ctx.delete(`${table}?${filter}`, {
    headers: { Prefer: 'return=representation' },
  });
}

/** RPC admin mutative (attendu : refusé pour ANON / USER_A). */
export const ADMIN_MUTATIVE_RPCS: Array<{ fn: string; args: Record<string, unknown> }> = [
  {
    fn: 'admin_adjust_package_credits',
    args: {
      p_package_id: '00000000-0000-0000-0000-000000000000',
      p_delta: 0,
      p_reason: 'f13-phase2-authz-probe',
    },
  },
  {
    fn: 'admin_recredit_package',
    args: {
      p_package_id: '00000000-0000-0000-0000-000000000000',
      p_reason: 'f13-phase2-authz-probe',
    },
  },
  {
    fn: 'admin_cancel_and_recredit',
    args: {
      p_booking_id: '00000000-0000-0000-0000-000000000000',
      p_reason: 'f13-phase2-authz-probe',
    },
  },
];
