// Meta (Facebook) Pixel initialization and tracking
import { markFired, shouldFireWithinWindow } from './conversion-dedup';

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

const META_PIXEL_ID = '733582700316147';
let isInitialized = false;

type MetaPixelBootstrap = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  push?: MetaPixelBootstrap;
  loaded?: boolean;
  version?: string;
  queue: unknown[][];
};

/**
 * Initialize Meta Pixel
 */
export function initMetaPixel(): void {
  if (isInitialized) return;

  const f = window;
  const b = document;

  if (f.fbq) return;

  const n = function (...args: unknown[]) {
    if (typeof n.callMethod === 'function') {
      n.callMethod(...args);
      return;
    }
    n.queue.push(args);
  } as MetaPixelBootstrap;
  f.fbq = n;

  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];

  const loadScript = () => {
    const t = b.createElement('script');
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const s = b.getElementsByTagName('script')[0];
    s?.parentNode?.insertBefore(t, s);

    isInitialized = true;
    console.log('%c[Meta Pixel] Initialized', 'color: #1877f2; font-weight: bold');
  };

  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(loadScript, { timeout: 3000 });
  } else {
    setTimeout(loadScript, 2000);
  }
}

/**
 * Track a page view
 */
export function trackMetaPageView(): void {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
}

/**
 * Track a Lead conversion (form submission).
 *
 * Dedup contract (10s sliding window, validated by Playwright e2e):
 *   - Primary timestamp:  sessionStorage['__meta_pixel_lead']        = Date.now()
 *   - Persistent mirror:  localStorage['conversion_fired_meta_lead'] = Date.now()
 *   - Both Lead AND CompleteRegistration share the SAME dedup slot
 *     (CompleteRegistration is the standard fallback when Lead throws).
 *   - Window: 10_000 ms. After expiry the mirror is auto-cleared and the
 *     event can fire again.
 *
 * Fallback chain:
 *   1. fbq('track','Lead', params)
 *   2. on throw or fbq missing → fbq('track','CompleteRegistration', params)
 * Both consume the same dedup slot.
 */
export function trackMetaLead(params?: Record<string, string>): void {
  const KEY = '__meta_pixel_lead';
  const MIRROR = 'conversion_fired_meta_lead';

  if (!shouldFireWithinWindow(KEY, MIRROR)) {
    if (import.meta.env.DEV) {
      console.log(
        '%c[Meta Pixel] Lead/CompleteRegistration SKIPPED (10s dedup window)',
        'color: #f59e0b; font-weight: bold'
      );
    }
    return;
  }

  const markIfFired = () => markFired(KEY, MIRROR);

  // Primary: Lead
  if (typeof window.fbq === 'function') {
    try {
      window.fbq('track', 'Lead', params);
      markIfFired();
      if (import.meta.env.DEV) {
        console.log('%c[Meta Pixel] Lead tracked', 'color: #1877f2; font-weight: bold');
      }
      return;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[Meta Pixel] Lead failed, falling back to CompleteRegistration', err);
      }
    }
  }

  // Fallback: CompleteRegistration
  if (typeof window.fbq === 'function') {
    try {
      window.fbq('track', 'CompleteRegistration', params);
      markIfFired();
      if (import.meta.env.DEV) {
        console.log(
          '%c[Meta Pixel] CompleteRegistration tracked (fallback)',
          'color: #1877f2; font-weight: bold'
        );
      }
      return;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[Meta Pixel] CompleteRegistration fallback also failed', err);
      }
    }
  }

  // Neither fired — do NOT mark dedup so a later call can retry.
  if (import.meta.env.DEV) {
    console.warn('[Meta Pixel] fbq unavailable — Lead/CompleteRegistration not sent');
  }
}

/**
 * Track a contact event (phone click)
 */
export function trackMetaContact(params?: Record<string, string>): void {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Contact', params);
  }
}

/**
 * Track a custom event
 */
export function trackMetaEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, params);
  }
}
