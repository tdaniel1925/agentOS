-- Fix RLS Policies for Phone Numbers and Usage Tables
-- Run this in Supabase SQL Editor

BEGIN;

-- =====================================================
-- FIX subscriber_phone_numbers POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Subscribers can view own phone numbers" ON subscriber_phone_numbers;
DROP POLICY IF EXISTS "Service role full access" ON subscriber_phone_numbers;
DROP POLICY IF EXISTS "anon can view phone numbers" ON subscriber_phone_numbers;

-- Recreate policies
CREATE POLICY "Subscribers can view own phone numbers"
  ON subscriber_phone_numbers FOR SELECT
  TO authenticated
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on phone numbers"
  ON subscriber_phone_numbers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FIX subscriber_usage POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Subscribers can view own usage" ON subscriber_usage;
DROP POLICY IF EXISTS "Service role full access" ON subscriber_usage;

-- Recreate policies
CREATE POLICY "Subscribers can view own usage"
  ON subscriber_usage FOR SELECT
  TO authenticated
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on usage"
  ON subscriber_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FIX call_logs POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Subscribers can view own call logs" ON call_logs;
DROP POLICY IF EXISTS "Service role full access" ON call_logs;

-- Recreate policies
CREATE POLICY "Subscribers can view own call logs"
  ON call_logs FOR SELECT
  TO authenticated
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on call logs"
  ON call_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FIX sms_logs POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Subscribers can view own sms logs" ON sms_logs;
DROP POLICY IF EXISTS "Service role full access" ON sms_logs;

-- Recreate policies
CREATE POLICY "Subscribers can view own sms logs"
  ON sms_logs FOR SELECT
  TO authenticated
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on sms logs"
  ON sms_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- VERIFY RLS IS ENABLED
-- =====================================================

ALTER TABLE subscriber_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Done! Now refresh your dashboard at https://jordyn.app/app
