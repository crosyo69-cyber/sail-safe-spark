import { ServiceError, toServiceError } from "./errors";

/** Explicit Result type so services never throw unexpectedly at call sites. */
export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: ServiceError };
export type Result<T> = Ok<T> | Err;

export const ok = <T,>(data: T): Ok<T> => ({ ok: true, data });
export const err = (error: unknown): Err => ({ ok: false, error: toServiceError(error) });

export const isOk = <T,>(r: Result<T>): r is Ok<T> => r.ok;
export const isErr = <T,>(r: Result<T>): r is Err => !r.ok;

/** Run an async operation and capture failures as a Result. */
export const attempt = async <T,>(fn: () => Promise<T>): Promise<Result<T>> => {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e);
  }
};

/**
 * Unwrap a Result for React Query (which expects a thrown error on failure).
 * Keeps the current UX: hooks surface the same messages as before.
 */
export const unwrap = <T,>(r: Result<T>): T => {
  if (r.ok) return (r as Ok<T>).data;
  throw (r as Err).error;
};

export const mapResult = <T, U>(r: Result<T>, fn: (v: T) => U): Result<U> =>
  r.ok ? ok(fn((r as Ok<T>).data)) : (r as Err);

/**
 * Adapte un `Result<T>` au tuple `{ data, error }` historique de supabase-js.
 * Purement transitionnel : permet aux composants migrés de conserver
 * exactement le même flux loading/error/success qu'avant le LOT E-3.
 */
export const settle = <T,>(r: Result<T>): { data: T | null; error: ServiceError | null } =>
  r.ok ? { data: (r as Ok<T>).data, error: null } : { data: null, error: (r as Err).error };
