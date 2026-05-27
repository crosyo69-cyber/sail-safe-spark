import { type Page } from '@playwright/test';
import { test, expect } from './utils/retry-filter';

/**
 * E2E QA: simule l'acceptation / refus du consentement marketing sur /merci
 * et confirme quand l'événement GTM `merci_conversion` doit (ou ne doit pas)
 * être poussé dans le dataLayer.
 *
 * Contrat testé :
 *  1. Marketing refusé → AUCUN push `merci_conversion`.
 *  2. Acceptation du marketing → exactement 1 push (replay différé).
 *  3. Refus à nouveau → toujours 1 (pas de re-fire).
 *  4. Re-acceptation → toujours 1 (session-once + dedup mirror).
 */

const ADS_LABEL = 's2n0CL3puI4cEIW4u9AD';
const ADS_ID = 'AW-974052357';
const SEND_TO = `${ADS_ID}/${ADS_LABEL}`;

type DLEvent = Record<string, unknown> & { event?: string };

async function installDataLayerRecorder(page: Page) {
  await page.addInitScript(() => {
    const captured: DLEvent[] = [];
    (window as unknown as { __dlEvents: DLEvent[] }).__dlEvents = captured;
    const w = window as unknown as { dataLayer?: unknown[] };
    const existing = Array.isArray(w.dataLayer) ? w.dataLayer : [];
    const proxied: unknown[] = [...existing];
    proxied.push = function (...items: unknown[]) {
      for (const item of items) {
        if (item && typeof item === 'object') captured.push(item as DLEvent);
      }
      return Array.prototype.push.apply(this, items as never[]);
    } as typeof Array.prototype.push;
    w.dataLayer = proxied;
  });
}

async function countMerciConversions(page: Page): Promise<number> {
  const events = await page.evaluate(
    () => (window as unknown as { __dlEvents: DLEvent[] }).__dlEvents,
  );
  return events.filter(
    (e) => e.event === 'merci_conversion' && e.send_to === SEND_TO,
  ).length;
}

async function resetCapture(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __dlEvents: DLEvent[] }).__dlEvents.length = 0;
  });
}

async function revokeConsent(page: Page) {
  await page.evaluate(() => {
    try {
      localStorage.removeItem('cookie-consent');
      localStorage.removeItem('cookie-preferences');
    } catch { /* ignore */ }
  });
}

async function rejectMarketing(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

async function acceptMarketing(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

test.describe('/merci — push GTM merci_conversion conditionné par le consentement', () => {
  test('merci_conversion est différé tant que marketing est refusé, puis fire une seule fois', async ({ page }) => {
    await installDataLayerRecorder(page);

    // État initial : marketing refusé.
    await page.goto('/');
    await revokeConsent(page);
    await rejectMarketing(page);
    await resetCapture(page);

    // 1. /merci avec marketing refusé → aucun push.
    await page.goto('/merci');
    await expect(
      page.getByRole('heading', { name: /merci pour votre demande/i }),
    ).toBeVisible();
    await page.waitForTimeout(1_000);

    expect(
      await countMerciConversions(page),
      'merci_conversion ne doit PAS être poussé tant que le marketing est refusé',
    ).toBe(0);

    // 2. Acceptation → replay différé, 1 push.
    await acceptMarketing(page);
    await page.waitForTimeout(800);
    expect(
      await countMerciConversions(page),
      'merci_conversion doit fire exactement une fois après acceptation du marketing',
    ).toBe(1);

    // 3. Re-refus → pas de nouveau push.
    await rejectMarketing(page);
    await page.waitForTimeout(500);
    expect(
      await countMerciConversions(page),
      'aucun re-fire après nouveau refus',
    ).toBe(1);

    // 4. Re-acceptation → toujours 1 (session-once).
    await acceptMarketing(page);
    await page.waitForTimeout(500);
    expect(
      await countMerciConversions(page),
      'pas de double comptage après re-acceptation du marketing',
    ).toBe(1);
  });
});
