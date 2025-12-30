import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed) return;

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Show iOS instructions after delay
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Handle beforeinstallprompt for Android/Desktop
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-xl p-4 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-turquoise rounded-xl flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-primary-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-foreground text-sm sm:text-base">
            Installer KiteSurf Passion
          </h3>
          {isIOS ? (
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Appuyez sur{" "}
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                Partager
              </span>{" "}
              puis "Sur l'écran d'accueil"
            </p>
          ) : (
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Accédez rapidement à nos cours et tarifs
            </p>
          )}

          {/* Actions */}
          {!isIOS && deferredPrompt && (
            <Button
              size="sm"
              onClick={handleInstall}
              className="mt-3 gap-2"
            >
              <Download className="w-4 h-4" />
              Installer
            </Button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
