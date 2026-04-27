# E2E utils

## Retries filtrés (réseau / timeout uniquement)

En CI, `playwright.config.ts` configure `retries: 2`. Pour éviter de masquer
les bugs déterministes (assertions, erreurs de logique), un mécanisme filtre
les retries pour ne ré-exécuter que les échecs réseau/timeout.

### Usage dans un nouveau spec

```ts
import { test, expect } from './utils/retry-filter';

test('mon scénario', async ({ page }) => {
  // ...
});
```

Au lieu de `import { test, expect } from '@playwright/test'`.

### Comment ça marche

- `retry-filter-reporter.ts` (reporter Playwright) écrit le message d'erreur
  du dernier échec dans `.playwright-last-errors/<testId>.txt`.
- `retry-filter.ts` étend `test` avec un `beforeEach` qui, si `testInfo.retry > 0`,
  lit ce fichier et appelle `testInfo.skip()` si l'erreur ne matche pas
  les patterns réseau/timeout (`net::ERR_*`, `ECONNREFUSED`, `timeout`, etc.).

Les specs qui importent encore depuis `@playwright/test` retentent
inconditionnellement (comportement Playwright par défaut).
