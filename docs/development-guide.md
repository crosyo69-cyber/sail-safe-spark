# Guide de développement — KiteSurf Passion

Standard obligatoire depuis le LOT 2. Toute nouvelle fonctionnalité doit suivre
ce guide ; le lint échoue en cas de violation.

## 1. Créer un nouveau module

1. Copier `src/features/_template/` (voir son `README.md` pour la table de destination).
2. **Types** — `src/features/<module>/types.ts` : types du domaine + logique pure
   (calculs, filtres, formatage). Ni React, ni réseau.
3. **Service** — `src/services/<domaine>.service.ts` : `createApiClient({ scope })`
   puis `rpc` / `query` / `invoke`. Retourne un `Result<T>`, ne jette jamais.
4. **Hook React Query** — `src/hooks/services/use<Domaine>.ts` : clés de cache,
   `unwrap()`, invalidation. Aucun toast, aucune règle métier.
5. **Hook admin** — `src/hooks/admin/useAdmin<Module>.ts` : état d'UI, orchestration,
   toasts, confirmations. Aucun accès backend.
6. **Composants** — `src/components/admin/<module>/*` : présentation pure (props in / JSX out).
7. **Page** — `src/pages/Admin<Module>.tsx` : composition uniquement, un seul hook admin.
8. **Index** — `src/features/<module>/index.ts` : point d'entrée public du module.

## 2. Checklist obligatoire (avant validation d'un module)

```text
□ 0 appel Supabase direct
□ 0 fetch()
□ 0 RPC dans React
□ Page < 300 lignes
□ Hook Admin < 300 lignes
□ Hook React Query < 300 lignes
□ Composants < 300 lignes
□ Service unique
□ TypeScript OK
□ ESLint OK
□ Tests OK
□ Aucun changement fonctionnel
□ Payload RPC inchangé
□ Comportement utilisateur identique
```

Commandes : `npx tsgo --noEmit -p tsconfig.app.json`, `npm run lint`, `npm run test:e2e`.

## 3. Bonnes pratiques

- **Un service par domaine métier**, jamais un service par écran.
- **Une seule source de vérité pour les clés de cache** (`<domaine>Keys`), déclarée
  dans le hook React Query et réutilisée pour l'invalidation.
- **Les messages utilisateur (toasts) restent dans le hook admin**, jamais dans le service.
- **Les erreurs** sont normalisées par `ServiceError` : afficher `error.message`,
  brancher les retries sur `error.retryable`.
- **Edge Functions non idempotentes** : passer `{ retries: 1 }`. Si l'appel peut
  être rejoué sans risque, fournir `idempotencyKey`.
- **Découpage** : au-delà de 300 lignes, extraire un sous-composant ou un helper de `types.ts`.
- **Pas de logique métier dans le JSX** : elle appartient à `types.ts` ou au service.

## 4. Exemples

### Service

```ts
const api = createApiClient({ scope: "reservation" });

export const reservationService = {
  availability: (from: string, to: string) =>
    api.rpc<AvailabilityRow[]>("get_daily_availability", { p_from: from, p_to: to }),
};
```

### Hook React Query

```ts
export const reservationKeys = {
  all: ["reservations"] as const,
  availability: (from: string, to: string) =>
    [...reservationKeys.all, "availability", from, to] as const,
};

useAvailability: (from: string, to: string) =>
  useQuery({
    queryKey: reservationKeys.availability(from, to),
    queryFn: async () => unwrap(await reservationService.availability(from, to)) ?? [],
  });
```

### Hook admin

```ts
const handleCancel = async (id: string) => {
  try {
    await cancel.mutateAsync(id);
    toast.success("Réservation annulée.");
    invalidate();
  } catch (e) {
    toast.error((e as Error).message);
  }
};
```

### Page

```tsx
export default function AdminJournees() {
  const ctrl = useAdminJournees();
  return <ActivityColumn {...ctrl} />;
}
```

## 5. Modules déjà conformes

`AdminJournees`, `AdminAutomations`, `AdminConversionFunnel`, `AdminEmailQueueMonitor`.
À utiliser comme références de lecture.