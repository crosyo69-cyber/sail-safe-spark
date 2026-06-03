export function registerServiceWorker() {
  // Auto-reload once when a lazy chunk fails to load (typically after a new deploy
  // where the old hashed chunk no longer exists on the server).
  if (typeof window !== 'undefined') {
    const RELOAD_KEY = 'chunk-reload-attempt';
    window.addEventListener('error', (event) => {
      const msg = String(event?.message || '');
      if (
        msg.includes('Importing a module script failed') ||
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('error loading dynamically imported module')
      ) {
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, '1');
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((regs: readonly ServiceWorkerRegistration[]) => {
              regs.forEach((r) => r.unregister());
              const reload = () => location.reload();
              if ('caches' in window) {
                caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
                  .finally(reload);
              } else {
                reload();
              }
            });
          } else {
            window.location.reload();
          }
        }
      }
    });
  }

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
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
  }
}
