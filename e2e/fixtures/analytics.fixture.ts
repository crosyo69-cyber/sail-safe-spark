import type { Page } from '@playwright/test';
import { dedupTest } from './dedup.fixture';
import {
  installGtagRecorder,
  installFbqRecorder,
  readGtagCalls,
  readFbqCalls,
  countAdsConversions,
  countMetaEvent,
  countGa4Event,
  waitForAdsConversionCount,
  waitForMetaEventCount,
  waitForGa4EventCount,
  expectCountStable,
  type GtagCall,
  type FbqCall,
} from '../utils/conversion-readers';

/** Google Ads conversion account used across the KiteSurf Passion specs. */
export const ADS_CONVERSION_ID = 'AW-974052357';

export interface AnalyticsHelper {
  /** Install the idempotent gtag recorder (must run before navigation). */
  installGtag(): Promise<void>;
  /** Install the idempotent fbq recorder. `failLead` forces the CR fallback. */
  installFbq(options?: { failLead?: boolean }): Promise<void>;
  gtagCalls(): Promise<GtagCall[]>;
  fbqCalls(): Promise<FbqCall[]>;
  countAds(convId?: string): Promise<number>;
  countMeta(eventName: string): Promise<number>;
  countGa4(eventName: string): Promise<number>;
  expectAds(expected: number, opts?: { convId?: string; timeout?: number; message?: string }): Promise<void>;
  expectMeta(eventName: string, expected: number, opts?: { timeout?: number; message?: string }): Promise<void>;
  expectGa4(eventName: string, expected: number, opts?: { timeout?: number; message?: string }): Promise<void>;
  /** Assert a count does not move over a settle window (no late double-fire). */
  expectAdsStable(
    expected: number,
    opts?: { convId?: string; windowMs?: number; message?: string },
  ): Promise<void>;
}

export function createAnalyticsHelper(page: Page): AnalyticsHelper {
  return {
    installGtag: () => installGtagRecorder(page),
    installFbq: (options = {}) => installFbqRecorder(page, options),
    gtagCalls: () => readGtagCalls(page),
    fbqCalls: () => readFbqCalls(page),

    async countAds(convId = ADS_CONVERSION_ID) {
      return countAdsConversions(await readGtagCalls(page), convId);
    },
    async countMeta(eventName) {
      return countMetaEvent(await readFbqCalls(page), eventName);
    },
    async countGa4(eventName) {
      return countGa4Event(await readGtagCalls(page), eventName);
    },

    expectAds: (expected, opts = {}) =>
      waitForAdsConversionCount(page, opts.convId ?? ADS_CONVERSION_ID, expected, {
        timeout: opts.timeout,
        message: opts.message,
      }),
    expectMeta: (eventName, expected, opts = {}) =>
      waitForMetaEventCount(page, eventName, expected, opts),
    expectGa4: (eventName, expected, opts = {}) =>
      waitForGa4EventCount(page, eventName, expected, opts),

    expectAdsStable: (expected, opts = {}) =>
      expectCountStable(
        async () => countAdsConversions(await readGtagCalls(page), opts.convId ?? ADS_CONVERSION_ID),
        expected,
        { windowMs: opts.windowMs, message: opts.message },
      ),
  };
}

/**
 * Recorders are installed automatically (auto fixture) so every spec sees a
 * complete call log from the very first navigation — installing them after
 * `page.goto` is the classic cause of "0 conversions recorded".
 */
export const analyticsTest = dedupTest.extend<{ analytics: AnalyticsHelper }>({
  analytics: [
    async ({ page }, use) => {
      const helper = createAnalyticsHelper(page);
      await helper.installGtag();
      await helper.installFbq();
      await use(helper);
    },
    { auto: true },
  ],
});