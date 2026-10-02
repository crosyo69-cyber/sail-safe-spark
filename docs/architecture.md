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

## Standard obligatoire (LOT 2)

### Flux imposé

```text
src/pages/           Composition, état d'URL, aucun appel réseau
   ↓
src/hooks/admin/     État d'UI, orchestration, toasts, confirmations
   ↓
src/hooks/services/  React Query : cache, clés, invalidation, unwrap()
   ↓
src/services/        Règles d'accès au domaine, Result<T>, jamais d'exception
   ↓
createApiClient      Timeout, retry + jitter, erreurs typées, idempotence
   ↓
Supabase             RPC / tables / Edge Functions
```

### Responsabilités

| Couche | Autorisé | Interdit |
| --- | --- | --- |
| `pages/` | JSX, composition, un hook admin | Supabase, `fetch`, RPC, logique métier |
| `components/` | Props in / JSX out | Supabase, `fetch`, RPC, requêtes |
| `hooks/admin/` | État local, toasts, orchestration | Supabase, `fetch`, RPC |
| `hooks/services/` | React Query, clés, invalidation | `supabase.*` en direct, toasts |
| `services/` | `createApiClient`, mapping du domaine | React, `toast`, JSX |
| `features/<m>/types.ts` | Types, calculs purs | React, réseau |

### Règles appliquées automatiquement (ESLint)

Dans `src/pages/**`, `src/components/**`, `src/hooks/admin/**` :

| Règle | Effet |
| --- | --- |
| `no-restricted-imports` | Interdit `@/integrations/supabase/client` et `@supabase/supabase-js` |
| `no-restricted-syntax` (`fetch`) | Interdit `fetch()` et `window.fetch` |
| `no-restricted-syntax` (`.rpc`) | Interdit tout appel `*.rpc(...)` |
| `no-restricted-syntax` (`functions.invoke`) | Interdit l'appel direct d'Edge Functions |

Une violation dans un fichier neuf fait échouer `npm run lint`. Les fichiers
antérieurs au standard sont listés explicitement dans `eslint.config.js`
(`LEGACY_DIRECT_SUPABASE`) et rétrogradés en avertissement : cette liste ne doit
jamais s'allonger, uniquement se réduire au fil des migrations.

### Template de module

`src/features/_template/` contient un module complet de référence (types, service,
hook React Query, hook admin, composant, page, index). Voir
[docs/development-guide.md](./development-guide.md) pour la procédure et la
checklist de validation obligatoire.