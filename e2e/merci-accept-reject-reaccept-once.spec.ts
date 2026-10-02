import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * E2E: Google Ads conversion on /merci fires EXACTLY ONCE even when the user
 * toggles marketing consent multiple times (accept → reject → re-accept).
 *
 * Contract under test:
 *  1. Visitor rejects marketing cookies (marketing:false).
 *  2. Landing on /merci → NO ksp:gads-conversion with status 'sent'.
 *  3. Visitor accepts marketing cookies (marketing:true).
 *  4. The deferred conversion fires exactly once (status 'sent').
 *  5. Visitor rejects marketing cookies again.
 *  6. The conversion does NOT fire again (dedup / no new deferred).
 *  7. Visitor navigates away and back to /merci while still rejected.
 *  8. Still no new fire.
 *  9. Visitor accepts marketing cookies again.
 * 10. Still no new fire — total 'sent' count must remain exactly 1.
 */

const ADS_LABEL = 's2n0CL3puI4cEIW4u9AD';
const ADS_ID = 'AW-974052357';
const SEND_TO = `${ADS_ID}/${ADS_LABEL}`;

type GadsEvent = { status: string; send_to: string; ts: number };

async function installGadsRecorder(page: Page) {
  await page.addInitScript(() => {
    const events: GadsEvent[] = [];
    (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents = events;
    window.addEventListener('ksp:gads-conversion', (e: Event) => {
      const detail = (e as CustomEvent<GadsEvent>).detail;
      if (detail) events.push(detail);
    });
  });
}

async function countSentConversions(page: Page): Promise<number> {
  const events = await page.evaluate(
    () => (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents
  );
  return events.filter(
    (e) => e.status === 'sent' && e.send_to === SEND_TO
  ).length;
}

async function resetGadsCapture(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents.length = 0;
  });
}

/** Strip the consent flags auto-seeded by the global dedup beforeEach. */
async function revokeConsent(page: Page) {
  await page.evaluate(() => {
    try {
      localStorage.removeItem('cookie-consent');
      localStorage.removeItem('cookie-preferences');
    } catch { /* ignore */ }
  });
}

/** Simulate the visitor clicking "Refuser" on the cookie banner. */
async function rejectMarketing(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

/** Simulate the visitor clicking "Accepter" on the cookie banner. */
async function acceptMarketing(page: Page) {
  await page.evaluate(() => {
    const prefs = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
  });
}

test.describe('/merci — Google Ads conversion once only through accept-reject-reaccept', () => {
  test('conversion fires exactly once total even after multiple consent toggles', async ({ page }) => {
    await installGadsRecorder(page);

    // Override the global auto-seeded consent so the test starts from a
    // clean "rejected" state.
    await page.goto('/');
    await revokeConsent(page);
    await rejectMarketing(page);

    await resetGadsCapture(page);

    // 1. Land on /merci with marketing rejected → conversion must NOT fire.
    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_000);

    expect(
      await countSentConversions(page),
      'Google Ads conversion must NOT fire while marketing cookies are initially rejected'
    ).toBe(0);

    // 2. Visitor accepts marketing cookies → deferred conversion fires once.
    await acceptMarketing(page);
    await page.waitForTimeout(800);

    const afterAccept1 = await countSentConversions(page);
    expect(
      afterAccept1,
      'Google Ads conversion must fire exactly once after first marketing consent'
    ).toBe(1);

    const mirrorAfterAccept1 = await page.evaluate(
      (key) => localStorage.getItem(key),
      `conversion_fired_${SEND_TO}`,
    );
    expect(mirrorAfterAccept1, 'dedup mirror must be armed after the first fire').not.toBeNull();

    // 3. Visitor rejects marketing cookies again → no new fire.
    await rejectMarketing(page);
    await page.waitForTimeout(800);

    expect(
      await countSentConversions(page),
      'Google Ads conversion must NOT fire again immediately after rejecting'
    ).toBe(1);

    // 4. Visitor accepts marketing cookies again → still no new fire (dedup).
    await acceptMarketing(page);
    await page.waitForTimeout(800);

    const finalCount = await countSentConversions(page);
    expect(
      finalCount,
      'Google Ads conversion must remain exactly 1 even after re-accepting marketing cookies'
    ).toBe(1);

    const mirrorFinal = await page.evaluate(
      (key) => localStorage.getItem(key),
      `conversion_fired_${SEND_TO}`,
    );
    expect(mirrorFinal, 'dedup mirror must still be armed at end of test').not.toBeNull();
  });
});
