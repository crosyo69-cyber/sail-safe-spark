// Google Analytics 4 initialization and utilities
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
    gtag: (...args: unknown[]) => void;
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

// Google Ads conversion ID is the canonical tracking ID for this project.
// VITE_GA_MEASUREMENT_ID is intentionally NOT read here: a misconfigured value
// (e.g. "Kitesurfpassion@69" instead of a "G-XXXXXXXXXX" GA4 ID) would cause
// gtag.js to load against an invalid ID and silently drop all conversion hits
// to Google Ads. Until a valid GA4 ID is wired in, we load gtag.js with
// GOOGLE_ADS_ID so AW-974052357/<label> conversions fire correctly.
const GA_MEASUREMENT_ID: string | undefined = undefined;
const GOOGLE_ADS_ID = 'AW-974052357';

/**
 * Google Ads conversion labels (centralized).
 *
 * Strategy decided with the client (2026-05): only TWO conversion actions in
 * Google Ads:
 *   - LEAD  → form submit, primary booking CTA, /merci page landing
 *   - PHONE → any click on a `tel:` link anywhere on the site
 *
 * To add the PHONE conversion in Google Ads:
 *   1. Google Ads → Tools → Conversions → New conversion action
 *      Source: Website. Category: "Phone call lead". Goal: "Submit lead form"
 *   2. Use the AW-974052357 tag (already loaded site-wide via gtag.js)
 *   3. Copy the generated label (looks like "AbCdEfGhIj1KlMnOp")
 *   4. Replace REPLACE_WITH_PHONE_LABEL below — that's the only change needed.
 */
export const ADS_LEAD_LABEL = 's2n0CL3puI4cEIW4u9AD';
export const ADS_PHONE_LABEL = 'REPLACE_WITH_PHONE_LABEL';

type AdsConversionOptions = {
  onComplete?: () => void;
  transportUrl?: string;
};

let isInitialized = false;

function ensureGtagBootstrap(): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  }
}

/**
 * Initialize Google Analytics 4
 * Uses a deferred approach to avoid React DOM conflicts
 */
export function initGA4(): void {
  if (isInitialized) return;

  if (!GA_MEASUREMENT_ID && !GOOGLE_ADS_ID) {
    if (import.meta.env.DEV) {
      console.warn('[Analytics] No tracking IDs configured - analytics disabled');
    }
    return;
  }

  // Initialize dataLayer and gtag function. If the canonical head snippet has
  // already run, keep its gtag function so Tag Assistant sees one consistent
  // implementation instead of a late body-injected replacement.
  ensureGtagBootstrap();

  // Set initial timestamp
  window.gtag('js', new Date());

  // Configure GA4
  if (GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
      cookie_flags: 'SameSite=None;Secure',
    });
  }

  // Configure Google Ads
  if (GOOGLE_ADS_ID) {
    window.gtag('config', GOOGLE_ADS_ID);
  }

  // Defer script loading to avoid React DOM conflicts
  const loadGAScript = () => {
    const trackingId = GA_MEASUREMENT_ID || GOOGLE_ADS_ID;
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${trackingId}"]`)) {
      isInitialized = true;
      console.log('%c[Analytics] Google Analytics & Ads initialized', 'color: #4285f4; font-weight: bold');
      return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);
    
    isInitialized = true;
    console.log('%c[Analytics] Google Analytics & Ads initialized', 'color: #4285f4; font-weight: bold');
  };

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(loadGAScript, { timeout: 3000 });
  } else {
    setTimeout(loadGAScript, 2000);
  }
}

/**
 * Track a custom event in GA4
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
): void {
  if (!isInitialized || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', eventName, parameters);
}

/**
 * Track page view (automatic with SPA router changes)
 */
export function trackPageView(path: string, title?: string): void {
  if (!isInitialized || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Track CTA button clicks
 */
export function trackCTAClick(
  ctaName: string,
  ctaLocation: string,
  ctaDestination?: string
): void {
  const params = {
    cta_name: ctaName,
    cta_location: ctaLocation,
    ...(ctaDestination && { cta_destination: ctaDestination }),
  };

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'cta_click', params);
  }

  if (import.meta.env.DEV) {
    console.log(
      `%c[Analytics] CTA Click: ${ctaName} @ ${ctaLocation}`,
      'color: #f97316; font-weight: bold',
      params
    );
  }
}

/**
 * Track form submissions
 */
export function trackFormSubmit(
  formName: string,
  formLocation: string,
  formData?: Record<string, string>
): void {
  const params = {
    form_name: formName,
    form_location: formLocation,
    ...(formData && { form_activity: formData.activity }),
  };

  // 10s sliding-window dedup, single source of truth: sessionStorage key
  // `__ga4_form_submit_<formName>` storing Date.now(). No persistent mirror —
  // GA4 form_submit is a per-tab event.
  const dedupKey = `__ga4_form_submit_${formName}`;
  if (!shouldFireWithinWindow(dedupKey)) {
    if (import.meta.env.DEV) {
      console.log(
        `%c[Analytics] Form Submit SKIPPED (dedup window): ${formName}`,
        'color: #f59e0b; font-weight: bold'
      );
    }
    return;
  }
  markFired(dedupKey);

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'form_submit', params);
  }

  if (import.meta.env.DEV) {
    console.log(
      `%c[Analytics] Form Submit: ${formName}`,
      'color: #22c55e; font-weight: bold',
      params
    );
  }
}

/**
 * Track phone call clicks
 */
export function trackPhoneClick(location: string): void {
  const params = {
    event_category: 'contact',
    event_label: location,
    phone_number: '0672716905',
  };

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'phone_click', params);
  }

  // Track Google Ads PHONE conversion (separate action from LEAD).
  // Falls back silently if the label is still the placeholder, so the GA4
  // `phone_click` event still fires while the Ads action is being created.
  if (ADS_PHONE_LABEL && ADS_PHONE_LABEL !== 'REPLACE_WITH_PHONE_LABEL') {
    trackGoogleAdsConversion(ADS_PHONE_LABEL);
  } else if (import.meta.env.DEV) {
    console.warn(
      '[Analytics] PHONE conversion not fired: ADS_PHONE_LABEL placeholder. ' +
        'Create the "Phone call" conversion action in Google Ads and update ' +
        'ADS_PHONE_LABEL in src/lib/analytics.ts.'
    );
  }

  if (import.meta.env.DEV) {
    console.log(
      `%c[Analytics] Phone Click @ ${location}`,
      'color: #06b6d4; font-weight: bold'
    );
  }
}

/**
 * Track Google Ads conversion (called on /merci page)
 * De-duplicates per day using both sessionStorage and localStorage. The shared
 * daily key (`ksp_conv_YYYY-MM-DD`) survives reload/back flows via localStorage
 * while still mirroring into sessionStorage for the current tab session.
 */
export function trackGoogleAdsConversion(
  conversionLabel?: string,
  options: AdsConversionOptions = {}
): void {
  if (typeof window === 'undefined' || !GOOGLE_ADS_ID) {
    return;
  }

  const conversionId = conversionLabel
    ? `${GOOGLE_ADS_ID}/${conversionLabel}`
    : GOOGLE_ADS_ID;

  let completed = false;
  const completeOnce = () => {
    if (completed) return;
    completed = true;
    options.onComplete?.();
  };
  if (options.onComplete) {
    window.setTimeout(completeOnce, 2000);
  }

  // Cookie consent gate: never send a Google Ads hit before the user has
  // accepted marketing cookies. Blocked hits would otherwise show up as
  // failures in Tag Assistant / Ads diagnostics. We still call onComplete so
  // navigation (e.g. → /merci) is not held hostage by the consent state, and
  // we re-arm the fire for when the user later accepts.
  if (!hasMarketingConsent()) {
    if (import.meta.env.DEV) {
      console.log(
        `%c[Analytics] Google Ads Conversion DEFERRED (no marketing consent): ${conversionId}`,
        'color: #f59e0b; font-weight: bold'
      );
    }
    completeOnce();
    window.dispatchEvent(
      new CustomEvent('ksp:gads-conversion', {
        detail: { status: 'deferred', send_to: conversionId, ts: Date.now() },
      })
    );
    onMarketingConsent(() => {
      // Replay once consent is granted. Dedup keys still protect against
      // duplicates if the user had already navigated away and back.
      trackGoogleAdsConversion(conversionLabel);
    });
    return;
  }

  // 10s sliding-window dedup. The CTA submit fires this and so does Merci.tsx
  // on mount — within 10s the second call is a no-op; after 10s it re-fires.
  // Persistent mirror `conversion_fired_<id>` (localStorage) lets the dedup
  // survive reload / back / remount, and signals to test runners that a fire
  // attempt was made for this session.
  const dedupKey = `__gads_conv_${conversionId}`;
  const mirrorKey = `conversion_fired_${conversionId}`;
  if (!shouldFireWithinWindow(dedupKey, mirrorKey)) {
    if (import.meta.env.DEV) {
      console.log(
        `%c[Analytics] Google Ads Conversion SKIPPED (dedup window): ${conversionId}`,
        'color: #f59e0b; font-weight: bold'
      );
    }
    completeOnce();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ksp:gads-conversion', {
          detail: { status: 'skipped', send_to: conversionId, ts: Date.now() },
        })
      );
    }
    return;
  }

  // Mark dedup BEFORE firing so the persistent flag is armed even if gtag
  // is unavailable (e.g. analytics blocked, init not yet finished, or in CI
  // without GA scripts loaded). This guarantees the per-session contract
  // validated by the Playwright dedup suite.
  markFired(dedupKey, mirrorKey);

  // Bootstrap gtag/dataLayer if init hasn't run yet (e.g. direct landing on
  // /merci before App's init effect has executed). The actual gtag.js script
  // loaded by the head snippet/initGA4() will pick up the queued call.
  ensureGtagBootstrap();
  // Match Google's recommended click-conversion helper signature so Ads Tag
  // Assistant can recognize this as the configured Contact action during the
  // conversion-action troubleshooter flow, not only as a generic queued event.
  window.gtag_report_conversion = (url?: string) => {
    const callback = () => {
      completeOnce();
      window.dispatchEvent(
        new CustomEvent('ksp:gads-conversion-callback', {
          detail: { send_to: conversionId, ts: Date.now() },
        })
      );
      if (typeof url === 'string' && url) window.location.href = url;
    };
    window.gtag('event', 'conversion', {
      send_to: conversionId,
      event_callback: callback,
      event_timeout: 2000,
      ...(url ? { value: 1.0, currency: 'EUR' } : {}),
    });
    return false;
  };
  window.gtag_report_conversion(options.transportUrl);

  if (import.meta.env.DEV) {
    console.log(
      `%c[Analytics] Google Ads Conversion tracked: ${conversionId}`,
      'color: #ea4335; font-weight: bold'
    );
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ksp:gads-conversion', {
        detail: { status: 'sent', send_to: conversionId, ts: Date.now() },
      })
    );
  }
}

/**
 * Check if analytics is enabled and initialized
 */
export function isAnalyticsEnabled(): boolean {
  return isInitialized && !!(GA_MEASUREMENT_ID || GOOGLE_ADS_ID);
}

/**
 * DEV-only validation: simulates a double-click submit and verifies that
 * GA4 form_submit + Google Ads conversion are each fired EXACTLY ONCE.
 *
 * Usage in browser console:  window.__validateConversionDedup()
 */
export function validateConversionDedup(): { ga4: number; ads: number; passed: boolean } {
  const FORM_NAME = '__dedup_test__';
  const CONV_LABEL = '__dedup_test_label__';
  const counts = { ga4: 0, ads: 0 };

  // Reset any prior dedup state for these test keys
  try {
    sessionStorage.removeItem(`__ga4_form_submit_${FORM_NAME}`);
    sessionStorage.removeItem(`__gads_conv_${GOOGLE_ADS_ID}/${CONV_LABEL}`);
  } catch {
    // ignore
  }

  // Stub gtag to count fires without hitting the network
  const originalGtag = window.gtag;
  const originalInit = isInitialized;
  isInitialized = true;
  window.gtag = ((...args: unknown[]) => {
    const [type, name, params] = args as [string, string, Record<string, unknown>?];
    if (type !== 'event') return;
    if (name === 'form_submit' && params?.form_name === FORM_NAME) counts.ga4 += 1;
    if (name === 'conversion' && typeof params?.send_to === 'string'
        && (params.send_to as string).endsWith(CONV_LABEL)) counts.ads += 1;
  }) as typeof window.gtag;

  try {
    // Simulate a double-click: two synchronous calls in immediate succession
    trackFormSubmit(FORM_NAME, 'dedup_test');
    trackFormSubmit(FORM_NAME, 'dedup_test');
    trackGoogleAdsConversion(CONV_LABEL);
    trackGoogleAdsConversion(CONV_LABEL);
  } finally {
    window.gtag = originalGtag;
    isInitialized = originalInit;
    // Clean up test dedup keys
    try {
      sessionStorage.removeItem(`__ga4_form_submit_${FORM_NAME}`);
      sessionStorage.removeItem(`__gads_conv_${GOOGLE_ADS_ID}/${CONV_LABEL}`);
    } catch {
      // ignore
    }
  }

  const passed = counts.ga4 === 1 && counts.ads === 1;
  const style = passed
    ? 'color: #22c55e; font-weight: bold; font-size: 13px'
    : 'color: #ef4444; font-weight: bold; font-size: 13px';
  console.log(
    `%c[Dedup Test] ${passed ? '✅ PASSED' : '❌ FAILED'} — GA4 fires: ${counts.ga4}/1, Google Ads fires: ${counts.ads}/1`,
    style
  );
  return { ...counts, passed };
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __validateConversionDedup: typeof validateConversionDedup })
    .__validateConversionDedup = validateConversionDedup;
}
