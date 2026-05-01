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

## Reset des clés de déduplication (`dedup-storage.ts`)

Les tests de conversion partagent un même `BrowserContext` Playwright. Le
système de dédup de l'app écrit à la fois dans `sessionStorage`
(`__gads_conv_*`, `__ga4_form_submit_*`, `__meta_pixel_lead`) **et** dans
`localStorage` (`conversion_fired_*`, `ksp_conv_*`). Sans nettoyage, le
miroir persistant `conversion_fired_<id>` armé par un test bloque le tir
attendu du test suivant ("Received: 0").

### Usage recommandé

```ts
import { test, expect } from '@playwright/test';
import { clearDedupStorage, installDedupStorageReset } from './utils/dedup-storage';

test.describe('mon flow conversion', () => {
  // Option A — hook automatique avant chaque test :
  installDedupStorageReset(test);

  test('…', async ({ page }) => { /* ... */ });
});
```

Ou en appel ponctuel :

```ts
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await clearDedupStorage(page); // wipe session + local sur l'origine courante
});
```

`clearDedupStorage` retire toute clé commençant par : `__gads_conv_`,
`__ga4_form_submit_`, `__meta_pixel_lead`, `conversion_fired_`, `ksp_conv_`.
