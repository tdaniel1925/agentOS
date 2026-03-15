# pg_cron Jobs Setup Guide

## Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor
Go to: **https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/sql**

### Step 2: Copy & Run Each Job

#### Job 1: Process Campaign Emails (Every Hour)
```sql
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
```

#### Job 2: Morning Briefings (Daily at 6am CST / 11am UTC)
```sql
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
```

#### Job 3: Cleanup Expired Approvals (Daily at 3am CST / 8am UTC)
```sql
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
```

#### Job 4: Auto-Resume Control States (Every 15 minutes)
```sql
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
```

### Step 3: Verify Jobs Were Created
```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
ORDER BY jobname;
```

You should see 4 jobs listed.

### Step 4: Check Job Run History (After Jobs Run)
```sql
SELECT
  job_run_details.jobid,
  cron.job.jobname,
  job_run_details.start_time,
  job_run_details.end_time,
  job_run_details.status,
  job_run_details.return_message
FROM cron.job_run_details
JOIN cron.job ON job_run_details.jobid = cron.job.jobid
ORDER BY start_time DESC
LIMIT 20;
```

## Troubleshooting

### If pg_cron extension is not enabled:
```sql
-- Check if enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- If not enabled, you may need to contact Supabase support
-- pg_cron should be available on all Supabase projects
```

### If net.http_post is not available:
```sql
-- Check if pg_net is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Enable if needed (should already be enabled from Session 0)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### To Remove/Update a Job:
```sql
-- Remove a job
SELECT cron.unschedule('job-name-here');

-- Then re-create it with new settings
```

### To Manually Test Edge Functions:
```bash
# Test process-campaigns
curl -X POST \
  https://xxxtbzypheuiniuqynas.supabase.co/functions/v1/process-campaigns \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test morning-briefings
curl -X POST \
  https://xxxtbzypheuiniuqynas.supabase.co/functions/v1/send-morning-briefings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Cron Schedule Reference
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)

Examples:
0 * * * *      → Every hour at minute 0
0 11 * * *     → Every day at 11:00 UTC (6am CST)
*/15 * * * *   → Every 15 minutes
0 8 * * *      → Every day at 8:00 UTC (3am CST)
```

## What Each Job Does

### 1. process-campaign-emails (Hourly)
- Finds all campaign emails with `status='pending'` and `scheduled_at <= NOW()`
- Sends them via Resend API
- Updates email status to 'sent'
- Updates campaign statistics
- Logs costs

### 2. send-morning-briefings (Daily 6am CST)
- Gets all active subscribers
- Generates personalized briefing for each
- Includes overnight recap, today's schedule, items needing attention
- Sends via SMS

### 3. cleanup-expired-approvals (Daily 3am CST)
- Removes pending approvals that have expired (> 48 hours old)
- Keeps database clean
- Only removes unapproved/unrejected items

### 4. auto-resume-control-states (Every 15 min)
- Checks for control states with expired timers
- Auto-resumes paused bots when duration expires
- Handles vacation mode end dates
- Ensures bots don't stay paused longer than intended

---

## ✅ You're Done!

Once these 4 jobs are created, your AgentOS platform will:
- ✅ Send campaign emails automatically on schedule
- ✅ Send daily morning briefings to all subscribers
- ✅ Clean up expired approvals automatically
- ✅ Auto-resume paused bots when timers expire

**Next:** Test the system with SMS commands from `SESSION-3-TEST-COMMANDS.md`
