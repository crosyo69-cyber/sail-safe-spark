import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ksp_analytics_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
        `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

type EventType = "page_view" | "phone_click" | "form_submit";

export function logAnalyticsEvent(
  eventType: EventType,
  options: {
    location?: string;
    pagePath?: string;
    metadata?: Record<string, unknown>;
  } = {},
): void {
  if (typeof window === "undefined") return;

  // F-23-06 : ingestion via RPC serveur (validation + rate limit côté base).
  // Le client n'écrit plus directement dans analytics_events.
  void supabase
    .rpc("log_analytics_event", {
      p_event_type: eventType,
      p_session_id: getSessionId(),
      p_page_path: options.pagePath ?? window.location.pathname,
      p_location: options.location ?? null,
      p_metadata: (options.metadata ?? null) as never,
    })
    .then(({ error }) => {
      if (error && import.meta.env.DEV) {
        console.warn("[Analytics] Failed to log event", eventType, error.message);
      }
    });
}