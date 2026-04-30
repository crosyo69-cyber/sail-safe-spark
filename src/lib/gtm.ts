/**
 * Google Tag Manager helpers.
 *
 * The GTM snippet in index.html ensures `window.dataLayer` exists before any
 * React code runs. We push events here so GTM (or any tag inside it) can
 * react via dedicated triggers — most notably the Google Ads conversion on
 * the /merci page, which must fire even on direct navigation (no submit).
 */
import { markFired, shouldFireWithinWindow } from './conversion-dedup';

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

export type DataLayerEvent = Record<string, unknown> & { event: string };

/** Safe push to GTM dataLayer (initialises the array if missing). */
export function pushDataLayer(payload: DataLayerEvent): void {
  if (typeof window === 'undefined') return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('%c[GTM] push', 'color:#4285f4;font-weight:bold', payload);
    }
  } catch {
    /* ignore — never let analytics break the app */
  }
}

/**
 * Fire the Google Ads conversion via GTM on /merci.
 * GTM should be configured with a Custom Event trigger on
 * `event = "merci_conversion"` mapped to the Ads conversion tag
 * (AW-974052357 / s2n0CL3puI4cEIW4u9AD).
 *
 * Dedup: 10s sliding window, persistent mirror, identical contract to the
 * direct gtag path so a Merci mount + a previous CTA submit never double-fire.
 */
export function pushMerciConversion(conversionLabel = 's2n0CL3puI4cEIW4u9AD'): void {
  const conversionId = `AW-974052357/${conversionLabel}`;
  const dedupKey = `__gtm_merci_${conversionId}`;
  const mirrorKey = `conversion_fired_${conversionId}`;

  if (!shouldFireWithinWindow(dedupKey, mirrorKey)) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        `%c[GTM] merci_conversion SKIPPED (dedup): ${conversionId}`,
        'color:#f59e0b;font-weight:bold'
      );
    }
    return;
  }
  markFired(dedupKey, mirrorKey);

  pushDataLayer({
    event: 'merci_conversion',
    conversion_id: conversionId,
    send_to: conversionId,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '/merci',
  });
}