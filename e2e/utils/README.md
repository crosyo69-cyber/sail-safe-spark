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
pré-armé sans le perdre) — utilisez l'helper dédié `skipDedupAutoReset` :

```ts
import { test, expect } from './utils/retry-filter';
import { skipDedupAutoReset } from './utils/dedup-storage';

test('garde l’état dédup', async ({ page }, testInfo) => {
  skipDedupAutoReset(testInfo, 'pré-arme __gads_conv_ pour vérifier le blocage');
  // ...sessionStorage / localStorage ne sont PAS wipés avant ce test.
});
```

`skipDedupAutoReset(testInfo, reason?)` pousse l'annotation
`{ type: 'dedupAutoReset', description: 'false[: <reason>]' }` sans risque
de typo ; le hook global la lit via `hasDedupAutoResetSkip(testInfo)`.

### Trace de debug en cas d'opt-out

Quand un test désactive le reset (via `skipDedupAutoReset` ou l'annotation
manuelle), le hook global :

1. Logge dans la console une ligne `[dedup-reset SKIPPED]` avec le titre du
   test, le `retry`, la raison fournie, l'origine, et la liste des clés de
   dédup encore présentes dans `sessionStorage` et `localStorage`.
2. Attache au rapport Playwright un fichier
   `dedup-storage-snapshot.json` contenant la raison, le numéro de retry et
   le snapshot complet (clé → valeur) pour les deux stores.
3. Logge une seconde ligne `[dedup-reset SKIPPED] snapshot → file://…` avec
   l'URL `file://` cliquable du JSON sur disque (sous `testInfo.outputDir`),
   pour ouvrir le snapshot directement depuis le terminal de l'IDE/CI sans
   passer par le rapport HTML.

Objectif : quand une assertion "la conversion ne s'est pas déclenchée"
échoue ensuite, on voit immédiatement *quelles* clés (`__gads_conv_*`,
`conversion_fired_*`, …) bloquaient le tir, sans avoir à instrumenter le
test à la main. Le snapshot est lisible dans le rapport HTML
(`Attachments → dedup-storage-snapshot.json`) et dans le JSON CI.

Les specs encore importés depuis `@playwright/test` ne bénéficient PAS du
hook global ; migrez-les vers `./utils/retry-filter` pour activer le reset.
