/**
 * Google Consent Mode v2 sync.
 *
 * Default state ('denied' for all storage) is set inline in index.html so the
 * gtag.js loader knows about it before any hit is sent. This module is
 * responsible for pushing `consent: update` whenever the user changes their
 * cookie preferences via CookieConsent.tsx.
 */
import type { CookiePreferences } from './consent';

type GtagFn = (...args: unknown[]) => void;

function getGtag(): GtagFn | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { gtag?: GtagFn };
  return typeof w.gtag === 'function' ? w.gtag : null;
}

export function updateConsentMode(prefs: CookiePreferences): void {
  const gtag = getGtag();
  if (!gtag) return;
  const analytics = prefs.analytics ? 'granted' : 'denied';
  const marketing = prefs.marketing ? 'granted' : 'denied';
  gtag('consent', 'update', {
    analytics_storage: analytics,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  });
}