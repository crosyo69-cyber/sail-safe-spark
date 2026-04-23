// Meta (Facebook) Pixel initialization and tracking

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

const META_PIXEL_ID = '733582700316147';
let isInitialized = false;

/**
 * Initialize Meta Pixel
 */
export function initMetaPixel(): void {
  if (isInitialized) return;

  // Meta Pixel base code
  const f = window;
  const b = document;

  if (f.fbq) return;

  const n: any = (f.fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
  });

  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];

  // Load pixel script
  const loadScript = () => {
    const t = b.createElement('script');
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const s = b.getElementsByTagName('script')[0];
    s?.parentNode?.insertBefore(t, s);

    isInitialized = true;
    console.log('%c[Meta Pixel] Initialized', 'color: #1877f2; font-weight: bold');
  };

  // Initialize pixel
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(loadScript, { timeout: 3000 });
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
 * Track a lead conversion (form submission).
 *
 * Dedup: 10s sessionStorage window covers BOTH 'Lead' and 'CompleteRegistration'
 * (single shared key) so a fallback fire never produces a duplicate when the
 * primary becomes available again within the window.
 *
 * Fallback: if `fbq` is unavailable OR the 'Lead' call throws, we attempt
 * 'CompleteRegistration' (also a Meta standard event). Both outcomes consume
 * the same dedup slot.
 */
export function trackMetaLead(params?: Record<string, string>): void {
  const DEDUP_KEY = '__meta_pixel_lead'; // shared with CompleteRegistration fallback

  // In-memory lock — survives rapid component remounts within the same JS
  // runtime (faster than sessionStorage and immune to storage quirks).
  // Paired with the sessionStorage check below for cross-reload protection.
  const w = window as unknown as { __metaPixelLeadLockUntil?: number };
  const now = Date.now();
  if (typeof w.__metaPixelLeadLockUntil === 'number' && now < w.__metaPixelLeadLockUntil) {
    if (import.meta.env.DEV) {
      console.log(
        '%c[Meta Pixel] Lead/CompleteRegistration SKIPPED (in-memory lock)',
        'color: #f59e0b; font-weight: bold'
      );
    }
    return;
  }

  // Dedup check (cross-reload via sessionStorage)
  try {
    const last = Number(sessionStorage.getItem(DEDUP_KEY) || '0');
    if (now - last < 10_000) {
      // Re-arm the in-memory lock to mirror the persistent window.
      w.__metaPixelLeadLockUntil = last + 10_000;
      if (import.meta.env.DEV) {
        console.log(
          '%c[Meta Pixel] Lead/CompleteRegistration SKIPPED (deduped <10s)',
          'color: #f59e0b; font-weight: bold'
        );
      }
      return;
    }
  } catch {
    // sessionStorage unavailable — fall through and fire
  }

  const markFired = () => {
    const ts = Date.now();
    w.__metaPixelLeadLockUntil = ts + 10_000;
    try { sessionStorage.setItem(DEDUP_KEY, String(ts)); } catch { /* ignore */ }
  };

  // Primary: Lead
  if (typeof window.fbq === 'function') {
    try {
      window.fbq('track', 'Lead', params);
      markFired();
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
      markFired();
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
