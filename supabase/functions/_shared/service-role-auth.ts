/**
 * Authenticate internal cron calls with the exact server-held secret.
 *
 * The bearer value is intentionally treated as an opaque secret. JWT payloads
 * are never decoded because claims alone do not prove authenticity.
 */
export function extractBearerToken(req: Request): string {
  const authHeader = req.headers.get("Authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

export function isServiceRoleToken(token: string): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return Boolean(token && serviceKey && token === serviceKey);
}

export function isServiceRoleRequest(req: Request): boolean {
  return isServiceRoleToken(extractBearerToken(req));
}
