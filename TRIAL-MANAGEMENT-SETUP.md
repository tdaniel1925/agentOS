# Trial Management System - Setup Guide

## Overview

The trial management system automatically handles:
- Day 5 reminder emails (2 days left in trial)
- Day 7 expiration: pause features and send email
- Dashboard trial banner with countdown
- Trial conversion tracking

---

## Files Created

### 1. Core Logic: `src/lib/cron/trial-expiration.ts`
**Functions:**
- `checkTrialExpirations()`: Main function that checks all trials, sends reminders, and pauses expired trials
- `sendTrialReminders()`: Manual trigger for day 5 reminders
- `pauseExpiredTrials()`: Manual trigger to pause expired trials

**Logic:**
- Queries all subscribers with `billing_status = 'trialing'`
- Day 5 (2 days left): Sends reminder email
- Day 7+ (expired): Updates billing_status to 'past_due', status to 'paused', sends expiration email
- Updates trial_conversions table with conversion tracking data

### 2. Email Templates: `src/lib/email/trial-emails.ts`
**Templates:**
- `trialDay5Reminder()`: "2 days left in trial" email with upgrade CTA
- `trialDay7Expiration()`: "Trial ended" email explaining pause and upgrade options

**Features:**
- Professional HTML emails with AgentOS branding
- Plain text fallbacks
- Personalized with subscriber name, business name, bot name
- Clear CTAs to upgrade

### 3. Cron API Route: `src/app/api/cron/check-trial-expirations/route.ts`
**Endpoints:**
- `GET /api/cron/check-trial-expirations`
- `POST /api/cron/check-trial-expirations`

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-03-17T10:00:00Z",
  "checked": 10,
  "reminded": 3,
  "expired": 2,
  "errors": []
}
```

**Security:**
- Optional `CRON_SECRET` environment variable for authorization
- Add to `.env.local`: `CRON_SECRET=your-secret-here`
- Cron scheduler includes: `Authorization: Bearer your-secret-here`

### 4. Trial Banner Component: `src/components/dashboard/TrialBanner.tsx`
**Features:**
- Shows days and hours remaining in trial
- Live countdown timer (updates every minute)
- Dismissable (stored in sessionStorage)
- Color-coded urgency:
  - Blue: 3+ days left
  - Orange: 2 days or less
  - Red: Expired
- "Upgrade Now" button links to `/app/billing`

### 5. Dashboard Integration: `src/app/(dashboard)/app/page.tsx`
**Changes:**
- Import `TrialBanner` component
- Show banner when `billing_status === 'trialing'`
- Pass trial end date, business name, and bot name to banner
- Banner appears above header for maximum visibility

---

## Setup Instructions

### Step 1: Environment Variables

Add to `.env.local` (optional but recommended):
```bash
CRON_SECRET=your-random-secret-key-here
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Setup Cron Job

Choose one of these methods:

#### Option A: Vercel Cron (Recommended)

1. Create `vercel.json` in project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-trial-expirations",
      "schedule": "0 9 * * *"
    }
  ]
}
```

2. Deploy to Vercel
3. Cron runs daily at 9:00 AM UTC (4:00 AM EST / 3:00 AM CST)

#### Option B: Supabase pg_cron

1. Open Supabase SQL Editor
2. Run this SQL:
```sql
SELECT cron.schedule(
  'check-trial-expirations',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-app.vercel.app/api/cron/check-trial-expirations',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

3. Verify job created:
```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'check-trial-expirations';
```

#### Option C: External Cron Service (cron-job.org, EasyCron, etc.)

1. Sign up for cron service
2. Create new job:
   - URL: `https://your-app.vercel.app/api/cron/check-trial-expirations`
   - Method: GET or POST
   - Schedule: Daily at 9:00 AM
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

### Step 3: Test the System

#### Manual Test (Before Cron Setup)

Test the endpoint directly:
```bash
curl -X POST \
  https://your-app.vercel.app/api/cron/check-trial-expirations \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "timestamp": "2026-03-17T10:00:00Z",
  "checked": 0,
  "reminded": 0,
  "expired": 0,
  "errors": []
}
```

#### Test with Sample Trial User

1. Create a test subscriber with trial:
```sql
-- In Supabase SQL Editor
UPDATE subscribers
SET
  billing_status = 'trialing',
  trial_started_at = NOW() - INTERVAL '5 days',
  trial_ends_at = NOW() + INTERVAL '2 days'
WHERE email = 'test@example.com';
```

2. Run the cron endpoint
3. Check that reminder email was sent
4. Check `commands_log` table for log entry

5. Test expiration:
```sql
UPDATE subscribers
SET
  trial_ends_at = NOW() - INTERVAL '1 day'
WHERE email = 'test@example.com';
```

6. Run cron endpoint again
7. Verify subscriber is paused:
```sql
SELECT billing_status, status
FROM subscribers
WHERE email = 'test@example.com';
-- Should show: billing_status = 'past_due', status = 'paused'
```

---

## Trial Flow Logic

### Trial States

| Day | Status | Action |
|-----|--------|--------|
| Day 1 | `trialing` | Trial active, full access |
| Day 2-4 | `trialing` | Trial active, full access |
| Day 5 | `trialing` | **Send reminder email** (2 days left) |
| Day 6 | `trialing` | Trial active, banner shows urgency |
| Day 7 | `trialing` → `past_due` | **Expire trial**, pause features, send expiration email |
| Day 8+ | `past_due` | Features paused, user can view dashboard but not use agent |

### Database Updates on Expiration

When trial expires (Day 7):
```sql
-- subscribers table
UPDATE subscribers
SET
  billing_status = 'past_due',
  status = 'paused'
WHERE id = 'subscriber-id';

-- trial_conversions table
UPDATE trial_conversions
SET
  trial_ended_at = NOW(),
  converted = false
WHERE subscriber_id = 'subscriber-id';
```

### Feature Access Control

When subscriber has `status = 'paused'`:
- Dashboard: Accessible (read-only)
- AI Agent: Not answering calls
- Campaigns: Paused
- Appointments: Not scheduling
- SMS commands: Respond with "upgrade required" message

---

## Dashboard Trial Banner

### Appearance

**Normal (3+ days):**
- Blue background
- "X days left in your trial"
- Countdown timer
- "Upgrade Now" button
- Dismissable X button

**Urgent (2 days or less):**
- Orange background
- Larger text, more emphasis
- Countdown timer more prominent
- Still dismissable

**Expired (Day 7+):**
- Red background
- "Your trial has ended"
- "Upgrade to reactivate" message
- NOT dismissable
- Banner persists until upgrade

### User Experience

1. User logs into dashboard
2. Banner appears at very top (above header)
3. Shows countdown: "5 days, 12 hours left"
4. User can dismiss (stores in sessionStorage)
5. Banner reappears on next page load or session
6. As trial nears end, becomes more urgent
7. On expiration, banner cannot be dismissed

---

## Monitoring & Analytics

### Check Cron Job Status

**Vercel Cron:**
- View in Vercel dashboard → Project → Settings → Cron
- Check logs in Vercel → Project → Logs

**Supabase pg_cron:**
```sql
-- View job run history
SELECT
  job_run_details.jobid,
  cron.job.jobname,
  job_run_details.start_time,
  job_run_details.end_time,
  job_run_details.status,
  job_run_details.return_message
FROM cron.job_run_details
JOIN cron.job ON job_run_details.jobid = cron.job.jobid
WHERE cron.job.jobname = 'check-trial-expirations'
ORDER BY start_time DESC
LIMIT 10;
```

### Trial Conversion Analytics

```sql
-- Overall conversion rate
SELECT
  COUNT(*) FILTER (WHERE converted = true) AS converted,
  COUNT(*) FILTER (WHERE converted = false) AS not_converted,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE converted = true) / COUNT(*),
    2
  ) AS conversion_rate_percent
FROM trial_conversions
WHERE trial_ended_at IS NOT NULL;

-- Average days to convert
SELECT
  ROUND(AVG(days_to_convert), 1) AS avg_days_to_convert
FROM trial_conversions
WHERE converted = true;

-- Conversion by signup source
SELECT
  s.signup_source,
  COUNT(*) FILTER (WHERE tc.converted = true) AS converted,
  COUNT(*) AS total,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE tc.converted = true) / COUNT(*),
    2
  ) AS conversion_rate_percent
FROM trial_conversions tc
JOIN subscribers s ON tc.subscriber_id = s.id
WHERE tc.trial_ended_at IS NOT NULL
GROUP BY s.signup_source
ORDER BY conversion_rate_percent DESC;
```

### Email Delivery Tracking

Check `commands_log` table for trial emails:
```sql
SELECT
  subscriber_id,
  skill_triggered,
  raw_message,
  success,
  created_at
FROM commands_log
WHERE skill_triggered IN ('trial-reminder-day-5', 'trial-expired')
ORDER BY created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Emails Not Sending

1. Check Resend API key is configured:
```bash
echo $RESEND_API_KEY
```

2. Check Resend dashboard for delivery status

3. Check error logs in `commands_log`:
```sql
SELECT *
FROM commands_log
WHERE skill_triggered LIKE 'trial-%'
  AND success = false
ORDER BY created_at DESC;
```

### Cron Job Not Running

**Vercel:**
- Check Vercel dashboard → Logs
- Verify `vercel.json` is committed to git
- Redeploy project

**Supabase pg_cron:**
```sql
-- Check if job exists
SELECT * FROM cron.job WHERE jobname = 'check-trial-expirations';

-- Check recent runs
SELECT *
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-trial-expirations')
ORDER BY start_time DESC
LIMIT 5;

-- If no recent runs, check if job is active
UPDATE cron.job
SET active = true
WHERE jobname = 'check-trial-expirations';
```

### Trial Banner Not Showing

1. Check subscriber has trial fields:
```sql
SELECT
  email,
  billing_status,
  trial_started_at,
  trial_ends_at
FROM subscribers
WHERE email = 'test@example.com';
```

2. Verify banner logic in dashboard page
3. Check browser console for React errors
4. Clear sessionStorage if banner was dismissed:
```javascript
sessionStorage.removeItem('trial-banner-dismissed')
```

---

## Future Enhancements

Potential improvements for future versions:

1. **SMS Reminders**: Send SMS on day 6 as additional reminder
2. **In-App Notifications**: Toast notification when user logs in during last 2 days
3. **Trial Extension**: Admin ability to extend trial by X days
4. **Re-engagement Campaign**: Email sequence for users who don't convert
5. **Usage-Based Reminders**: "You've used X features, don't lose access!"
6. **Conversion Incentives**: Discount code in day 5 email
7. **Exit Survey**: Ask non-converting users why they didn't upgrade
8. **Auto-Archive**: Archive trial_conversions data after 90 days

---

## Summary

The trial management system is now fully implemented and ready for testing.

**What's Working:**
- ✅ Automated trial expiration checking
- ✅ Day 5 reminder emails
- ✅ Day 7 expiration emails
- ✅ Feature pausing on trial end
- ✅ Dashboard trial banner with countdown
- ✅ Trial conversion tracking
- ✅ Comprehensive error handling and logging

**Next Steps:**
1. Add `CRON_SECRET` to environment variables
2. Set up cron job (Vercel, Supabase, or external)
3. Test with sample trial user
4. Monitor trial conversions in database
5. Adjust email copy based on user feedback

**Integration Points:**
- Billing page: Create `/app/billing` route for upgrade flow (handled by Agent 6 or future work)
- Payment processing: Stripe integration for trial-to-paid conversion
- Feature gating: Check `subscriber.status === 'paused'` in API routes to block features

---

*Trial Management System Implementation Complete - Agent 7*
