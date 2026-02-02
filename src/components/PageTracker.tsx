import { usePageTracking } from "@/hooks/usePageTracking";

/**
 * Component that tracks page views on route changes
 * Must be placed inside BrowserRouter
 */
export function PageTracker(): null {
  usePageTracking();
  return null;
}
