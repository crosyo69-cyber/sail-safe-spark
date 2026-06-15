import { Component, lazy, type ComponentType, type ErrorInfo, type ReactNode } from "react";

const RELOAD_ATTEMPT_KEY = "kp-chunk-reload-attempt-at";
const LEGACY_RELOAD_KEY = "chunk-reload-attempt";
const RELOAD_COOLDOWN_MS = 12_000;

let recoveryStarted = false;

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return `${error.name} ${error.message}`;
  if (error && typeof error === "object") {
    const maybeError = error as { name?: unknown; message?: unknown; reason?: unknown };
    return [maybeError.name, maybeError.message, maybeError.reason]
      .filter(Boolean)
      .map(String)
      .join(" ");
  }
  return String(error ?? "");
};

export const isChunkLoadError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();

  return [
    "importing a module script failed",
    "failed to fetch dynamically imported module",
    "error loading dynamically imported module",
    "failed to load module script",
    "loading chunk",
    "chunkloaderror",
    "unable to preload",
  ].some((needle) => message.includes(needle));
};

export const isLovablePreviewHost = (): boolean => {
  if (typeof window === "undefined") return false;
  const { hostname } = window.location;
  return hostname.startsWith("id-preview--") || hostname.endsWith(".lovableproject.com");
};

const getLastReloadAttempt = (): number => {
  try {
    return Number(window.sessionStorage.getItem(RELOAD_ATTEMPT_KEY) || 0);
  } catch {
    return 0;
  }
};

const setReloadAttempt = (): void => {
  try {
    window.sessionStorage.setItem(RELOAD_ATTEMPT_KEY, String(Date.now()));
    window.sessionStorage.removeItem(LEGACY_RELOAD_KEY);
  } catch {
    // Storage may be unavailable in private or embedded preview contexts.
  }
};

export const clearChunkReloadAttempt = (): void => {
  try {
    window.sessionStorage.removeItem(RELOAD_ATTEMPT_KEY);
    window.sessionStorage.removeItem(LEGACY_RELOAD_KEY);
  } catch {
    // Ignore storage access failures.
  }
};

export const cleanupServiceWorkersAndCaches = async (): Promise<void> => {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
};

export const recoverFromChunkLoadError = async (error?: unknown): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  if (error && !isChunkLoadError(error)) return false;
  if (recoveryStarted) return true;

  const lastAttempt = getLastReloadAttempt();
  if (lastAttempt && Date.now() - lastAttempt < RELOAD_COOLDOWN_MS) {
    return false;
  }

  recoveryStarted = true;
  setReloadAttempt();

  try {
    await cleanupServiceWorkersAndCaches();
  } finally {
    window.location.reload();
  }

  return true;
};

export function lazyWithChunkRecovery<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch(async (error) => {
      if (isChunkLoadError(error)) {
        const willReload = await recoverFromChunkLoadError(error);
        if (willReload) {
          return new Promise<{ default: T }>(() => undefined);
        }
      }

      throw error;
    })
  );
}

type ChunkErrorBoundaryProps = {
  children: ReactNode;
};

type ChunkErrorBoundaryState = {
  hasChunkError: boolean;
};

export class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  state: ChunkErrorBoundaryState = { hasChunkError: false };

  static getDerivedStateFromError(error: unknown): ChunkErrorBoundaryState | null {
    if (isChunkLoadError(error)) {
      return { hasChunkError: true };
    }

    return null;
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    if (isChunkLoadError(error)) {
      void recoverFromChunkLoadError(error);
      return;
    }

    console.error("Application error", error, errorInfo);
  }

  render() {
    if (this.state.hasChunkError) {
      return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
          <section className="max-w-md space-y-4 text-center" aria-live="polite">
            <h1 className="text-2xl font-bold text-primary">Mise à jour en cours</h1>
            <p className="text-muted-foreground">
              La page doit être actualisée pour charger la dernière version du site.
            </p>
            <button
              type="button"
              className="min-h-11 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Actualiser la page
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}