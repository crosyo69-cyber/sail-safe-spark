import { useLocation } from "react-router-dom";
import { lazy } from "react";
import { resolveLegacyRedirect } from "@/lib/legacy-redirects";
import { SEORedirect } from "@/components/SEORedirect";

const NotFound = lazy(() => import("@/pages/NotFound"));

/**
 * Handles legacy URL redirections client-side.
 * If the current path matches a legacy URL, renders SEORedirect.
 * Otherwise, renders the NotFound page.
 */
export const LegacyRedirectHandler = () => {
  const location = useLocation();
  const redirectTo = resolveLegacyRedirect(location.pathname);

  if (redirectTo) {
    return <SEORedirect to={redirectTo} statusCode={301} />;
  }

  return <NotFound />;
};
