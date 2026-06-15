import {
  cleanupServiceWorkersAndCaches,
  clearChunkReloadAttempt,
  isChunkLoadError,
  isLovablePreviewHost,
  recoverFromChunkLoadError,
} from "./chunk-recovery";

export function registerServiceWorker() {
  // Auto-reload once when a lazy chunk fails to load (typically after a new deploy
  // where the old hashed chunk no longer exists on the server).
  if (typeof window !== 'undefined') {
    // Clear the reload flag once the app has successfully loaded a fresh build
    window.addEventListener('load', () => {
      clearChunkReloadAttempt();
    });

    window.addEventListener('error', (event) => {
      if (isChunkLoadError(event?.error || event?.message)) {
        void recoverFromChunkLoadError(event?.error || event?.message);
      }
    });

    // Dynamic import failures often surface as unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (isChunkLoadError(event?.reason)) {
        event.preventDefault();
        void recoverFromChunkLoadError(event?.reason);
      }
    });
  }

  if ('serviceWorker' in navigator && import.meta.env.PROD && !isLovablePreviewHost()) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, show update notification if needed
                console.log('New content available, refresh to update.');
              }
            });
          }
        });

        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  } else if ('serviceWorker' in navigator && isLovablePreviewHost()) {
    window.addEventListener('load', () => {
      void cleanupServiceWorkersAndCaches();
    });
  }
}
