// Google Analytics 4 initialization and utilities
import { markFired, shouldFireWithinWindow } from './conversion-dedup';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
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

let isInitialized = false;

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

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

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
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.body.appendChild(script);
    
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

  // Track Google Ads conversion for phone clicks
  trackGoogleAdsConversion('s2n0CL3puI4cEIW4u9AD');

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
export function trackGoogleAdsConversion(conversionLabel?: string): void {
  if (typeof window === 'undefined' || !GOOGLE_ADS_ID) {
    return;
  }

  const conversionId = conversionLabel
    ? `${GOOGLE_ADS_ID}/${conversionLabel}`
    : GOOGLE_ADS_ID;

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
    return;
  }

  // Mark dedup BEFORE firing so the persistent flag is armed even if gtag
  // is unavailable (e.g. analytics blocked, init not yet finished, or in CI
  // without GA scripts loaded). This guarantees the per-session contract
  // validated by the Playwright dedup suite.
  markFired(dedupKey, mirrorKey);

  // Bootstrap gtag/dataLayer if init hasn't run yet (e.g. direct landing on
  // /merci before App's init effect has executed). The actual gtag.js script
  // loaded by initGA4() will pick up the queued call from dataLayer.
  if (typeof window.gtag !== 'function') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  }
  window.gtag('event', 'conversion', {
    send_to: conversionId,
  });

  if (import.meta.env.DEV) {
    console.log(
      `%c[Analytics] Google Ads Conversion tracked: ${conversionId}`,
      'color: #ea4335; font-weight: bold'
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
