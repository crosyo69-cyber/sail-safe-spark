/**
 * Google Tag Manager helpers.
 *
 * The GTM snippet in index.html ensures `window.dataLayer` exists before any
 * React code runs. We push events here so GTM (or any tag inside it) can
 * react via dedicated triggers — most notably the Google Ads conversion on
 * the /merci page, which must fire even on direct navigation (no submit).
 */
import { markFired, shouldFireWithinWindow } from './conversion-dedup';
import { hasMarketingConsent, onMarketingConsent } from './consent';

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
 * Dedup: 10s sliding window on a GTM-specific key. Do not write the direct
 * Google Ads mirror here, otherwise the legacy gtag fallback on /merci is
 * blocked before it can emit its conversion event in direct-navigation tests.
 */
export function pushMerciConversion(conversionLabel = 's2n0CL3puI4cEIW4u9AD'): void {
  const conversionId = `AW-974052357/${conversionLabel}`;
  const dedupKey = `__gtm_merci_${conversionId}`;
  const mirrorKey = `conversion_fired_gtm_merci_${conversionId}`;

  // Consent gate — do not push the Ads conversion event into the dataLayer
  // until the visitor has accepted marketing cookies. Replays once on accept.
  if (!hasMarketingConsent()) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        `%c[GTM] merci_conversion DEFERRED (no marketing consent): ${conversionId}`,
        'color:#f59e0b;font-weight:bold'
      );
    }
    onMarketingConsent(() => pushMerciConversion(conversionLabel));
    return;
  }

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