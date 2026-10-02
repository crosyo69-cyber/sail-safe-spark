
GRANT USAGE ON SCHEMA pgmq TO service_role;
GRANT USAGE ON SCHEMA cron TO service_role;
GRANT EXECUTE ON FUNCTION pgmq.metrics_all() TO service_role;
GRANT SELECT ON cron.job TO service_role;
