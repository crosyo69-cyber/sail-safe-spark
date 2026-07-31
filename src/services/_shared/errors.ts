/* eslint-disable @typescript-eslint/no-explicit-any -- transport layer bridges untyped Supabase generics */
/**
 * Typed error taxonomy shared by every service.
 * Purely additive: no runtime behaviour of the app changes.
 */
export type ServiceErrorKind =
  | "network"
  | "timeout"
  | "auth"
  | "forbidden"
  | "not_found"
  | "validation"
  | "rate_limit"
  | "server"
  | "unknown";

export class ServiceError extends Error {
  readonly kind: ServiceErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly retryable: boolean;

  constructor(opts: {
    kind: ServiceErrorKind;
    message: string;
    status?: number;
    code?: string;
    details?: unknown;
    retryable?: boolean;
  }) {
    super(opts.message);
    this.name = "ServiceError";
    this.kind = opts.kind;
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
    this.retryable = opts.retryable ?? defaultRetryable(opts.kind, opts.status);
  }
}

function defaultRetryable(kind: ServiceErrorKind, status?: number): boolean {
  if (kind === "network" || kind === "timeout" || kind === "rate_limit") return true;
  if (kind === "server") return true;
  if (status && status >= 500) return true;
  return false;
}

export const kindFromStatus = (status: number): ServiceErrorKind => {
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 422 || status === 400) return "validation";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server";
  return "unknown";
};

/** Normalises anything thrown (PostgrestError, FunctionsError, Error…) into a ServiceError. */
export const toServiceError = (err: unknown, fallbackMessage = "Erreur inattendue"): ServiceError => {
  if (err instanceof ServiceError) return err;

  const anyErr = err as any;
  if (anyErr?.name === "AbortError") {
    return new ServiceError({ kind: "timeout", message: "Délai dépassé", details: err });
  }

  const status: number | undefined =
    typeof anyErr?.status === "number" ? anyErr.status : undefined;
  const pgCode: string | undefined = typeof anyErr?.code === "string" ? anyErr.code : undefined;

  let kind: ServiceErrorKind = status ? kindFromStatus(status) : "unknown";
  if (!status && pgCode) {
    if (pgCode === "PGRST301" || pgCode === "42501") kind = "forbidden";
    else if (pgCode === "PGRST116") kind = "not_found";
    else if (pgCode.startsWith("22") || pgCode.startsWith("23")) kind = "validation";
  }
  if (anyErr instanceof TypeError) kind = "network";

  return new ServiceError({
    kind,
    status,
    code: pgCode,
    message: anyErr?.message ?? fallbackMessage,
    details: anyErr?.details ?? err,
  });
};

/** Human readable message, safe to display in the UI (French, matching current copy tone). */
export const errorMessage = (err: unknown): string => toServiceError(err).message;