/**
 * F-23-01 / F-23-02 — Garde-fous partagés des appels IA (coût provider).
 *
 * Principes :
 *  - l'adresse IP dérivée de `x-forwarded-for` est CONTRÔLABLE par le client :
 *    elle ne peut donc jamais être l'unique identité de rate limiting ;
 *  - toute protection critique est fail-closed ;
 *  - tout appel provider est borné (timeout + plafond de sortie).
 */

/**
 * Clés de rate limit dérivées de la requête.
 *
 * `ip` : première valeur de x-forwarded-for (falsifiable — NOT VERIFIED, voir README sécurité).
 * `edge` : dernière valeur de x-forwarded-for, c.-à-d. celle ajoutée par le proxy
 *          le plus proche de la plateforme. Un client ne peut pas la retirer,
 *          seulement préfixer la liste, donc elle est strictement plus fiable
 *          que la première valeur, sans être formellement prouvable ici.
 */
export function rateLimitKeys(req: Request): { ip: string; edge: string } {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
  const first = parts[0] ?? "";
  const last = parts[parts.length - 1] ?? "";
  const real = (req.headers.get("x-real-ip") ?? "").trim();
  return {
    ip: first || real || "unknown-ip",
    edge: last || real || "unknown-edge",
  };
}

/** Appel `fetch` borné par un timeout, sans retry automatique. */
export async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Relaie un flux SSE en annulant la génération amont dès que :
 *  - le client se déconnecte (cancel) ;
 *  - la durée totale dépasse `totalTimeoutMs`.
 * Aucun retry n'est déclenché.
 */
export function guardedStream(
  upstream: ReadableStream<Uint8Array>,
  totalTimeoutMs: number,
): ReadableStream<Uint8Array> {
  const reader = upstream.getReader();
  let timer: number | undefined;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      timer = setTimeout(() => {
        void reader.cancel("timeout").catch(() => {});
        try {
          controller.close();
        } catch {
          /* déjà fermé */
        }
      }, totalTimeoutMs) as unknown as number;
    },
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          if (timer !== undefined) clearTimeout(timer);
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch {
        if (timer !== undefined) clearTimeout(timer);
        try {
          controller.close();
        } catch {
          /* déjà fermé */
        }
      }
    },
    cancel(reason) {
      // Client déconnecté : on libère immédiatement la génération amont.
      if (timer !== undefined) clearTimeout(timer);
      return reader.cancel(reason).catch(() => {});
    },
  });
}
