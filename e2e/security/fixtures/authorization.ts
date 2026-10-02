/**
 * F-13 — Fixtures partagées pour la suite E2E d'autorisation / IDOR.
 *
 * STRICTEMENT READ-ONLY : ces helpers n'exposent que des lectures
 * (GET PostgREST) et des appels RPC read-only. Aucun INSERT/UPDATE/DELETE.
 *
 * Identités :
 *   ANON    → clé publishable uniquement
 *   USER_A  → compte standard (E2E_USER_A_TOKEN)
 *   ADMIN   → compte administrateur (E2E_ADMIN_TOKEN)
 *
 * Les tokens sont fournis par variables d'environnement. Sans token,
 * les specs concernées sont `skip` (jamais transformées en PASS).
 */
import { request, type APIRequestContext, type APIResponse } from '@playwright/test';

export const SUPABASE_URL =
  process.env.E2E_SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  'https://unqxudbxxzzmmbwwxwcr.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.E2E_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  '';

export const USER_A_EMAIL = 'testlovable2026@yopmail.com';
export const USER_B_EMAIL = 'crosyo69@gmail.com';

export const USER_A_ID =
  process.env.E2E_USER_A_ID ?? '8cbece2d-5cfd-43d3-97c3-782f9a63e0b8';
export const USER_B_ID =
  process.env.E2E_USER_B_ID ?? '3a8ad17e-0782-45d1-862c-bb01a7c2fe6b';

export const USER_A_TOKEN = process.env.E2E_USER_A_TOKEN ?? '';
export const ADMIN_TOKEN = process.env.E2E_ADMIN_TOKEN ?? '';

export const hasAnonKey = SUPABASE_ANON_KEY.length > 0;
export const hasUserA = USER_A_TOKEN.length > 0;
export const hasAdmin = ADMIN_TOKEN.length > 0;

/** Contexte HTTP PostgREST. `token` vide ⇒ identité ANON. */
export async function makeRestContext(token = ''): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: `${SUPABASE_URL}/rest/v1/`,
    extraHTTPHeaders: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
}

/** Lecture d'une table (READ-ONLY). */
export function selectFrom(
  ctx: APIRequestContext,
  table: string,
  query = 'select=*&limit=5',
): Promise<APIResponse> {
  return ctx.get(`${table}?${query}`);
}

/**
 * Appel RPC. Réservé aux RPC read-only : ne jamais l'utiliser pour une
 * fonction mutative (réservation, crédit, OTP, paiement, e-mail).
 */
export function callRpc(
  ctx: APIRequestContext,
  fn: string,
  body: Record<string, unknown> = {},
): Promise<APIResponse> {
  return ctx.post(`rpc/${fn}`, { data: body });
}

/** Classification : la surface est-elle refusée (401/403) ? */
export function isDenied(status: number): boolean {
  return status === 401 || status === 403;
}

/** Tables sensibles jamais lisibles par ANON. */
export const SENSITIVE_TABLES = [
  'user_roles',
  'crm_client_profiles',
  'client_packages',
  'session_credits',
  'reservations',
  'package_bookings',
  'email_send_log',
  'admin_notifications',
  'assistant_conversations',
  'marketing_preferences',
  'profiles',
] as const;

/** RPC admin read-only (jamais de RPC mutative ici). */
export const ADMIN_READONLY_RPCS: Array<{ fn: string; args: Record<string, unknown> }> = [
  { fn: 'admin_credit_stats', args: { p_start: '2026-01-01', p_end: '2026-01-02' } },
  { fn: 'admin_list_daily_groups', args: { p_date: '2026-01-01' } },
  { fn: 'admin_platform_health', args: {} },
  { fn: 'crm_dashboard', args: {} },
  { fn: 'assistant_briefing', args: {} },
];
