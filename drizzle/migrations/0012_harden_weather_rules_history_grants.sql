-- F-29-05-W: history is append-only; service_role keeps SELECT/INSERT only.
-- TRUNCATE is revoked too because row-level triggers do not block it.
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.weather_activity_rules_history FROM service_role;