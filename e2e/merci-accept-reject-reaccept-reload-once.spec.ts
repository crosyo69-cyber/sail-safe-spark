import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * E2E: Google Ads conversion on /merci must fire EXACTLY ONCE total even
 * after the visitor toggles marketing consent (accept → reject → re-accept)
 * AND performs a full page reload of /merci.
 *
 * The persistent dedup mirror `conversion_fired_<send_to>` in localStorage
 * must survive the reload and prevent any second fire.
 */

const ADS_LABEL = 's2n0CL3puI4cEIW4u9AD';
const ADS_ID = 'AW-974052357';
const SEND_TO = `${ADS_ID}/${ADS_LABEL}`;

type GadsEvent = { status: string; send_to: string; ts: number };

async function installGadsRecorder(page: Page) {
  // addInitScript runs on every navigation INCLUDING reloads, so the
  // recorder survives `page.reload()`. The events array however lives on
  // `window` and is reset by the reload — we therefore mirror every event
  // into localStorage so we can count across the reload boundary.
  await page.addInitScript(() => {
    const STORE_KEY = '__gadsEventsPersisted';
    const persisted: GadsEvent[] = (() => {
      try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
      catch { return []; }
    })();
    (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents = persisted;
    window.addEventListener('ksp:gads-conversion', (e: Event) => {
      const detail = (e as CustomEvent<GadsEvent>).detail;
      if (!detail) return;
      const arr = (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents;
      arr.push(detail);
      try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch { /* ignore */ }
    });
  });
}

async function countSentConversions(page: Page): Promise<number> {
  const events = await page.evaluate(
    () => (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents
  );
  return events.filter((e) => e.status === 'sent' && e.send_to === SEND_TO).length;
}

async function resetGadsCapture(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __gadsEvents: GadsEvent[] }).__gadsEvents.length = 0;
    try { localStorage.removeItem('__gadsEventsPersisted'); } catch { /* ignore */ }
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

test.describe('/merci — Google Ads conversion once after accept→reject→reaccept then reload', () => {
  test('full reload after consent toggling never triggers a second conversion', async ({ page }) => {
    await installGadsRecorder(page);

    await page.goto('/');
    await revokeConsent(page);
    await rejectMarketing(page);
    await resetGadsCapture(page);

    // 1. Land on /merci while marketing is rejected → silent.
    await page.goto('/merci');
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(800);
    expect(await countSentConversions(page), 'no fire while rejected').toBe(0);

    // 2. Accept → deferred conversion replays exactly once.
    await acceptMarketing(page);
    await page.waitForTimeout(800);
    expect(await countSentConversions(page), 'one fire after first accept').toBe(1);

    // 3. Reject again → no extra fire.
    await rejectMarketing(page);
    await page.waitForTimeout(500);
    expect(await countSentConversions(page), 'still one after re-reject').toBe(1);

    // 4. Re-accept → still no extra fire (dedup mirror is armed).
    await acceptMarketing(page);
    await page.waitForTimeout(500);
    expect(await countSentConversions(page), 'still one after re-accept').toBe(1);

    // Sanity: dedup mirror persists in localStorage and will survive reload.
    const mirrorBeforeReload = await page.evaluate(
      (key) => localStorage.getItem(key),
      `conversion_fired_${SEND_TO}`,
    );
    expect(mirrorBeforeReload, 'mirror armed before reload').not.toBeNull();

    // 5. FULL RELOAD of /merci with marketing still accepted.
    await page.reload();
    await expect(page.getByRole('heading', { name: /merci pour votre demande/i })).toBeVisible();
    await page.waitForTimeout(1_500);

    const finalCount = await countSentConversions(page);
    expect(
      finalCount,
      'Google Ads conversion must remain exactly 1 even after a full reload of /merci'
    ).toBe(1);

    const mirrorAfterReload = await page.evaluate(
      (key) => localStorage.getItem(key),
      `conversion_fired_${SEND_TO}`,
    );
    expect(mirrorAfterReload, 'mirror still armed after reload').not.toBeNull();
  });
});