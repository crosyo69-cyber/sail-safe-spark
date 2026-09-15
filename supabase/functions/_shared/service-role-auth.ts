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

/**
 * F-24-04 — vérification serveur d'un bearer service-role, sans jamais faire
 * confiance au claim `role` transporté par le jeton.
 *
 * 1. égalité stricte avec le secret détenu par le serveur ;
 * 2. sinon, preuve d'autorité : le jeton présenté doit réellement pouvoir
 *    exécuter une opération réservée au service_role (Admin API). Un JWT
 *    forgé ou un jeton utilisateur échoue, même s'il déclare role=service_role.
 *
 * `probe` est injectable pour les tests (aucun appel réseau réel).
 */
export type ServiceRoleProbe = (token: string) => Promise<boolean>;

export async function verifyServiceRoleCredential(
  token: string,
  probe?: ServiceRoleProbe,
): Promise<boolean> {
  if (!token) return false;
  if (isServiceRoleToken(token)) return true;
  if (!probe) return false;
  try {
    return await probe(token);
  } catch {
    return false;
  }
}

/** Sonde par défaut : appelle l'Admin API avec le jeton présenté. */
export function createAdminApiProbe(
  createClient: (url: string, key: string, opts?: unknown) => {
    auth: { admin: { listUsers: (o: unknown) => Promise<{ error: unknown }> } };
  },
): ServiceRoleProbe {
  return async (token: string) => {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    if (!url) return false;
    const client = createClient(url, token, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
    return !error;
  };
}
