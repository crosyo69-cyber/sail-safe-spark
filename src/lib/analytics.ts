// Google Analytics 4 initialization and utilities

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let isInitialized = false;

/**
 * Initialize Google Analytics 4
 * Uses a deferred approach to avoid React DOM conflicts
 */
export function initGA4(): void {
  if (isInitialized || !GA_MEASUREMENT_ID) {
    if (!GA_MEASUREMENT_ID && import.meta.env.DEV) {
      console.warn('[Analytics] GA_MEASUREMENT_ID not configured - analytics disabled');
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
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    cookie_flags: 'SameSite=None;Secure',
  });

  // Defer script loading to avoid React DOM conflicts
  // Use requestIdleCallback to load after React has mounted
  const loadGAScript = () => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    
    // Append to body instead of head to avoid hydration conflicts
    document.body.appendChild(script);
    
    isInitialized = true;
    console.log('%c[Analytics] Google Analytics 4 initialized', 'color: #4285f4; font-weight: bold');
  };

  // Wait for React to finish initial render, then load GA
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(loadGAScript, { timeout: 3000 });
  } else {
    // Fallback for Safari
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
 * Check if analytics is enabled and initialized
 */
export function isAnalyticsEnabled(): boolean {
  return isInitialized && !!GA_MEASUREMENT_ID;
}
