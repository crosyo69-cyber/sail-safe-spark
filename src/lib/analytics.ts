// Google Analytics 4 initialization and utilities

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
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

  if (isInitialized && typeof window.gtag === 'function') {
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

  if (isInitialized && typeof window.gtag === 'function') {
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

  if (isInitialized && typeof window.gtag === 'function') {
    window.gtag('event', 'phone_click', params);
  }

  if (import.meta.env.DEV) {
    console.log(
      `%c[Analytics] Phone Click @ ${location}`,
      'color: #06b6d4; font-weight: bold'
    );
  }
}

/**
 * Check if analytics is enabled and initialized
 */
export function isAnalyticsEnabled(): boolean {
  return isInitialized && !!GA_MEASUREMENT_ID;
}
