CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id BIGINT;
  v_payload jsonb := payload;
  v_is_otp boolean;
BEGIN
  -- C-2.2-D-FIX : un e-mail OTP ne doit jamais persister son secret en quarantaine.
  v_is_otp := coalesce(v_payload->>'label', '') = 'otp_code'
           OR coalesce(v_payload->>'template_name', '') = 'otp_code'
           OR coalesce(v_payload->>'message_id', '') LIKE 'otp-%';

  IF v_is_otp THEN
    v_payload := jsonb_build_object(
      'message_id',      v_payload->'message_id',
      'label',           'otp_code',
      'template_name',   'otp_code',
      'to',              v_payload->'to',
      'purpose',         v_payload->'purpose',
      'queued_at',       v_payload->'queued_at',
      'dlq_redacted',    true,
      'dlq_redacted_at', to_jsonb(now()),
      -- un code OTP est valable 10 min : tout renvoi est inutile.
      -- On sature le compteur pour que retry_dlq_messages ignore ce message.
      'dlq_retry_count', 999
    );
  END IF;

  SELECT pgmq.send(dlq_name, v_payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
END;
$function$;