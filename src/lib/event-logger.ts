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

  const payload = {
    event_type: eventType,
    session_id: getSessionId(),
    page_path: options.pagePath ?? window.location.pathname,
    location: options.location ?? null,
    metadata: options.metadata ?? null,
  };

  // Fire and forget — never block UX on analytics
  void supabase
    .from("analytics_events")
    .insert(payload)
    .then(({ error }) => {
      if (error && import.meta.env.DEV) {
        console.warn("[Analytics] Failed to log event", eventType, error.message);
      }
    });
}