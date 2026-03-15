-- =============================================
-- APEX INTEGRATION & DEMO CREDITS SYSTEM
-- =============================================
-- Migration: 009
-- Purpose: Add demo credits, business center tiers, and enhanced Apex integration
-- =============================================

-- =============================================
-- 1. ADD DEMO CREDITS & BUSINESS CENTER TIER TO AGENTOS_REPS
-- =============================================

-- Add demo credits columns
ALTER TABLE agentos_reps ADD COLUMN IF NOT EXISTS demo_credits_remaining INTEGER DEFAULT 5;
ALTER TABLE agentos_reps ADD COLUMN IF NOT EXISTS demo_credits_reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month');
ALTER TABLE agentos_reps ADD COLUMN IF NOT EXISTS business_center_tier TEXT DEFAULT 'free'
  CHECK (business_center_tier IN ('free', 'basic', 'platinum'));

-- Add last_demo_sent_at for rate limiting
ALTER TABLE agentos_reps ADD COLUMN IF NOT EXISTS last_demo_sent_at TIMESTAMPTZ;

-- Create index for efficient credit queries
CREATE INDEX IF NOT EXISTS idx_agentos_reps_credits ON agentos_reps(demo_credits_remaining);
CREATE INDEX IF NOT EXISTS idx_agentos_reps_tier ON agentos_reps(business_center_tier);

-- =============================================
-- 2. PENDING DEMO REQUESTS TABLE
-- Stores demos waiting for prospect's YES reply
-- =============================================

CREATE TABLE IF NOT EXISTS pending_demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rep who requested the demo
  rep_id UUID REFERENCES agentos_reps(id) ON DELETE CASCADE,
  rep_name TEXT NOT NULL,

  -- Prospect information
  prospect_name TEXT,
  prospect_phone TEXT NOT NULL,
  prospect_business_type TEXT,

  -- AI-generated personalized SMS
  sms_sent TEXT NOT NULL,

  -- Industry-specific prompt to use when they say YES
  industry_prompt TEXT,

  -- Status tracking
  status TEXT DEFAULT 'awaiting_reply'
    CHECK (status IN ('awaiting_reply', 'confirmed', 'expired', 'demo_completed')),

  -- Original message from rep (for context)
  original_message TEXT,

  -- Parsed intent data
  parsed_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,

  -- Expiration: 48 hours to reply YES
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours')
);

-- Indexes for pending demos
CREATE INDEX IF NOT EXISTS idx_pending_demos_phone ON pending_demo_requests(prospect_phone);
CREATE INDEX IF NOT EXISTS idx_pending_demos_status ON pending_demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_pending_demos_expires ON pending_demo_requests(expires_at);

-- =============================================
-- 3. DEMO ACTIVITY LOG
-- Track all demo-related activities for analytics
-- =============================================

CREATE TABLE IF NOT EXISTS demo_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Related records
  rep_id UUID REFERENCES agentos_reps(id) ON DELETE SET NULL,
  demo_call_id UUID REFERENCES demo_calls(id) ON DELETE SET NULL,
  pending_request_id UUID REFERENCES pending_demo_requests(id) ON DELETE SET NULL,

  -- Activity details
  activity_type TEXT NOT NULL
    CHECK (activity_type IN (
      'demo_requested',
      'sms_sent_to_prospect',
      'prospect_confirmed',
      'demo_call_started',
      'demo_call_completed',
      'email_captured',
      'demo_expired',
      'credits_depleted',
      'upgrade_prompted'
    )),

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity log
CREATE INDEX IF NOT EXISTS idx_demo_activity_rep ON demo_activity_log(rep_id);
CREATE INDEX IF NOT EXISTS idx_demo_activity_type ON demo_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_demo_activity_created ON demo_activity_log(created_at DESC);

-- =============================================
-- 4. FUNCTION: RESET MONTHLY DEMO CREDITS
-- Called by cron job on 1st of each month
-- =============================================

CREATE OR REPLACE FUNCTION reset_monthly_demo_credits()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  -- Reset credits for reps whose reset date has passed
  UPDATE agentos_reps
  SET
    demo_credits_remaining = CASE
      WHEN business_center_tier = 'free' THEN 5
      WHEN business_center_tier = 'basic' THEN 50
      WHEN business_center_tier = 'platinum' THEN 999999
      ELSE 5
    END,
    demo_credits_reset_at = NOW() + INTERVAL '1 month'
  WHERE demo_credits_reset_at <= NOW();

  GET DIAGNOSTICS reset_count = ROW_COUNT;

  RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. FUNCTION: EXPIRE OLD PENDING DEMO REQUESTS
-- Called by cron job hourly
-- =============================================

CREATE OR REPLACE FUNCTION expire_pending_demo_requests()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Mark expired pending requests
  UPDATE pending_demo_requests
  SET
    status = 'expired',
    expired_at = NOW()
  WHERE
    status = 'awaiting_reply'
    AND expires_at <= NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. ADD BUSINESS_CENTER_TIER TO SUBSCRIBERS
-- Some subscribers might also be Apex reps
-- =============================================

ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS apex_rep_code TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS referred_by_rep_id UUID REFERENCES agentos_reps(id);

CREATE INDEX IF NOT EXISTS idx_subscribers_apex_rep ON subscribers(apex_rep_code);
CREATE INDEX IF NOT EXISTS idx_subscribers_referred_by ON subscribers(referred_by_rep_id);

-- =============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE pending_demo_requests IS 'Stores demo requests waiting for prospect YES reply';
COMMENT ON TABLE demo_activity_log IS 'Tracks all demo-related activities for analytics and debugging';
COMMENT ON COLUMN agentos_reps.demo_credits_remaining IS 'Number of direct demos rep can send this month';
COMMENT ON COLUMN agentos_reps.business_center_tier IS 'Apex Business Center subscription level';
COMMENT ON FUNCTION reset_monthly_demo_credits() IS 'Resets demo credits on 1st of month based on tier';
COMMENT ON FUNCTION expire_pending_demo_requests() IS 'Expires demo requests older than 48 hours';
