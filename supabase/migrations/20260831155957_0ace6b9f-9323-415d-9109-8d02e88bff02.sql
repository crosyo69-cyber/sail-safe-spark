-- ============================================================
-- SECURITY HARDENING — ANON ACL — F-01 → F-04
-- Aucune modification de policy RLS, RPC, vue (hors revoke), trigger, cron.
-- ============================================================

-- ------------------------------------------------------------
-- F-01 — Suppression des privilèges résiduels TRUNCATE/REFERENCES/TRIGGER/MAINTAIN (Dxtm) pour anon
-- ------------------------------------------------------------
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE
  public.admin_notifications,
  public.analytics_events,
  public.blog_comments,
  public.client_packages,
  public.credit_audit_log,
  public.credit_reminder_preferences,
  public.daily_groups,
  public.daily_waitlist,
  public.email_send_log,
  public.email_send_state,
  public.email_unsubscribe_tokens,
  public.last_minute_subscribers,
  public.package_bookings,
  public.package_credit_history,
  public.page_404_logs,
  public.profiles,
  public.reservations,
  public.session_credits,
  public.session_generation_runs,
  public.suppressed_emails,
  public.user_roles,
  public.weather_alert_subscriptions
FROM anon;

-- ------------------------------------------------------------
-- F-02 — Retrait du GRANT ALL de anon sur la vue client_credit_wallet
-- (définition de la vue et security_invoker inchangés)
-- ------------------------------------------------------------
REVOKE ALL ON public.client_credit_wallet FROM anon;

-- ------------------------------------------------------------
-- F-03 — INSERT résiduels anon sans policy correspondante
-- ------------------------------------------------------------
REVOKE INSERT ON public.session_credits FROM anon;
REVOKE INSERT ON public.suppressed_emails FROM anon;
REVOKE INSERT ON public.session_generation_runs FROM anon;

-- ------------------------------------------------------------
-- F-04 — DELETE résiduels anon sans policy correspondante
-- ------------------------------------------------------------
REVOKE DELETE ON public.email_unsubscribe_tokens FROM anon;
REVOKE DELETE ON public.last_minute_subscribers FROM anon;