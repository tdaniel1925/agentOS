-- Setup pg_cron jobs for AgentOS
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/sql

-- IMPORTANT: Before running this, set these configuration values in Supabase Dashboard:
-- 1. Go to Project Settings > Configuration > Database
-- 2. Add custom config (if not already set):
--    app.supabase_functions_url = 'https://xxxtbzypheuiniuqynas.supabase.co/functions/v1'
--    app.service_role_key = 'YOUR_SERVICE_ROLE_KEY'

-- Or use the direct URLs without configuration (recommended for now)

-- 1. Process campaign emails every hour
SELECT cron.schedule(
  'process-campaign-emails',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://xxxtbzypheuiniuqynas.supabase.co/functions/v1/process-campaigns',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- 2. Send morning briefings at 6am CST (11am UTC)
SELECT cron.schedule(
  'send-morning-briefings',
  '0 11 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://xxxtbzypheuiniuqynas.supabase.co/functions/v1/send-morning-briefings',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- 3. Clean up expired pending approvals daily at 3am CST (8am UTC)
SELECT cron.schedule(
  'cleanup-expired-approvals',
  '0 8 * * *',
  $$
  DELETE FROM pending_approvals
  WHERE expires_at < NOW()
    AND approved_at IS NULL
    AND rejected_at IS NULL;
  $$
);

-- 4. Auto-resume paused control states when timer expires (every 15 minutes)
SELECT cron.schedule(
  'auto-resume-control-states',
  '*/15 * * * *',
  $$
  UPDATE control_states
  SET mode = 'full', paused_until = NULL, mode_expires_at = NULL
  WHERE mode IN ('paused', 'inbound-only', 'vacation')
    AND (paused_until < NOW() OR mode_expires_at < NOW());
  $$
);

-- Verify jobs were created
SELECT * FROM cron.job ORDER BY jobname;

-- To view job run history (after jobs have run):
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To unschedule a job if needed:
-- SELECT cron.unschedule('job-name-here');
