import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, Settings, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_PREFERENCES_KEY = 'cookie-preferences';

// Global function to open cookie preferences from anywhere
let openCookiePreferencesGlobal: (() => void) | null = null;

export const openCookiePreferences = () => {
  if (openCookiePreferencesGlobal) {
    openCookiePreferencesGlobal();
  }
};

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Register global function to open preferences
    openCookiePreferencesGlobal = () => {
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
      setShowPreferences(true);
    };

    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    } else {
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    }

    return () => {
      openCookiePreferencesGlobal = null;
    };
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowPreferences(false);
    
    // Apply preferences (disable/enable analytics scripts)
    if (prefs.analytics) {
      enableAnalytics();
    } else {
      disableAnalytics();
    }

    // Notify listeners (analytics gating, queued conversions, etc.)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ksp:consent-updated', { detail: prefs }));
    }
  };

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const rejectAll = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  const savePreferences = () => {
    saveConsent(preferences);
  };

  const enableAnalytics = () => {
    // Enable Google Analytics if configured
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  };

  const disableAnalytics = () => {
    // Disable Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  };

  return (
    <>
      {/* Main Cookie Banner - Optimized for CLS with transform animation */}
      {showBanner && !showPreferences && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          role="dialog"
          aria-label="Consentement cookies"
          aria-describedby="cookie-description"
          style={{
            transform: 'translateY(0)',
            animation: 'slideUpBanner 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            willChange: 'transform',
            contain: 'layout style',
          }}
        >
          <style>{`
            @keyframes slideUpBanner {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl shadow-2xl p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    🍪 Nous respectons votre vie privée
                  </h3>
                  <p id="cookie-description" className="text-sm text-muted-foreground leading-relaxed">
                    Nous utilisons des cookies pour améliorer votre expérience de navigation, 
                    analyser le trafic du site et personnaliser le contenu. En cliquant sur 
                    "Tout accepter", vous consentez à l'utilisation de tous les cookies. 
                    Vous pouvez également personnaliser vos préférences.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={acceptAll}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    aria-label="Accepter tous les cookies"
                  >
                    Tout accepter
                  </Button>
                  <Button 
                    onClick={rejectAll}
                    variant="outline"
                    className="border-border hover:bg-accent"
                    aria-label="Refuser les cookies non essentiels"
                  >
                    Tout refuser
                  </Button>
                  <Button 
                    onClick={() => setShowPreferences(true)}
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Personnaliser les préférences de cookies"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Personnaliser
                  </Button>
                </div>
              </div>
              
              <button
                onClick={rejectAll}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Fermer et refuser les cookies"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Préférences de cookies
            </DialogTitle>
            <DialogDescription>
              Gérez vos préférences de cookies. Les cookies nécessaires sont toujours actifs car ils sont essentiels au fonctionnement du site.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-1">
                <Label className="text-base font-medium">Cookies nécessaires</Label>
                <p className="text-sm text-muted-foreground">
                  Essentiels au fonctionnement du site. Ils permettent la navigation et l'accès aux fonctionnalités de base.
                </p>
              </div>
              <Switch
                checked={true}
                disabled
                aria-label="Cookies nécessaires (toujours activés)"
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border">
              <div className="space-y-1">
                <Label htmlFor="analytics-switch" className="text-base font-medium">Cookies analytiques</Label>
                <p className="text-sm text-muted-foreground">
                  Nous aident à comprendre comment vous utilisez le site pour l'améliorer (Google Analytics).
                </p>
              </div>
              <Switch
                id="analytics-switch"
                checked={preferences.analytics}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, analytics: checked })
                }
                aria-label="Activer les cookies analytiques"
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border">
              <div className="space-y-1">
                <Label htmlFor="marketing-switch" className="text-base font-medium">Cookies marketing</Label>
                <p className="text-sm text-muted-foreground">
                  Utilisés pour vous proposer des publicités pertinentes et mesurer leur efficacité.
                </p>
              </div>
              <Switch
                id="marketing-switch"
                checked={preferences.marketing}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, marketing: checked })
                }
                aria-label="Activer les cookies marketing"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setShowPreferences(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={savePreferences}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Enregistrer mes préférences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Hook to check cookie consent status
export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPreferences) {
      setConsent(JSON.parse(savedPreferences));
    }
  }, []);

  return {
    hasConsent: !!localStorage.getItem(COOKIE_CONSENT_KEY),
    preferences: consent,
    analyticsAllowed: consent?.analytics ?? false,
    marketingAllowed: consent?.marketing ?? false,
  };
};
