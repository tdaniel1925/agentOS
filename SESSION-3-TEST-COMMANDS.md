# Session 3 - Test Commands Guide

## Prerequisites
1. ✅ Migrations applied (004, 005, 006)
2. ✅ Edge Functions deployed (process-campaigns, send-morning-briefings)
3. ⚠️  pg_cron jobs need manual setup via Supabase SQL Editor
4. Need: Active subscriber with valid SMS control number

## Setup pg_cron Jobs

1. Go to: https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/sql
2. Copy and run: `supabase/setup-cron-jobs.sql`
3. Verify jobs created: `SELECT * FROM cron.job ORDER BY jobname;`

## Test Commands via SMS

Send these commands to your control number: **+1 (651) 728-7626**

### 1. Campaign Creation
```
Create a 6 month campaign for John Smith at john@test.com about life insurance. Send every 4 days.
```

**Expected:**
- Immediate SMS: "Creating John Smith's campaign now. This takes about 60 seconds..."
- 60s later: Preview email sent to your email
- SMS: "Campaign for John Smith ready! Check your email for preview #1..."

**Approval:**
```
YES
```

**Expected:**
- SMS: "Campaign for John Smith approved! First email sends in 4 days. I'll handle the rest."
- Check Supabase: `campaigns` table should have status='active'
- Check: `campaign_emails` table should have 45 emails with scheduled times

### 2. Social Media Posts
```
Create 3 posts about life insurance for this week
```

**Expected:**
- Immediate SMS: "Creating 3 posts about life insurance for this week now..."
- 30s later: SMS with post 1 preview
- "Reply APPROVE to schedule or EDIT to change."

**Approval:**
```
APPROVE
```

**Expected:**
- Post 1 scheduled
- Immediate SMS with post 2 preview
- Repeat for all 3 posts

### 3. Lead Generation
```
Find 50 insurance agents in Dallas, TX
```

**Expected:**
- Immediate SMS: "Building your lead list — I'll text you when ready. Usually takes 2-3 minutes."
- 2-3 min later: Email with lead list (CSV format)
- SMS: "Lead list ready! Found [N] prospects in Dallas, TX. Check your email..."

**Verify:**
- Check email for lead list table
- Check Supabase: `contacts` table should have new leads

### 4. Email Connect (Placeholder)
```
Connect email
```

**Expected:**
- SMS: "Email inbox checking is a premium feature. Contact support to enable it."
- (Full OAuth implementation needed)

### 5. Email Check (Placeholder)
```
Check my emails
```

**Expected:**
- SMS: "Your email isn't connected yet. Reply CONNECT EMAIL to set it up."

### 6. Campaign Management
```
Pause campaign for John
```

**Expected:**
- SMS: "Campaign for John Smith paused. Reply RESUME CAMPAIGN to continue."

**Resume:**
```
Resume campaign
```

### 7. Social Report
```
Social report
```

**Expected:**
- SMS showing scheduled/published post counts

### 8. Lead Follow-Up
```
Follow up leads
```

**Expected:**
- SMS: "You have [N] new leads waiting. Want me to create a campaign for all of them? Reply YES."

## Manual Testing

### Test Edge Functions Directly

**Process Campaigns:**
```bash
curl -X POST \
  https://xxxtbzypheuiniuqynas.supabase.co/functions/v1/process-campaigns \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Morning Briefings:**
```bash
curl -X POST \
  https://xxxtbzypheuiniuqynas.supabase.co/functions/v1/send-morning-briefings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Check Database Tables

Run in Supabase SQL Editor:

```sql
-- Verify Session 3 tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'pending_approvals',
    'scheduled_posts',
    'contacts',
    'email_connections',
    'email_summaries'
  );

-- Check campaigns
SELECT id, prospect_name, status, emails_sent, sequence_length
FROM campaigns
ORDER BY created_at DESC
LIMIT 5;

-- Check campaign emails
SELECT ce.id, ce.sequence_number, ce.subject, ce.status, ce.scheduled_at
FROM campaign_emails ce
JOIN campaigns c ON c.id = ce.campaign_id
ORDER BY ce.created_at DESC
LIMIT 10;

-- Check contacts/leads
SELECT name, email, business_name, source, qualification_score, status
FROM contacts
ORDER BY created_at DESC
LIMIT 10;

-- Check scheduled posts
SELECT id, post_text, platforms, scheduled_at, status
FROM scheduled_posts
ORDER BY created_at DESC
LIMIT 5;

-- Check pending approvals
SELECT id, approval_type, created_at, expires_at
FROM pending_approvals
WHERE approved_at IS NULL
ORDER BY created_at DESC;
```

## Resend Webhook Testing

1. Go to Resend Dashboard: https://resend.com/webhooks
2. Add webhook URL: `https://theapexbots.com/api/webhooks/resend`
3. Select events: email.opened, email.clicked, email.bounced, email.complained
4. Send test campaign email to verify tracking

## Troubleshooting

### Campaign emails not sending
- Check `campaign_emails` table: status should be 'pending', scheduled_at should be in past
- Manually trigger: Run process-campaigns edge function
- Check Supabase logs for errors

### SMS not received
- Verify Twilio webhook is configured: `https://theapexbots.com/api/webhooks/twilio`
- Check Twilio logs for delivery status
- Verify phone number format (+1 country code)

### Edge Function errors
- Check Supabase Function Logs: https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/functions
- Verify environment variables are set
- Check function invocation limits

### pg_cron jobs not running
- Verify jobs are scheduled: `SELECT * FROM cron.job;`
- Check job run history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
- Verify pg_cron extension is enabled

## Next Steps

After testing Session 3 features:
1. Proceed to Session 4 - Commission Engine
2. Or fix any issues found during testing
3. Deploy to production when ready
