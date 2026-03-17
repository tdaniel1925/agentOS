-- Test Script for Trial Management System
-- Run these queries in Supabase SQL Editor to test trial functionality

-- =====================================================
-- SETUP: Create Test Trial User
-- =====================================================

-- Option 1: Create new test subscriber (if none exists)
INSERT INTO subscribers (
  email,
  name,
  business_name,
  bot_name,
  business_type,
  billing_status,
  status,
  trial_started_at,
  trial_ends_at,
  trial_used,
  signup_source,
  current_mrr
)
VALUES (
  'trial-test@example.com',
  'Test User',
  'Test Business Inc',
  'TestBot',
  'general',
  'trialing',
  'active',
  NOW() - INTERVAL '5 days',  -- Started 5 days ago
  NOW() + INTERVAL '2 days',   -- Ends in 2 days (Day 5 of trial)
  false,
  'email',
  0
)
ON CONFLICT (email) DO UPDATE
SET
  billing_status = 'trialing',
  status = 'active',
  trial_started_at = NOW() - INTERVAL '5 days',
  trial_ends_at = NOW() + INTERVAL '2 days',
  trial_used = false;

-- Create trial_conversions record for test user
INSERT INTO trial_conversions (
  subscriber_id,
  trial_started_at,
  converted,
  signup_method
)
SELECT
  id,
  trial_started_at,
  false,
  'google_business_lookup'
FROM subscribers
WHERE email = 'trial-test@example.com'
ON CONFLICT (subscriber_id, trial_started_at) DO NOTHING;

-- =====================================================
-- TEST 1: Verify Test User Setup
-- =====================================================

SELECT
  id,
  email,
  name,
  business_name,
  bot_name,
  billing_status,
  status,
  trial_started_at,
  trial_ends_at,
  EXTRACT(DAY FROM (trial_ends_at - NOW())) AS days_remaining
FROM subscribers
WHERE email = 'trial-test@example.com';

-- Expected: Should show trialing user with 2 days remaining

-- =====================================================
-- TEST 2: Query All Trialing Users (What Cron Job Sees)
-- =====================================================

SELECT
  id,
  email,
  name,
  business_name,
  billing_status,
  trial_ends_at,
  EXTRACT(DAY FROM (trial_ends_at - NOW())) AS days_remaining
FROM subscribers
WHERE billing_status = 'trialing'
  AND trial_ends_at IS NOT NULL
ORDER BY trial_ends_at ASC;

-- =====================================================
-- TEST 3: Simulate Day 5 Reminder (Manual)
-- =====================================================

-- Query users who should receive day 5 reminder (2 days left)
SELECT
  id,
  email,
  name,
  business_name,
  CEIL(EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400) AS days_remaining
FROM subscribers
WHERE billing_status = 'trialing'
  AND trial_ends_at IS NOT NULL
  AND CEIL(EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400) = 2;

-- After running cron job, check commands_log for reminder sent
SELECT
  subscriber_id,
  skill_triggered,
  raw_message,
  success,
  created_at
FROM commands_log
WHERE skill_triggered = 'trial-reminder-day-5'
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- TEST 4: Simulate Trial Expiration
-- =====================================================

-- Manually expire the test user's trial
UPDATE subscribers
SET
  trial_ends_at = NOW() - INTERVAL '1 day'  -- Set to yesterday
WHERE email = 'trial-test@example.com';

-- Verify expiration
SELECT
  email,
  billing_status,
  status,
  trial_ends_at,
  EXTRACT(DAY FROM (trial_ends_at - NOW())) AS days_remaining
FROM subscribers
WHERE email = 'trial-test@example.com';

-- Expected: days_remaining should be negative

-- After running cron job, verify user was paused
SELECT
  email,
  billing_status,
  status,
  trial_ends_at
FROM subscribers
WHERE email = 'trial-test@example.com';

-- Expected: billing_status = 'past_due', status = 'paused'

-- Check trial_conversions was updated
SELECT
  subscriber_id,
  trial_started_at,
  trial_ended_at,
  converted,
  days_to_convert
FROM trial_conversions
WHERE subscriber_id = (
  SELECT id FROM subscribers WHERE email = 'trial-test@example.com'
);

-- Check commands_log for expiration event
SELECT
  subscriber_id,
  skill_triggered,
  raw_message,
  success,
  created_at
FROM commands_log
WHERE skill_triggered = 'trial-expired'
  AND subscriber_id = (
    SELECT id FROM subscribers WHERE email = 'trial-test@example.com'
  )
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================
-- TEST 5: Trial Conversion Analytics
-- =====================================================

-- Overall conversion rate
SELECT
  COUNT(*) FILTER (WHERE converted = true) AS converted_count,
  COUNT(*) FILTER (WHERE converted = false) AS not_converted_count,
  COUNT(*) AS total_trials,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE converted = true) / NULLIF(COUNT(*), 0),
    2
  ) AS conversion_rate_percent
FROM trial_conversions
WHERE trial_ended_at IS NOT NULL;

-- Average days to convert (for converted trials)
SELECT
  ROUND(AVG(days_to_convert), 1) AS avg_days_to_convert,
  MIN(days_to_convert) AS fastest_convert,
  MAX(days_to_convert) AS slowest_convert
FROM trial_conversions
WHERE converted = true
  AND days_to_convert IS NOT NULL;

-- Trials by status
SELECT
  CASE
    WHEN trial_ended_at IS NULL THEN 'Active'
    WHEN converted = true THEN 'Converted'
    ELSE 'Expired'
  END AS trial_status,
  COUNT(*) AS count
FROM trial_conversions
GROUP BY trial_status
ORDER BY count DESC;

-- =====================================================
-- TEST 6: Monitor Trial Reminders
-- =====================================================

-- View all trial-related events in commands_log
SELECT
  c.created_at,
  s.email,
  s.name,
  c.skill_triggered,
  c.raw_message,
  c.success
FROM commands_log c
JOIN subscribers s ON c.subscriber_id = s.id
WHERE c.skill_triggered IN ('trial-reminder-day-5', 'trial-expired')
ORDER BY c.created_at DESC
LIMIT 20;

-- =====================================================
-- TEST 7: Find Users Needing Reminders
-- =====================================================

-- Users with 2 days left (should get day 5 reminder)
SELECT
  email,
  name,
  business_name,
  trial_ends_at,
  CEIL(EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400) AS days_remaining
FROM subscribers
WHERE billing_status = 'trialing'
  AND trial_ends_at IS NOT NULL
  AND CEIL(EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400) = 2;

-- Users with expired trials (should be paused)
SELECT
  email,
  name,
  business_name,
  billing_status,
  status,
  trial_ends_at,
  CEIL(EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400) AS days_remaining
FROM subscribers
WHERE billing_status = 'trialing'
  AND trial_ends_at IS NOT NULL
  AND trial_ends_at < NOW();

-- =====================================================
-- CLEANUP: Reset Test User
-- =====================================================

-- Reset test user to active trial (5 days in, 2 days left)
UPDATE subscribers
SET
  billing_status = 'trialing',
  status = 'active',
  trial_started_at = NOW() - INTERVAL '5 days',
  trial_ends_at = NOW() + INTERVAL '2 days'
WHERE email = 'trial-test@example.com';

-- Or delete test user entirely
-- DELETE FROM subscribers WHERE email = 'trial-test@example.com';

-- =====================================================
-- MONITORING: Cron Job Performance
-- =====================================================

-- If using Supabase pg_cron, check job status
SELECT
  jobid,
  jobname,
  schedule,
  active,
  nodename
FROM cron.job
WHERE jobname = 'check-trial-expirations';

-- View recent cron job runs
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

-- =====================================================
-- USEFUL QUERIES FOR PRODUCTION
-- =====================================================

-- Count active trials by days remaining
SELECT
  CASE
    WHEN CEIL(EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400) <= 0 THEN 'Expired (should be paused)'
    WHEN CEIL(EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400) = 1 THEN '1 day left'
    WHEN CEIL(EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400) = 2 THEN '2 days left (reminder)'
    WHEN CEIL(EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400) BETWEEN 3 AND 5 THEN '3-5 days left'
    ELSE '6+ days left'
  END AS trial_stage,
  COUNT(*) AS user_count
FROM subscribers
WHERE billing_status = 'trialing'
  AND trial_ends_at IS NOT NULL
GROUP BY trial_stage
ORDER BY
  CASE trial_stage
    WHEN 'Expired (should be paused)' THEN 1
    WHEN '1 day left' THEN 2
    WHEN '2 days left (reminder)' THEN 3
    WHEN '3-5 days left' THEN 4
    ELSE 5
  END;

-- Find trials that should have expired but didn't get paused (data quality check)
SELECT
  email,
  name,
  business_name,
  billing_status,
  status,
  trial_ends_at,
  EXTRACT(DAY FROM (NOW() - trial_ends_at)) AS days_overdue
FROM subscribers
WHERE billing_status = 'trialing'
  AND trial_ends_at < NOW()
  AND status != 'paused';

-- =====================================================
-- END OF TEST SCRIPT
-- =====================================================
