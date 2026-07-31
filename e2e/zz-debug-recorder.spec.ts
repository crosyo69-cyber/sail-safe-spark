import { test, expect } from './fixtures';
import { installGtagRecorder, readGtagCalls } from './utils/conversion-readers';

test('debug recorder', async ({ page }) => {
  page.on('console', (m) => console.log('APP>', Date.now() % 100000, m.text().slice(0, 120)));
  await installGtagRecorder(page);
  await page.addInitScript(() => {
    (window as any).__probe = [];
    window.addEventListener('ksp:gads-conversion', (e: any) => {
      const w = window as any; w.__probe.push(['event', e.detail?.status, w.__gtagCalls?.length, JSON.stringify((w.__gtagCalls||[]).slice(-2).map((c:any)=>[c[0],c[1]])), String(w.gtag).slice(0,60)]);
    });
  });
  await page.goto('/');
  await page.evaluate(() => {
    const w = window as any;
    if (w.__gtagCalls) w.__gtagCalls.length = 0;
    try { sessionStorage.removeItem('__gtagCallsStash'); } catch { /* ignore */ }
  });
  await page.goto('/merci');
  await page.waitForTimeout(6000);
  console.log('PROBE', JSON.stringify(await page.evaluate(() => (window as any).__probe)));
  console.log('CALLS', JSON.stringify((await readGtagCalls(page)).map((c) => c.slice(0, 2))));
  expect(true).toBe(true);
});
