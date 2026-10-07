# Plan de correction — Workflow E2E Lint en échec

## Objectif
Faire repasser au vert les 3 jobs en échec du workflow **E2E Lint** (branche `lovable-fallback`, commit `a7941ac`) : ESLint no-empty-pattern, typecheck e2e, lint e2e.

## Corrections prévues

### 1. `e2e/utils/retry-filter.ts` (ligne ~179)
- Remplacer la déstructuration vide `{}: Record<string, never>` de `retryFilterFixture` par `_fixtures: Record<string, never>`.
- Lève à la fois la violation `no-empty-pattern` (job 1) et l'erreur TypeScript associée (job 2).

### 2. `e2e/fixtures/index.ts` (ou les specs concernés)
- Réexporter `Page` et `Route` depuis `@playwright/test` pour résoudre les imports manquants signalés par le typecheck.

### 3. `e2e/merci-conversion-consent-toggle.spec.ts`
- Annoter explicitement `this: unknown[]` dans la fonction `push` du recorder dataLayer pour lever l'erreur de typage implicite.

## Vérifications après correction
1. `npx eslint` sur `e2e/` → 0 violation `no-empty-pattern`.
2. `npx tsc -p tsconfig.e2e.json` → 0 erreur.
3. `node scripts/lint-no-empty-pattern.mjs` → PASS.
4. Relance du workflow GitHub à faire par l'utilisateur (Re-run jobs) — pas d'accès GitHub depuis l'agent.

## Hors périmètre
- Aucune modification de la logique métier, des migrations SQL, des fonctions gelées (S1, S2, A0, S3, F-28).
- Uniquement des fichiers de test e2e.
