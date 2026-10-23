CREATE TABLE public.sms_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'appointment',
  status text NOT NULL DEFAULT 'prepared',
  date date NOT NULL,
  activity activity_type NULL,
  daily_group_id uuid NULL REFERENCES public.daily_groups(id),
  reservation_id uuid NULL,
  recipient_name text NULL,
  phone_last4 text NULL,
  message text NOT NULL,
  dedupe_key text NOT NULL,
  message_id text NULL,
  is_resend boolean NOT NULL DEFAULT false,
  error text NULL,
  sent_by uuid NULL,
  sent_by_email text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sms_send_log_status_check CHECK (status IN ('prepared','sending','sent','delivered','failed','unknown'))
);

GRANT SELECT, INSERT, UPDATE ON public.sms_send_log TO authenticated;
GRANT ALL ON public.sms_send_log TO service_role;

ALTER TABLE public.sms_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read sms_send_log"
  ON public.sms_send_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sms_send_log"
  ON public.sms_send_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sms_send_log"
  ON public.sms_send_log FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anti-doublon en base : un seul envoi actif (préparé, en cours, envoyé ou
-- incertain) par clé ; un échec explicite peut être retenté, un renvoi
-- manuel explicite (is_resend = true) est toujours possible et journalisé.
CREATE UNIQUE INDEX sms_send_log_dedupe_active_uidx
  ON public.sms_send_log (dedupe_key)
  WHERE is_resend = false AND status IN ('prepared','sending','sent','unknown');

CREATE INDEX sms_send_log_date_idx ON public.sms_send_log (date);