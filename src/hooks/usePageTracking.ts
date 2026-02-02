import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, isAnalyticsEnabled } from "@/lib/analytics";

/**
 * Hook to track page views on route changes in SPA
 * Must be used inside a Router component
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    // Small delay to ensure the page title has been updated by react-helmet-async
    const timeoutId = setTimeout(() => {
      if (isAnalyticsEnabled()) {
        trackPageView(location.pathname + location.search, document.title);
        
        if (import.meta.env.DEV) {
          console.log(
            `%c[Analytics] Page view: ${location.pathname}`,
            'color: #4285f4'
          );
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search]);
}
