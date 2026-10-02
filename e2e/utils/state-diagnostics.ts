import type { Page, TestInfo } from '@playwright/test';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * TEMPORARY diagnostic instrumentation (LOT 0.5 — phase de diagnostic).
 * Enabled only when process.env.DEDUP_DIAG === '1'. No production impact.
 *
 * Captures a full browser-state snapshot before and after every test and
 * appends a JSONL record (+ diff) to .playwright-state-diag/state.jsonl.
 */

const DIAG_DIR = join(process.cwd(), '.playwright-state-diag');
const DIAG_FILE = join(DIAG_DIR, 'state.jsonl');

export const DIAG_ENABLED = process.env.DEDUP_DIAG === '1';

export interface FullStateSnapshot {
  origin: string;
  url: string;
  capturedAt: string;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: string[];
  cacheStorage: string[];
  indexedDB: string[];
  globals: Record<string, unknown>;
  dataLayerLength: number;
  gtagCallsLength: number;
  fbqCallsLength: number;
}

export async function captureFullState(page: Page): Promise<FullStateSnapshot | null> {
  try {
    const url = page.url();
    if (!url || url === 'about:blank' || url.startsWith('chrome-error://')) return null;
    return await page.evaluate(async () => {
      const dump = (s: Storage) => {
        const out: Record<string, string> = {};
        try {
          for (let i = 0; i < s.length; i += 1) {
            const k = s.key(i);
            if (k) out[k] = s.getItem(k) ?? '';
          }
        } catch { /* ignore */ }
        return out;
      };
      let caches_: string[] = [];
      try { caches_ = 'caches' in window ? await caches.keys() : []; } catch { /* ignore */ }
      let idb: string[] = [];
      try {
        const anyIdb = indexedDB as unknown as { databases?: () => Promise<{ name?: string }[]> };
        if (typeof anyIdb.databases === 'function') {
          idb = (await anyIdb.databases()).map((d) => d.name ?? '(unnamed)');
        }
      } catch { /* ignore */ }
      const w = window as unknown as Record<string, unknown>;
      const globals: Record<string, unknown> = {};
      [
        '__metaPixelLeadLockUntil',
        '__gtmMerciPushed',
        '__kspMerciGtagCount',
        '__gtagCalls',
        '__fbqCalls',
        'gtag',
        'fbq',
        'dataLayer',
        'google_tag_manager',
      ].forEach((k) => {
        const v = w[k];
        globals[k] = Array.isArray(v)
          ? `array(${v.length})`
          : typeof v === 'function'
            ? 'function'
            : typeof v === 'object' && v !== null
              ? 'object'
              : (v as unknown);
      });
      return {
        origin: window.location.origin,
        url: window.location.href,
        capturedAt: new Date().toISOString(),
        localStorage: dump(window.localStorage),
        sessionStorage: dump(window.sessionStorage),
        cookies: document.cookie ? document.cookie.split('; ') : [],
        cacheStorage: caches_,
        indexedDB: idb,
        globals,
        dataLayerLength: Array.isArray(w.dataLayer) ? (w.dataLayer as unknown[]).length : -1,
        gtagCallsLength: Array.isArray(w.__gtagCalls) ? (w.__gtagCalls as unknown[]).length : -1,
        fbqCallsLength: Array.isArray(w.__fbqCalls) ? (w.__fbqCalls as unknown[]).length : -1,
      };
    });
  } catch {
    return null;
  }
}

export function diffMaps(
  before: Record<string, string> | undefined,
  after: Record<string, string> | undefined,
) {
  const b = before ?? {};
  const a = after ?? {};
  const added: Record<string, string> = {};
  const removed: Record<string, string> = {};
  const changed: Record<string, { from: string; to: string }> = {};
  Object.keys(a).forEach((k) => {
    if (!(k in b)) added[k] = a[k];
    else if (b[k] !== a[k]) changed[k] = { from: b[k], to: a[k] };
  });
  Object.keys(b).forEach((k) => { if (!(k in a)) removed[k] = b[k]; });
  return { added, removed, changed };
}

let previousTest: string | null = null;
const executionOrder: string[] = [];

export function recordDiag(
  testInfo: TestInfo,
  phase: 'before' | 'after',
  snapshot: FullStateSnapshot | null,
  extra: Record<string, unknown> = {},
): void {
  if (!DIAG_ENABLED) return;
  try {
    mkdirSync(DIAG_DIR, { recursive: true });
    const record = {
      phase,
      file: testInfo.file.split('/').pop(),
      title: testInfo.title,
      status: testInfo.status ?? null,
      retry: testInfo.retry,
      previousTest,
      executionOrder: [...executionOrder],
      snapshot,
      ...extra,
    };
    appendFileSync(DIAG_FILE, `${JSON.stringify(record)}\n`, 'utf8');
    if (phase === 'before') {
      executionOrder.push(`${record.file} › ${testInfo.title}`);
    } else {
      previousTest = `${record.file} › ${testInfo.title}`;
    }
  } catch { /* ignore */ }
}
