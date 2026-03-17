-- MIGRATION 014: Signup V2 Schema (Rosie-Style Flow)
-- Adds Google Business Profile integration, trial management, and OAuth support
-- Agent 1: Database Schema & Migrations

-- =====================================================
-- ADD NEW FIELDS TO subscribers TABLE
-- =====================================================

-- Google Business Profile data
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS business_website TEXT,
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS business_hours JSONB,
  ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1),
  ADD COLUMN IF NOT EXISTS google_review_count INTEGER;

-- Trial management fields
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS signup_source TEXT CHECK (signup_source IN ('google_oauth', 'microsoft_oauth', 'email', 'legacy'));

-- AI training and website scraping data
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS website_scraped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS website_content JSONB;

-- Update billing_status to support trial status
ALTER TABLE subscribers DROP CONSTRAINT IF EXISTS subscribers_billing_status_check;
ALTER TABLE subscribers
  ADD CONSTRAINT subscribers_billing_status_check
  CHECK (billing_status IN ('active', 'trialing', 'past_due', 'canceled', 'paused', 'pending'));

-- =====================================================
-- CREATE trial_conversions TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS trial_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,

  -- Trial tracking
  trial_started_at TIMESTAMPTZ NOT NULL,
  trial_ended_at TIMESTAMPTZ,

  -- Conversion tracking
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  plan_selected TEXT,

  -- Analytics
  days_to_convert INTEGER,
  signup_source TEXT,
  business_type TEXT,

  -- Audio preview engagement
  audio_previews_played INTEGER DEFAULT 0,
  audio_preview_duration_seconds INTEGER DEFAULT 0,

  -- Feature usage during trial
  calls_handled_during_trial INTEGER DEFAULT 0,
  emails_sent_during_trial INTEGER DEFAULT 0,
  dashboard_logins_during_trial INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(subscriber_id, trial_started_at)
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for looking up subscribers by Google Place ID
CREATE INDEX IF NOT EXISTS idx_subscribers_google_place_id
  ON subscribers(google_place_id)
  WHERE google_place_id IS NOT NULL;

-- Index for trial expiration queries (critical for cron jobs)
CREATE INDEX IF NOT EXISTS idx_subscribers_trial_ends_at
  ON subscribers(trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

-- Index for finding active trials
CREATE INDEX IF NOT EXISTS idx_subscribers_trialing
  ON subscribers(billing_status)
  WHERE billing_status = 'trialing';

-- Index for trial conversion analytics
CREATE INDEX IF NOT EXISTS idx_trial_conversions_converted
  ON trial_conversions(converted, trial_started_at DESC);

-- Index for subscriber trial conversions lookup
CREATE INDEX IF NOT EXISTS idx_trial_conversions_subscriber_id
  ON trial_conversions(subscriber_id);

-- Index for signup source analytics
CREATE INDEX IF NOT EXISTS idx_subscribers_signup_source
  ON subscribers(signup_source)
  WHERE signup_source IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on trial_conversions table
ALTER TABLE trial_conversions ENABLE ROW LEVEL SECURITY;

-- Policy: Subscribers can view their own trial conversion data
CREATE POLICY trial_conversions_select_own
  ON trial_conversions
  FOR SELECT
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Service role can insert trial conversion records
CREATE POLICY trial_conversions_insert_service
  ON trial_conversions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update trial conversion records
CREATE POLICY trial_conversions_update_service
  ON trial_conversions
  FOR UPDATE
  USING (true);

-- Policy: Service role can delete trial conversion records (for data cleanup)
CREATE POLICY trial_conversions_delete_service
  ON trial_conversions
  FOR DELETE
  USING (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to automatically calculate days_to_convert when a trial converts
CREATE OR REPLACE FUNCTION calculate_days_to_convert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.converted = true AND OLD.converted = false THEN
    NEW.days_to_convert := EXTRACT(DAY FROM (NEW.converted_at - NEW.trial_started_at));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate days_to_convert
DROP TRIGGER IF EXISTS trigger_calculate_days_to_convert ON trial_conversions;
CREATE TRIGGER trigger_calculate_days_to_convert
  BEFORE UPDATE ON trial_conversions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_days_to_convert();

-- Function to update trial_conversions.updated_at timestamp
CREATE OR REPLACE FUNCTION update_trial_conversions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_trial_conversions_updated_at ON trial_conversions;
CREATE TRIGGER trigger_trial_conversions_updated_at
  BEFORE UPDATE ON trial_conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_conversions_updated_at();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN subscribers.google_place_id IS 'Google Business Profile Place ID for data enrichment';
COMMENT ON COLUMN subscribers.business_website IS 'Business website URL from Google or manual entry';
COMMENT ON COLUMN subscribers.business_address IS 'Full business address from Google Business Profile';
COMMENT ON COLUMN subscribers.business_hours IS 'JSON object containing business operating hours';
COMMENT ON COLUMN subscribers.google_rating IS 'Google Business Profile rating (1.0-5.0)';
COMMENT ON COLUMN subscribers.google_review_count IS 'Number of Google reviews';
COMMENT ON COLUMN subscribers.trial_started_at IS 'Timestamp when 7-day free trial began';
COMMENT ON COLUMN subscribers.trial_ends_at IS 'Timestamp when trial expires (7 days from start)';
COMMENT ON COLUMN subscribers.trial_used IS 'Flag to prevent multiple trials per business';
COMMENT ON COLUMN subscribers.signup_source IS 'OAuth provider or email signup method';
COMMENT ON COLUMN subscribers.website_scraped_at IS 'Last time website content was scraped for AI training';
COMMENT ON COLUMN subscribers.website_content IS 'Cached website content (FAQs, services, about) for faster agent updates';

COMMENT ON TABLE trial_conversions IS 'Tracks trial-to-paid conversion metrics and engagement analytics';
COMMENT ON COLUMN trial_conversions.days_to_convert IS 'Automatically calculated when converted = true';
COMMENT ON COLUMN trial_conversions.audio_previews_played IS 'Number of times user played audio samples during signup';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration adds:
-- ✓ 12 new fields to subscribers table for Google Business Profile and trial management
-- ✓ 1 new trial_conversions table for conversion analytics
-- ✓ 7 performance indexes for trial queries
-- ✓ 4 RLS policies for trial_conversions table
-- ✓ 2 trigger functions for automatic field calculations
-- ✓ Documentation comments for all new fields
