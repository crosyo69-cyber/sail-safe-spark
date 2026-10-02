import { test as base } from '../utils/retry-filter';
import type { Page } from '@playwright/test';

/**
 * Low-level web-storage helper exposed to every spec as the `storage`
 * fixture. It guarantees a real origin before touching localStorage /
 * sessionStorage (they throw on `about:blank`).
 */
export interface StorageHelper {
  /** Navigate to "/" if the page is not yet on a real origin. */
  ensureOrigin(): Promise<void>;
  get(key: string): Promise<{ local: string | null; session: string | null }>;
  set(key: string, value: string, where?: 'local' | 'session' | 'both'): Promise<void>;
  remove(key: string): Promise<void>;
  /** All keys of both stores matching one of the given prefixes. */
  keys(prefixes?: readonly string[]): Promise<{ local: string[]; session: string[] }>;
  /** Full dump of both stores (optionally prefix-filtered). */
  dump(prefixes?: readonly string[]): Promise<{
    local: Record<string, string>;
    session: Record<string, string>;
  }>;
  /** Remove every key matching one of the prefixes from both stores. */
  clearByPrefix(prefixes: readonly string[]): Promise<void>;
  /** Nuke both stores entirely on the current origin. */
  clearAll(): Promise<void>;
}

async function ensureOrigin(page: Page): Promise<void> {
  const url = page.url();
  if (!url || url === 'about:blank' || url.startsWith('chrome-error://')) {
    await page.goto('/');
  }
}

export function createStorageHelper(page: Page): StorageHelper {
  const helper: StorageHelper = {
    ensureOrigin: () => ensureOrigin(page),

    async get(key) {
      await ensureOrigin(page);
      return page.evaluate(
        (k) => ({
          local: window.localStorage.getItem(k),
          session: window.sessionStorage.getItem(k),
        }),
        key,
      );
    },

    async set(key, value, where = 'both') {
      await ensureOrigin(page);
      await page.evaluate(
        ({ k, v, w }) => {
          try {
            if (w === 'local' || w === 'both') window.localStorage.setItem(k, v);
            if (w === 'session' || w === 'both') window.sessionStorage.setItem(k, v);
          } catch {
            /* private mode / quota — ignore */
          }
        },
        { k: key, v: value, w: where },
      );
    },

    async remove(key) {
      await ensureOrigin(page);
      await page.evaluate((k) => {
        try { window.localStorage.removeItem(k); } catch { /* ignore */ }
        try { window.sessionStorage.removeItem(k); } catch { /* ignore */ }
      }, key);
    },

    async keys(prefixes) {
      const dumped = await helper.dump(prefixes);
      return { local: Object.keys(dumped.local), session: Object.keys(dumped.session) };
    },

    async dump(prefixes) {
      await ensureOrigin(page);
      return page.evaluate((pfx: string[] | null) => {
        const collect = (storage: Storage) => {
          const out: Record<string, string> = {};
          try {
            for (let i = 0; i < storage.length; i += 1) {
              const k = storage.key(i);
              if (!k) continue;
              if (pfx && !pfx.some((p) => k.startsWith(p))) continue;
              out[k] = storage.getItem(k) ?? '';
            }
          } catch {
            /* ignore */
          }
          return out;
        };
        return {
          local: collect(window.localStorage),
          session: collect(window.sessionStorage),
        };
      }, (prefixes ? [...prefixes] : null) as string[] | null);
    },

    async clearByPrefix(prefixes) {
      await ensureOrigin(page);
      await page.evaluate((pfx: string[]) => {
        const wipe = (storage: Storage) => {
          try {
            for (let i = storage.length - 1; i >= 0; i -= 1) {
              const k = storage.key(i);
              if (k && pfx.some((p) => k.startsWith(p))) storage.removeItem(k);
            }
          } catch {
            /* ignore */
          }
        };
        wipe(window.sessionStorage);
        wipe(window.localStorage);
      }, [...prefixes]);
    },

    async clearAll() {
      await ensureOrigin(page);
      await page.evaluate(() => {
        try { window.localStorage.clear(); } catch { /* ignore */ }
        try { window.sessionStorage.clear(); } catch { /* ignore */ }
      });
    },
  };

  return helper;
}

export const storageTest = base.extend<{ storage: StorageHelper }>({
  storage: async ({ page }, use) => {
    await use(createStorageHelper(page));
  },
});