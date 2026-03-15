-- Campaign Scheduler and Automated Tasks
-- Sets up pg_cron jobs for recurring operations

-- NOTE: These jobs need to be created via Supabase SQL editor
-- because they reference runtime configuration
-- This file serves as documentation and can be run manually

-- 1. Process campaign emails every hour
SELECT cron.schedule(
  'process-campaign-emails',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_functions_url') || '/process-campaigns',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- 2. Send morning briefings at 6am CST (11am UTC)
SELECT cron.schedule(
  'send-morning-briefings',
  '0 11 * * *', -- Every day at 11:00 UTC (6am CST)
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_functions_url') || '/send-morning-briefings',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- 3. Send weekly scorecards every Monday at 7am CST (12pm UTC)
SELECT cron.schedule(
  'send-weekly-scorecards',
  '0 12 * * 1', -- Mondays at 12:00 UTC (7am CST)
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_functions_url') || '/send-weekly-scorecards',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- 4. Check renewal alerts on 1st of every month at 8am CST (1pm UTC)
SELECT cron.schedule(
  'check-renewal-alerts',
  '0 13 1 * *', -- 1st of month at 13:00 UTC (8am CST)
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_functions_url') || '/check-renewals',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- 5. Cost anomaly detection every hour at :30
SELECT cron.schedule(
  'check-cost-anomalies',
  '30 * * * *', -- Every hour at minute 30
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_functions_url') || '/check-cost-anomalies',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- 6. Clean up expired pending approvals daily at 3am CST (8am UTC)
SELECT cron.schedule(
  'cleanup-expired-approvals',
  '0 8 * * *', -- Every day at 08:00 UTC (3am CST)
  $$
  DELETE FROM pending_approvals
  WHERE expires_at < NOW()
    AND approved_at IS NULL
    AND rejected_at IS NULL;
  $$
);

-- 7. Auto-resume paused control states when timer expires (every 15 minutes)
SELECT cron.schedule(
  'auto-resume-control-states',
  '*/15 * * * *', -- Every 15 minutes
  $$
  UPDATE control_states
  SET mode = 'full', paused_until = NULL, mode_expires_at = NULL
  WHERE mode IN ('paused', 'inbound-only', 'vacation')
    AND (paused_until < NOW() OR mode_expires_at < NOW());
  $$
);

-- To view all scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('job-name-here');

-- To view job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
