-- ============ Phase 4.2 : triggers d'abord ============
DROP TRIGGER IF EXISTS trg_notify_session_closed ON public.sessions;
DROP TRIGGER IF EXISTS trg_notify_session_reopened ON public.sessions;
DROP TRIGGER IF EXISTS trg_session_cancellation ON public.sessions;
DROP TRIGGER IF EXISTS trg_validate_last_minute_label ON public.sessions;
DROP TRIGGER IF EXISTS validate_max_participants_trigger ON public.sessions;
DROP TRIGGER IF EXISTS validate_session_status_trigger ON public.sessions;

DROP TRIGGER IF EXISTS trg_enforce_capacity_reservations ON public.reservations;
DROP TRIGGER IF EXISTS trg_enforce_capacity_package_bookings ON public.package_bookings;
DROP TRIGGER IF EXISTS trg_autoclose_res ON public.reservations;
DROP TRIGGER IF EXISTS trg_autoclose_pkg ON public.package_bookings;

-- ============ Phase 4.2 : fonctions legacy ============
DROP FUNCTION IF EXISTS public.notify_session_closed();
DROP FUNCTION IF EXISTS public.notify_session_reopened();
DROP FUNCTION IF EXISTS public.handle_session_cancellation();
DROP FUNCTION IF EXISTS public.validate_last_minute_label();
DROP FUNCTION IF EXISTS public.validate_session_max_participants();
DROP FUNCTION IF EXISTS public.validate_session_status();
DROP FUNCTION IF EXISTS public.enforce_session_capacity();
DROP FUNCTION IF EXISTS public.auto_close_full_session();
DROP FUNCTION IF EXISTS public.book_session_with_code(text, uuid);
DROP FUNCTION IF EXISTS public.admin_get_session_extras(uuid[]);
DROP FUNCTION IF EXISTS public.auto_generate_sessions(integer);
DROP FUNCTION IF EXISTS public.auto_generate_sessions_monitored(integer, integer);
DROP FUNCTION IF EXISTS public.admin_grant_weather_credit_booking(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_slot_occupancy(date, time_slot);
DROP FUNCTION IF EXISTS public.get_slot_capacity(date, time_slot);

-- ============ Phase 4.2 : fonctions actives nettoyées ============
CREATE OR REPLACE FUNCTION public.notify_new_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_group public.daily_groups;
  v_label text;
BEGIN
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  SELECT * INTO v_group FROM public.daily_groups WHERE id = NEW.daily_group_id;
  v_label := COALESCE(NEW.first_name,'') || ' ' || COALESCE(NEW.last_name,'')
           || ' (' || COALESCE(NEW.email,'?') || ')';
  PERFORM public.enqueue_admin_notification(
    'booking_new', 'info',
    'Nouvelle réservation — ' || COALESCE(v_group.activity::text,'?'),
    v_label || ' · ' || COALESCE(to_char(v_group.date,'DD/MM/YYYY'),'?')
      || ' · ' || COALESCE(NEW.participants::text,'1') || ' pers.'
      || CASE WHEN NEW.stripe_session_id IS NOT NULL THEN ' · Paiement Stripe OK' ELSE '' END,
    jsonb_build_object(
      'reservation_id', NEW.id, 'daily_group_id', NEW.daily_group_id,
      'email', NEW.email, 'participants', NEW.participants,
      'stripe_session_id', NEW.stripe_session_id),
    'reservation:' || NEW.id::text
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_booking_with_code(p_code text, p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg_id uuid;
  v_date date;
BEGIN
  SELECT id INTO v_pkg_id FROM public.client_packages WHERE package_code = p_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  SELECT dg.date INTO v_date
    FROM public.package_bookings b
    LEFT JOIN public.daily_groups dg ON dg.id = b.daily_group_id
   WHERE b.id = p_booking_id AND b.package_id = v_pkg_id;
  IF NOT FOUND OR v_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found');
  END IF;

  IF v_date <= (CURRENT_DATE + interval '2 days')::date THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_late_to_cancel');
  END IF;

  UPDATE public.package_bookings
     SET status = 'cancelled', updated_at = now()
   WHERE id = p_booking_id AND status = 'confirmed';

  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_package_by_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_bookings JSONB;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages
   WHERE package_code = p_code LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'daily_group_id', b.daily_group_id,
    'status', b.status,
    'date', dg.date,
    'activity', dg.activity::text,
    'created_at', b.created_at
  ) ORDER BY dg.date), '[]'::jsonb)
  INTO v_bookings
  FROM public.package_bookings b
  LEFT JOIN public.daily_groups dg ON dg.id = b.daily_group_id
  WHERE b.package_id = v_pkg.id;

  RETURN jsonb_build_object(
    'id', v_pkg.id,
    'package_code', v_pkg.package_code,
    'first_name', v_pkg.first_name,
    'last_name', v_pkg.last_name,
    'email', v_pkg.email,
    'activity', v_pkg.activity,
    'package_type', v_pkg.package_type,
    'total_sessions', v_pkg.total_sessions,
    'used_sessions', v_pkg.used_sessions,
    'remaining_sessions', v_pkg.total_sessions - v_pkg.used_sessions,
    'status', v_pkg.status,
    'expires_at', v_pkg.expires_at,
    'deposit_amount', v_pkg.deposit_amount,
    'bookings', v_bookings
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_booking_confirmation(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_date_val date;
  v_activity_text text;
  v_activity_label text;
  v_date_str text;
  v_remaining int;
  v_html text;
  v_subject text;
BEGIN
  SELECT cp.* INTO v_pkg
    FROM public.package_bookings pb
    JOIN public.client_packages cp ON cp.id = pb.package_id
   WHERE pb.id = p_booking_id;
  IF NOT FOUND OR v_pkg.email IS NULL THEN RETURN; END IF;

  SELECT dg.date, dg.activity::text
    INTO v_date_val, v_activity_text
    FROM public.package_bookings pb
    LEFT JOIN public.daily_groups dg ON dg.id = pb.daily_group_id
   WHERE pb.id = p_booking_id;

  IF v_date_val IS NULL THEN RETURN; END IF;

  v_activity_label := CASE v_activity_text
    WHEN 'kitesurf' THEN 'Kitesurf'
    WHEN 'wingfoil' THEN 'Wingfoil'
    WHEN 'pumpfoil' THEN 'Pumpfoil'
    WHEN 'foil_tracte' THEN 'Foil tracté'
    WHEN 'stage_100_glisse' THEN 'Stage 100% Glisse'
    ELSE v_activity_text END;
  v_date_str := to_char(v_date_val, 'DD/MM/YYYY');
  v_remaining := v_pkg.total_sessions - v_pkg.used_sessions;

  v_subject := 'Réservation confirmée — ' || v_activity_label || ' du ' || v_date_str;
  v_html := concat(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
    '<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
    '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
    '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180" /></td></tr>',
    '<tr><td style="padding:32px 25px 0;">',
    '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Bonjour ', coalesce(v_pkg.first_name,''), ', votre journée est confirmée 🪁</h1>',
    '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">',
    'Nous avons bien enregistré votre inscription.',
    '</p></td></tr>',
    '<tr><td style="padding:0 25px 16px;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;">',
    '<tr><td style="padding:20px;">',
    '<p style="margin:0 0 6px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Activité</p>',
    '<p style="margin:0 0 14px;color:#0F172A;font-size:18px;font-weight:bold;">', v_activity_label, '</p>',
    '<p style="margin:0 0 6px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Date</p>',
    '<p style="margin:0 0 14px;color:#0F172A;font-size:16px;font-weight:600;">', v_date_str, '</p>',
    '<p style="margin:0 0 6px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Journées restantes</p>',
    '<p style="margin:0;color:#0891B2;font-size:24px;font-weight:bold;">', v_remaining, ' / ', v_pkg.total_sessions, '</p>',
    '</td></tr></table></td></tr>',
    '<tr><td style="padding:0 25px 16px;">',
    '<div style="background:#FEF3C7;border-left:4px solid #F97316;padding:14px 16px;border-radius:6px;">',
    '<p style="margin:0 0 6px;color:#0F172A;font-size:14px;font-weight:bold;">⏰ Horaire communiqué la veille</p>',
    '<p style="margin:0;color:#64748B;font-size:13px;line-height:1.5;">',
    'L''heure exacte de rendez-vous et le spot sont déterminés la veille selon les conditions ',
    'météorologiques (vent, mer, sécurité). Nous vous contacterons directement.',
    '</p></div></td></tr>',
    '<tr><td style="padding:0 25px 32px;">',
    '<p style="font-size:13px;color:#94A3B8;line-height:1.6;margin:0;">',
    'KiteSurf Passion — Hyères · 06 72 71 69 05',
    '</p></td></tr></table></body></html>'
  );

  PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
    'run_id', gen_random_uuid(),
    'message_id', gen_random_uuid(),
    'template_name', 'booking_confirmation',
    'to', v_pkg.email,
    'subject', v_subject,
    'html', v_html,
    'text', 'Bonjour ' || coalesce(v_pkg.first_name,'') || ', votre journée ' || v_activity_label
            || ' du ' || v_date_str || ' est confirmée. L''horaire vous sera communiqué la veille.'
  ));
END;
$function$;