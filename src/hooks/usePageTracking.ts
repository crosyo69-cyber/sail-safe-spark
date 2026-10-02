import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, isAnalyticsEnabled } from "@/lib/analytics";
import { logAnalyticsEvent } from "@/lib/event-logger";
import { sanitizeAnalyticsPath } from "@/lib/analytics-path";

/**
 * Hook to track page views on route changes in SPA
 * Must be used inside a Router component
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    // Small delay to ensure the page title has been updated by react-helmet-async
    const timeoutId = setTimeout(() => {
      // D-3-FIX / R8 : aucun token public ne doit être transmis aux analytics.
      const safePath = sanitizeAnalyticsPath(location.pathname, location.search);

      // Log every page view to our own store for the conversion dashboard,
      // independently of whether GA4 / Ads is enabled.
      logAnalyticsEvent('page_view', {
        pagePath: safePath,
      });

      if (isAnalyticsEnabled()) {
        trackPageView(safePath, document.title);

        if (import.meta.env.DEV) {
          console.log(
            `%c[Analytics] Page view: ${safePath}`,
            'color: #4285f4'
          );
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search]);
}
