import { test, expect } from './utils/retry-filter';
import {
  clearDedupStorage,
  skipDedupAutoReset,
  DEDUP_STORAGE_PREFIXES,
} from './utils/dedup-storage';

/**
 * Garde-fou : le second `test.beforeEach(async ({}, testInfo) => …)` du
 * fixture `retry-filter` utilise un pattern de destructuration vide pour
 * la signature `(fixtures, testInfo)`. Ce fichier vérifie que, malgré
 * cette signature, les DEUX hooks beforeEach continuent de fonctionner :
 *
 *  1. Par défaut, le hook auto-reset wipe bien les clés dedup
 *     (`conversion_fired_*`, `__gads_conv_*`, …) du session/localStorage
 *     AVANT que le corps du test ne s'exécute.
 *
 *  2. Quand un test appelle `skipDedupAutoReset(testInfo)`, l'état dedup
 *     pré-armé survit jusqu'au corps du test (le hook ne wipe pas), ce
 *     qui prouve que la branche d'opt-out est toujours empruntée.
 *
 * Sans cette couverture, un futur revert vers `(_fixtures, testInfo)` ou
 * un changement de la condition `hasDedupAutoResetSkip` passerait CI
 * silencieusement.
 */

const PROBE_KEY = `${DEDUP_STORAGE_PREFIXES[3]}AW-974052357/probe`; // conversion_fired_…
const PROBE_VALUE = '1';

async function armDedupState(page: import('@playwright/test').Page) {
  // Doit être sur une vraie origine pour écrire dans le storage.
  await page.goto('/');
  await page.evaluate(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
      window.sessionStorage.setItem(key, value);
    },
    { key: PROBE_KEY, value: PROBE_VALUE },
  );
}

async function readDedupState(page: import('@playwright/test').Page) {
  return page.evaluate((key) => ({
    local: window.localStorage.getItem(key),
    session: window.sessionStorage.getItem(key),
  }), PROBE_KEY);
}

test.describe('beforeEach({}, testInfo) — reset dedup hook', () => {
  test.describe.configure({ mode: 'serial' });

  test('seed: arme une clé dedup persistante AVANT les tests suivants', async ({ page }) => {
    await armDedupState(page);
    const state = await readDedupState(page);
    expect(state.local).toBe(PROBE_VALUE);
    expect(state.session).toBe(PROBE_VALUE);
  });

  test('par défaut : le hook auto-reset a bien wipé la clé dedup', async ({ page }) => {
    // Le test seed ci-dessus a écrit la clé. Si le hook beforeEach
    // (`async ({}, testInfo) => …`) tourne correctement, elle doit avoir
    // disparu AVANT l'exécution de ce corps.
    await page.goto('/');
    const state = await readDedupState(page);
    expect(
      state.local,
      'localStorage.conversion_fired_* doit être wipé par le hook auto-reset',
    ).toBeNull();
    expect(
      state.session,
      'sessionStorage.conversion_fired_* doit être wipé par le hook auto-reset',
    ).toBeNull();
  });

  test(
    'opt-out : skipDedupAutoReset préserve l’état pré-armé',
    async ({ page }, testInfo) => {
      skipDedupAutoReset(testInfo, 'verifie-branche-opt-out-empty-pattern');
      // On arme manuellement (le hook a été désactivé pour ce test).
      await armDedupState(page);
      const state = await readDedupState(page);
      expect(
        state.local,
        'opt-out → le hook ne doit PAS wiper localStorage',
      ).toBe(PROBE_VALUE);
      expect(
        state.session,
        'opt-out → le hook ne doit PAS wiper sessionStorage',
      ).toBe(PROBE_VALUE);
      // Nettoyage explicite pour ne pas polluer les fichiers e2e suivants.
      await clearDedupStorage(page);
    },
  );
});