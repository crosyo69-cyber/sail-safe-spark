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
