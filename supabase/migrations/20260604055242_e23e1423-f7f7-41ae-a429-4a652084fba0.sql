
-- 1) Credit history table
CREATE TABLE public.package_credit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  delta int NOT NULL,
  kind text NOT NULL CHECK (kind IN ('initial','booking','cancellation','admin_credit','admin_debit')),
  reason text NOT NULL,
  booking_id uuid REFERENCES public.package_bookings(id) ON DELETE SET NULL,
  performed_by uuid,
  balance_after int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pch_package_id_created ON public.package_credit_history(package_id, created_at DESC);

GRANT SELECT, INSERT ON public.package_credit_history TO authenticated;
GRANT ALL ON public.package_credit_history TO service_role;

ALTER TABLE public.package_credit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all credit history"
  ON public.package_credit_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert credit history"
  ON public.package_credit_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Helper: enqueue a low-credit warning email
CREATE OR REPLACE FUNCTION public.enqueue_low_credit_warning(p_package_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.client_packages;
  v_html text;
  v_subject text;
  v_msg_id uuid := gen_random_uuid();
  v_run_id uuid := gen_random_uuid();
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages WHERE id = p_package_id;
  IF NOT FOUND OR v_pkg.email IS NULL THEN RETURN; END IF;

  v_subject := 'Plus qu''1 session restante sur votre pack ' || v_pkg.activity || ' 🪁';

  v_html := concat(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
    '<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
    '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
    '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180" /></td></tr>',
    '<tr><td style="padding:32px 25px 0;">',
    '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Bonjour ', coalesce(v_pkg.first_name,''), ', il ne vous reste qu''1 session !</h1>',
    '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">',
    'Votre pack <strong>', v_pkg.package_type, '</strong> arrive bientôt à son terme. ',
    'Pour continuer à progresser sans interruption, prolongez l''aventure avec un nouveau pack.',
    '</p></td></tr>',
    '<tr><td style="padding:0 25px 24px;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0891B2,#0F172A);border-radius:12px;">',
    '<tr><td style="padding:20px;text-align:center;">',
    '<p style="margin:0 0 8px;color:#bae6fd;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Votre code</p>',
    '<p style="margin:0 0 14px;color:#fff;font-size:24px;font-weight:bold;letter-spacing:3px;font-family:Menlo,monospace;">', v_pkg.package_code, '</p>',
    '<a href="https://www.kitesurfpassion.fr/tarifs" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;">Racheter un pack</a>',
    '</td></tr></table></td></tr>',
    '<tr><td style="background:#0F172A;padding:16px 25px;text-align:center;">',
    '<p style="font-size:12px;color:#94a3b8;margin:0;">📍 Spot de l''Almanarre, Hyères · Première école du Var depuis 1999</p>',
    '</td></tr></table></body></html>'
  );

  PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
    'run_id', v_run_id,
    'message_id', v_msg_id,
    'to', v_pkg.email,
    'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
    'sender_domain', 'kitesurfpassion.fr',
    'subject', v_subject,
    'html', v_html,
    'text', 'Bonjour, il ne vous reste qu''1 session sur votre pack. Rachetez un pack sur https://www.kitesurfpassion.fr/tarifs',
    'purpose', 'transactional',
    'label', 'low-credit-warning',
    'queued_at', now()
  ));

  INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
  VALUES (v_msg_id::text, 'low-credit-warning', v_pkg.email, 'pending');
END;
$$;

-- 3) Extend sync trigger to log history + warn at 1 remaining
CREATE OR REPLACE FUNCTION public.sync_package_used_sessions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_pkg public.client_packages;
  v_delta int := 0;
  v_kind text;
  v_booking_id uuid;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    v_delta := -1; v_kind := 'booking'; v_booking_id := NEW.id;
    UPDATE public.client_packages SET used_sessions = used_sessions + 1
      WHERE id = NEW.package_id RETURNING * INTO v_pkg;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
      v_delta := 1; v_kind := 'cancellation'; v_booking_id := NEW.id;
      UPDATE public.client_packages SET used_sessions = GREATEST(used_sessions - 1, 0)
        WHERE id = NEW.package_id RETURNING * INTO v_pkg;
    ELSIF OLD.status = 'cancelled' AND NEW.status = 'confirmed' THEN
      v_delta := -1; v_kind := 'booking'; v_booking_id := NEW.id;
      UPDATE public.client_packages SET used_sessions = used_sessions + 1
        WHERE id = NEW.package_id RETURNING * INTO v_pkg;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    v_delta := 1; v_kind := 'cancellation'; v_booking_id := OLD.id;
    UPDATE public.client_packages SET used_sessions = GREATEST(used_sessions - 1, 0)
      WHERE id = OLD.package_id RETURNING * INTO v_pkg;
  END IF;

  IF v_delta <> 0 AND v_pkg.id IS NOT NULL THEN
    INSERT INTO public.package_credit_history
      (package_id, delta, kind, reason, booking_id, balance_after)
    VALUES
      (v_pkg.id, v_delta, v_kind,
       CASE v_kind WHEN 'booking' THEN 'Inscription à une session'
                   WHEN 'cancellation' THEN 'Annulation d''une session' END,
       v_booking_id,
       v_pkg.total_sessions - v_pkg.used_sessions);

    -- Warn when exactly 1 remaining after a debit
    IF v_delta < 0 AND (v_pkg.total_sessions - v_pkg.used_sessions) = 1 THEN
      PERFORM public.enqueue_low_credit_warning(v_pkg.id);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4) Seed initial credit history rows for existing packages (one-time backfill)
INSERT INTO public.package_credit_history (package_id, delta, kind, reason, balance_after, created_at)
SELECT id, total_sessions, 'initial', 'Achat du pack initial', total_sessions - used_sessions, created_at
FROM public.client_packages
WHERE NOT EXISTS (
  SELECT 1 FROM public.package_credit_history h WHERE h.package_id = client_packages.id AND h.kind = 'initial'
);

-- 5) Admin RPC to manually adjust credits with mandatory reason
CREATE OR REPLACE FUNCTION public.admin_adjust_package_credits(
  p_package_id uuid,
  p_delta int,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.client_packages;
  v_kind text;
  v_caller uuid := auth.uid();
BEGIN
  IF NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'delta_zero';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  SELECT * INTO v_pkg FROM public.client_packages WHERE id = p_package_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'package_not_found'; END IF;

  IF p_delta > 0 THEN
    -- Credit added: increase total_sessions
    v_kind := 'admin_credit';
    UPDATE public.client_packages
       SET total_sessions = total_sessions + p_delta,
           status = CASE WHEN status = 'completed' THEN 'active' ELSE status END,
           updated_at = now()
     WHERE id = p_package_id RETURNING * INTO v_pkg;
  ELSE
    -- Debit: increase used_sessions (cannot exceed total)
    v_kind := 'admin_debit';
    IF v_pkg.total_sessions - v_pkg.used_sessions + p_delta < 0 THEN
      RAISE EXCEPTION 'insufficient_credits';
    END IF;
    UPDATE public.client_packages
       SET used_sessions = used_sessions + (-p_delta),
           updated_at = now()
     WHERE id = p_package_id RETURNING * INTO v_pkg;
  END IF;

  INSERT INTO public.package_credit_history
    (package_id, delta, kind, reason, performed_by, balance_after)
  VALUES
    (p_package_id, p_delta, v_kind, trim(p_reason), v_caller,
     v_pkg.total_sessions - v_pkg.used_sessions);

  -- Trigger warning on manual debit if hitting 1
  IF p_delta < 0 AND (v_pkg.total_sessions - v_pkg.used_sessions) = 1 THEN
    PERFORM public.enqueue_low_credit_warning(v_pkg.id);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'remaining', v_pkg.total_sessions - v_pkg.used_sessions,
    'total', v_pkg.total_sessions,
    'used', v_pkg.used_sessions
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_adjust_package_credits(uuid, int, text) TO authenticated;
