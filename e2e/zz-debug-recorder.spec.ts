import { test, expect } from './fixtures';
import { installGtagRecorder, readGtagCalls } from './utils/conversion-readers';

test('debug recorder', async ({ page }) => {
  page.on('console', (m) => console.log('APP>', m.text().slice(0,140)));
  await installGtagRecorder(page);
  await page.goto('/');
  await page.evaluate(() => {
    const w = window as unknown as { __gtagCalls?: unknown[][] };
    if (w.__gtagCalls) w.__gtagCalls.length = 0;
    try { sessionStorage.removeItem('__gtagCallsStash'); } catch { /* ignore */ }
  });
  await page.goto('/merci');
  await page.waitForTimeout(6000);
  const dbg = await page.evaluate(() => ({
    win: ((window as any).__gtagCalls || []).length,
    stash: (sessionStorage.getItem('__gtagCallsStash') || '').slice(0, 200),
    wrapped: !!((window as any).gtag && (window as any).gtag.__isGtagRecorder),
    url: location.href,
  }));
  console.log('DBG', JSON.stringify(dbg));
  const calls = await readGtagCalls(page);
  console.log('CALLS', JSON.stringify(calls));
  console.log('CONSENT', JSON.stringify(await page.evaluate(() => ({ c: localStorage.getItem('cookie-consent'), p: localStorage.getItem('cookie-preferences'), dl: (window as any).dataLayer?.length, g: typeof (window as any).gtag }))));
  expect(true).toBe(true);
});
