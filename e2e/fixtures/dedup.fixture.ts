import type { Page } from '@playwright/test';
import { consentTest } from './consent.fixture';
import type { StorageHelper } from './storage.fixture';
import {
  DEDUP_STORAGE_PREFIXES,
  clearDedupStorage,
  skipDedupAutoReset,
  hasDedupAutoResetSkip,
  getDedupAutoResetSkipReason,
  snapshotDedupStorage,
  type DedupStorageSnapshot,
} from '../utils/dedup-storage';

/**
 * Conversion-dedup driver.
 *
 * The global auto-reset lives in `../utils/retry-filter` (imported by
 * `storage.fixture`), so by the time a test body runs the dedup keys are
 * already wiped and marketing consent is seeded. This fixture exposes the
 * same primitives for tests that need to arm / inspect / re-wipe state
 * mid-scenario (reload, back-navigation, remount cases).
 */
export interface DedupHelper {
  readonly prefixes: readonly string[];
  /** Wipe every dedup key from both stores (also re-seeds consent). */
  reset(): Promise<void>;
  /** Snapshot every dedup key currently present. */
  snapshot(): Promise<DedupStorageSnapshot>;
  /** Pre-arm a dedup flag to simulate an "already fired" state. */
  arm(key: string, value?: string, where?: 'local' | 'session' | 'both'): Promise<void>;
  /** Read a dedup flag from both stores. */
  read(key: string): Promise<{ local: string | null; session: string | null }>;
  /** True when at least one dedup key is present. */
  isArmed(): Promise<boolean>;
}

export function createDedupHelper(page: Page, storage: StorageHelper): DedupHelper {
  return {
    prefixes: DEDUP_STORAGE_PREFIXES,
    reset: () => clearDedupStorage(page),
    snapshot: () => snapshotDedupStorage(page),
    arm: (key, value = '1', where = 'both') => storage.set(key, value, where),
    read: (key) => storage.get(key),
    async isArmed() {
      const snap = await snapshotDedupStorage(page);
      return snap.totalKeys > 0;
    },
  };
}

export const dedupTest = consentTest.extend<{ dedup: DedupHelper }>({
  dedup: async ({ page, storage }, use) => {
    await use(createDedupHelper(page, storage));
  },
});

export {
  DEDUP_STORAGE_PREFIXES,
  skipDedupAutoReset,
  hasDedupAutoResetSkip,
  getDedupAutoResetSkipReason,
};
export type { DedupStorageSnapshot };