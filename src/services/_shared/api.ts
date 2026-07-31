import { supabase } from "@/integrations/supabase/client";
import { ServiceError, toServiceError } from "./errors";
import { attempt, type Result } from "./result";

export interface ApiClientOptions {
  /** Label used in logs, e.g. "reservation". */
  scope: string;
  /** Per-call timeout in ms. */
  timeoutMs?: number;
  /** Max attempts (1 = no retry). */
  retries?: number;
  /** Base delay for the exponential backoff, in ms. */
  baseDelayMs?: number;
  /** Max backoff delay, in ms. */
  maxDelayMs?: number;
  /** Emit console diagnostics (dev only by default). */
  debug?: boolean;
}

export interface CallOptions {
  timeoutMs?: number;
  retries?: number;
  /** Sent as `Idempotency-Key` header on edge function invocations. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

const DEFAULTS = {
  timeoutMs: 20_000,
  retries: 2,
  baseDelayMs: 300,
  maxDelayMs: 4_000,
};

export const newIdempotencyKey = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Exponential backoff with full jitter. */
const backoff = (attemptIndex: number, base: number, max: number): number => {
  const raw = Math.min(max, base * 2 ** attemptIndex);
  return Math.round(Math.random() * raw);
};

const withTimeout = async <T,>(fn: () => Promise<T>, timeoutMs: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new ServiceError({ kind: "timeout", message: "Délai dépassé" })),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([fn(), timeout]);
  } finally {
    clearTimeout(timer!);
  }
};

export interface ApiClient {
  /** Postgres RPC call. Returns a Result, never throws. */
  rpc<T = unknown>(fn: string, args?: Record<string, unknown>, opts?: CallOptions): Promise<Result<T>>;
  /** Supabase table query. `build` receives the typed client. */
  query<T = unknown>(label: string, build: (db: typeof supabase) => PromiseLike<{ data: unknown; error: unknown }>, opts?: CallOptions): Promise<Result<T>>;
  /** Edge function invocation. */
  invoke<T = unknown>(fn: string, body?: unknown, opts?: CallOptions): Promise<Result<T>>;
}

export const createApiClient = (options: ApiClientOptions): ApiClient => {
  const cfg = { ...DEFAULTS, ...options };
  const debug = options.debug ?? import.meta.env.DEV;

  const log = (event: string, payload: Record<string, unknown>) => {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.debug(`[api:${cfg.scope}] ${event}`, payload);
  };

  const run = async <T,>(
    label: string,
    exec: () => Promise<{ data: unknown; error: unknown }>,
    opts?: CallOptions,
  ): Promise<Result<T>> => {
    const retries = opts?.retries ?? cfg.retries;
    const timeoutMs = opts?.timeoutMs ?? cfg.timeoutMs;
    const startedAt = Date.now();
    let lastError: ServiceError | undefined;

    for (let i = 0; i < Math.max(1, retries); i++) {
      const res = await attempt(async () => {
        const { data, error } = await withTimeout(exec, timeoutMs);
        if (error) throw toServiceError(error);
        return data as T;
      });

      if (res.ok) {
        log("ok", { label, attempt: i + 1, ms: Date.now() - startedAt });
        return res;
      }

      lastError = res.error;
      const canRetry = res.error.retryable && i < Math.max(1, retries) - 1;
      log(canRetry ? "retry" : "error", {
        label,
        attempt: i + 1,
        kind: res.error.kind,
        message: res.error.message,
      });
      if (!canRetry) return res;
      await sleep(backoff(i, cfg.baseDelayMs, cfg.maxDelayMs));
    }

    return { ok: false, error: lastError ?? toServiceError(new Error("Échec inconnu")) };
  };

  return {
    rpc: (fn, args, opts) =>
      run(`rpc:${fn}`, () => (supabase.rpc as any)(fn, args ?? {}), opts),

    query: (label, build, opts) =>
      run(`query:${label}`, () => Promise.resolve(build(supabase)) as any, opts),

    invoke: (fn, body, opts) =>
      run(
        `fn:${fn}`,
        () =>
          supabase.functions.invoke(fn, {
            body: body as any,
            headers: opts?.idempotencyKey
              ? { "Idempotency-Key": opts.idempotencyKey }
              : undefined,
          }) as any,
        // edge functions are usually non-idempotent unless a key is supplied
        { retries: opts?.idempotencyKey ? undefined : 1, ...opts },
      ),
  };
};