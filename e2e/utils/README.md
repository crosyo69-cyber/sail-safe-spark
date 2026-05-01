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

### Hook global automatique

Le fixture `test` exporté par `./utils/retry-filter` installe en plus un
`beforeEach` global qui exécute `clearDedupStorage(page)` AVANT chaque test
(après une navigation vers `/` pour disposer d'une origine same-origin).

Conséquence : tout spec qui fait

```ts
import { test, expect } from './utils/retry-filter';
```

récupère automatiquement le reset session+local des préfixes de dédup
(`__gads_conv_*`, `__ga4_form_submit_*`, `__meta_pixel_lead`,
`conversion_fired_*`, `ksp_conv_*`). Plus besoin d'appeler
`installDedupStorageReset(test)` ni `clearDedupStorage` à la main.

Opt-out ponctuel (rare, p. ex. tests qui doivent observer un état dédup
pré-armé sans le perdre) :

```ts
test('garde l’état dédup', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'dedupAutoReset', description: 'false' });
  // ...
});
```

Les specs encore importés depuis `@playwright/test` ne bénéficient PAS du
hook global ; migrez-les vers `./utils/retry-filter` pour activer le reset.
