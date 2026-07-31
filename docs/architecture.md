# Architecture — KiteSurf Passion

> LOT 1 — Architecture services. Objectif : sortir la logique métier des composants
> React, sans aucun changement de comportement, d'UI ou d'API publique.

## Vue d'ensemble

```text
  Composants (vues)          Hooks React Query           Services              Backend
 ┌────────────────┐        ┌───────────────────┐     ┌────────────────┐     ┌──────────────┐
 │ pages/         │  --->  │ hooks/services/   │ --> │ services/*.ts  │ --> │ RPC Postgres │
 │ components/    │        │ useReservations() │     │ (métier)       │     │ Edge Funcs   │
 └────────────────┘        └───────────────────┘     └───────┬────────┘     └──────────────┘
                                                             │
                                                     services/_shared/
                                                   api.ts / result.ts / errors.ts
```

Règle : **un composant ne fait jamais** `supabase.from`, `supabase.rpc`,
`supabase.functions.invoke` ni `fetch`. Il consomme uniquement un hook.

## Couches

### 1. `src/services/_shared`

| Fichier | Rôle |
| --- | --- |
| `errors.ts` | Taxonomie d'erreurs typée (`ServiceError`, `kind`, `retryable`) et normalisation de toute erreur (Postgrest, Functions, réseau). |
| `result.ts` | Type `Result<T>` (`ok` / `err`), helpers `attempt`, `unwrap`, `mapResult`. Les services ne lancent pas d'exception. |
| `api.ts` | `createApiClient()` : timeout, retry exponentiel + jitter, erreurs typées, journalisation (dev), clé d'idempotence pour les Edge Functions. |

`createApiClient({ scope })` expose trois primitives :

- `rpc(fn, args, opts)` — appel RPC Postgres
- `query(label, build, opts)` — requête table (`build` reçoit le client Supabase)
- `invoke(fn, body, opts)` — Edge Function (retry seulement si `idempotencyKey` fournie)

### 2. `src/services/*.service.ts`

Un service par domaine métier. Ils encapsulent les noms de RPC et la forme des
paramètres — **aucune règle métier n'a été réécrite**, seulement déplacée.

| Service | Domaine |
| --- | --- |
| `reservation.service.ts` | Disponibilités `daily_groups`, réservation/annulation par code, liste d'attente, actions admin. |
| `credit.service.ts` | Portefeuille de crédits (FIFO), historique, rappels, outils admin (recrédit, ajustement). |
| `payment.service.ts` | `create-checkout` Stripe (acompte dynamique). Comportement Stripe inchangé. |
| `crm.service.ts` | Dashboard, liste et fiche client, profils, niveaux, documents. |
| `marketing.service.ts` | Préférences marketing, segmentation, sync Brevo, automatisations. |
| `weather.service.ts` | Abonnement / désabonnement aux alertes météo. |
| `assistant.service.ts` | Briefing, cockpit financier, actions préparées (validation humaine). |
| `analytics.service.ts` | Reporting lecture seule (santé plateforme, logs 404). Le tracking client (GA4 / Ads / Meta) reste dans `src/lib/analytics.ts`. |

### 3. `src/hooks/services/*`

Un hook par domaine (`useReservations`, `useCredits`, `usePayments`, `useCRM`,
`useMarketing`, `useWeather`, `useAssistant`, `useAnalytics`). Chaque hook :

- expose des sous-hooks React Query (`useAvailability`, `useDashboard`, …) ;
- expose `service` pour les appels impératifs (handlers déjà existants) ;
- centralise les clés de cache (`reservationKeys`, `crmKeys`, …) et l'invalidation.

`unwrap()` convertit un `Result` en valeur ou en exception typée, ce que React
Query attend. Les messages affichés à l'utilisateur restent identiques.

## Flux de référence

### Réservation avec acompte

1. La vue collecte activité / date / participants.
2. `usePayments().useCreateCheckout()` → `payment.service` → `create-checkout`.
3. Stripe → webhook → `sync-stripe-reservations` (backend, inchangé).
4. La vue relit les disponibilités via `useReservations().useAvailability()`.

### Crédits (FIFO)

`useCredits()` lit le portefeuille et l'historique ; la consommation FIFO reste
entièrement en base (RPC `book_daily_with_code`). Aucune logique FIFO côté client.

## Périmètre intouchable

Stripe, Brevo, `daily_groups`, FIFO crédits, CRM, IA, Analytics : **aucune
modification fonctionnelle**. Le lot ne fait que déplacer et typer les appels.

## Migration progressive

Les composants sont migrés par étapes (services d'abord, puis composants
> 300 lignes : `AdminJournees`, `AdminAutomations`, puis `Blog`, `Index`,
`MonEspace`, `AdminConversionFunnel`, `AdminEmailQueueMonitor`).
`BlogArticle` fait l'objet d'un lot dédié.

Après chaque extraction : TypeScript, ESLint, Playwright — zéro régression.