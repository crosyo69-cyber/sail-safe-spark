/**
 * TEMPLATE — Hook React Query (à déplacer dans `src/hooks/services/useExample.ts`).
 * Rôle : cache, clés de requêtes, invalidation. Aucune logique métier, aucun toast.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/services/_shared/result";
import { exampleService } from "./example.service";

export const exampleKeys = {
  all: ["example"] as const,
  list: (limit: number) => [...exampleKeys.all, "list", limit] as const,
};

export const useExample = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: exampleKeys.all });

  return {
    service: exampleService,
    invalidate,

    useList: (limit = 100) =>
      useQuery({
        queryKey: exampleKeys.list(limit),
        queryFn: async () => unwrap(await exampleService.list(limit)) ?? [],
      }),

    useNotify: () =>
      useMutation({
        mutationFn: async (payload: Record<string, unknown>) =>
          unwrap(await exampleService.notify(payload)),
        onSuccess: invalidate,
      }),
  };
};