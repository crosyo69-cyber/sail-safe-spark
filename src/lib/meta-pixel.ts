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
 * Track a lead conversion (form submission)
 */
export function trackMetaLead(params?: Record<string, string>): void {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', params);
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
