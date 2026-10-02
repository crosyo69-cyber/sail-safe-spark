/* eslint-disable @typescript-eslint/no-explicit-any -- transport layer bridges untyped Supabase generics */
/**
 * TEMPLATE — Couche Service (à déplacer dans `src/services/<domaine>.service.ts`).
 * SEULE couche autorisée à parler au backend, exclusivement via createApiClient.
 * Ne lance jamais d'exception : renvoie un `Result<T>`.
 */
import { createApiClient } from "@/services/_shared/api";
import type { ExampleRow } from "./types";

const api = createApiClient({ scope: "example" });

export const exampleService = {
  /** Lecture table. */
  list: (limit = 100) =>
    api.query<ExampleRow[]>("example.list", (db) =>
      (db.from("daily_groups") as any).select("*").limit(limit),
    ),

  /** Appel RPC Postgres. */
  stats: () => api.rpc<unknown>("assistant_briefing", {}),

  /** Appel Edge Function (idempotencyKey si l'appel peut être rejoué). */
  notify: (payload: Record<string, unknown>) =>
    api.invoke<{ error?: string }>("notify-reservation", payload, { retries: 1 }),
};

export type ExampleService = typeof exampleService;