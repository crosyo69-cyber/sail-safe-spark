 import { useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { Helmet } from "react-helmet-async";
 
 interface SEORedirectProps {
   to: string;
   /** HTTP status code hint for prerender services */
   statusCode?: 301 | 302;
 }
 
 /**
  * SEO-friendly redirect component that adds noindex meta tag
  * to prevent "Page with redirect" issues in Google Search Console.
  * Uses JavaScript redirect with proper SEO signals.
  */
 export const SEORedirect = ({ to, statusCode = 301 }: SEORedirectProps) => {
   const navigate = useNavigate();
 
   useEffect(() => {
    // Immediate redirect - meta tags in Helmet are still rendered for crawlers
    navigate(to, { replace: true });
   }, [to, navigate]);
 
   return (
     <Helmet>
       <title>Redirection...</title>
       <meta name="robots" content="noindex, follow" />
       <meta name="prerender-status-code" content={String(statusCode)} />
       <meta httpEquiv="refresh" content={`0;url=${to}`} />
       <link rel="canonical" href={`https://www.kitesurfpassion.com${to}`} />
     </Helmet>
   );
 };