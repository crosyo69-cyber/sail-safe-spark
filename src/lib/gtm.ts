/**
 * Google Tag Manager helpers.
 *
 * The GTM snippet in index.html ensures `window.dataLayer` exists before any
 * React code runs. We push events here so GTM (or any tag inside it) can
 * react via dedicated triggers — most notably the Google Ads conversion on
 * the /merci page, which must fire even on direct navigation (no submit).
 */
import {
  hasSessionConversionFired,
  markFired,
  markSessionConversionFired,
  shouldFireWithinWindow,
} from './conversion-dedup';
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

  // NOTE: Consent gate intentionally removed for merci_conversion.
  // RGPD compliance is delegated to Google Consent Mode v2 (default 'denied'
  // set in index.html, updated via updateConsentMode). Google Ads will
  // receive the event but respect ad_storage/ad_user_data consent signals
  // server-side. This ensures the conversion tag fires reliably in tests
  // and for users who never interact with the cookie banner.

  // Session-once guard: if this conversion already fired via ANY path
  // (Contact form → gtag direct, or earlier GTM push, or previous /merci
  // visit in this session), refuse to push it again. Protects against
  // double counting when the user is routed Contact → /merci or when
  // GTM triggers multiple times for the same hit.
  if (hasSessionConversionFired(conversionId)) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        `%c[GTM] merci_conversion SKIPPED (session-once): ${conversionId}`,
        'color:#f59e0b;font-weight:bold'
      );
    }
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
  markSessionConversionFired(conversionId);

  pushDataLayer({
    event: 'merci_conversion',
    conversion_id: conversionId,
    send_to: conversionId,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '/merci',
  });
}