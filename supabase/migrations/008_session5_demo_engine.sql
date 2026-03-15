-- =====================================================
-- AgentOS — Session 5: Demo Engine + Attribution Safety
-- Migration 008: demo_calls + claimed_prospects
-- =====================================================
--
-- This migration creates the complete rep demo engine:
-- - demo_calls: Full demo lifecycle tracking
-- - claimed_prospects: Attribution safety net
--

-- ─────────────────────────────────────────────────────
-- TABLE: claimed_prospects
-- ─────────────────────────────────────────────────────
-- Attribution safety net - ensures we never lose a sale
-- Created when:
-- 1. Demo is triggered (auto-insert)
-- 2. Prospect clicks /join/[code] link (auto-insert)
-- 3. Rep manually claims prospect (manual insert)
--
-- Used for attribution resolution if:
-- - Demo email is lost
-- - Prospect signs up via Google search
-- - Prospect uses different email than given
-- - Signup happens weeks after demo

CREATE TABLE IF NOT EXISTS claimed_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rep attribution (locked in at claim time)
  rep_id UUID NOT NULL,
  -- References agentos_reps(id)

  rep_code TEXT NOT NULL,
  -- Apex rep code (e.g., "MJ4829")
  -- Used in webhook to Apex

  -- Prospect identifiers
  prospect_phone TEXT,
  -- E.164 format: +17135550142
  -- Primary attribution key

  prospect_email TEXT,
  -- Secondary attribution key
  -- May be added after initial claim

  prospect_name TEXT,
  -- For display only

  -- How was this claim created?
  claim_source TEXT NOT NULL CHECK (claim_source IN (
    'demo_trigger',   -- Auto-created when demo triggered
    'link_click',     -- Auto-created when prospect clicks /join/[code]
    'manual_claim'    -- Rep manually claimed via dashboard
  )),

  -- Claim lifecycle
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- When claim was created

  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  -- Claims expire after 90 days if not converted
  -- Prevents indefinite claim squatting

  -- Conversion tracking
  converted BOOLEAN DEFAULT false,
  -- Set to true when prospect signs up

  converted_at TIMESTAMPTZ,
  -- When signup happened

  subscriber_id UUID,
  -- Links to subscribers(id) after conversion

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for attribution resolution
CREATE INDEX IF NOT EXISTS idx_claimed_prospects_phone
  ON claimed_prospects(prospect_phone)
  WHERE converted = false;
-- Fast lookup during signup by phone

CREATE INDEX IF NOT EXISTS idx_claimed_prospects_email
  ON claimed_prospects(prospect_email)
  WHERE converted = false;
-- Fast lookup during signup by email

CREATE INDEX IF NOT EXISTS idx_claimed_prospects_rep
  ON claimed_prospects(rep_id, created_at DESC)
  WHERE converted = false;
-- Rep dashboard: show my active claims

CREATE INDEX IF NOT EXISTS idx_claimed_prospects_expiring
  ON claimed_prospects(expires_at)
  WHERE converted = false;
-- Find claims expiring soon (for rep notifications)
-- Query will filter: WHERE expires_at < NOW() + INTERVAL '7 days'

-- RLS
ALTER TABLE claimed_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reps_own_claims" ON claimed_prospects
  FOR ALL USING (rep_id = auth.uid());
-- Reps can only see their own claims


-- ─────────────────────────────────────────────────────
-- TABLE: demo_calls
-- ─────────────────────────────────────────────────────
-- Complete demo lifecycle tracking
-- One record per demo attempt
-- Tracks: consent → call → email → conversion

CREATE TABLE IF NOT EXISTS demo_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rep attribution (locked in at creation, NEVER changes)
  rep_id UUID NOT NULL,
  -- References agentos_reps(id)

  rep_code TEXT NOT NULL,
  -- Apex rep code - used in signup link and webhooks

  rep_name TEXT NOT NULL,
  -- For personalization in messages

  rep_phone TEXT,
  -- Only populated if triggered via SMS (source = 'rep_sms')

  -- Prospect details
  prospect_name TEXT NOT NULL,
  -- First name or full name

  prospect_phone TEXT NOT NULL,
  -- E.164 format: +17135550142

  prospect_business_type TEXT NOT NULL CHECK (
    prospect_business_type IN (
      'insurance', 'cpa', 'law', 'realestate', 'other'
    )
  ),
  -- Determines system prompt and messaging

  prospect_note TEXT,
  -- Optional context from rep (e.g., "State Farm agent considering switch")

  -- How was this demo triggered?
  source TEXT NOT NULL DEFAULT 'back_office' CHECK (
    source IN ('back_office', 'rep_sms')
  ),
  -- back_office = triggered via /demos web form
  -- rep_sms = triggered via text to demo number

  -- Demo lifecycle status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',        -- Created, consent SMS not sent yet
      'awaiting_yes',   -- Consent SMS sent, waiting for reply
      'call_approved',  -- Prospect said YES
      'calling',        -- VAPI call in progress
      'call_completed', -- Call finished successfully
      'email_requested',-- Jordan asked for email (via SMS)
      'email_received', -- Email captured
      'email_sent',     -- Personalized email delivered
      'converted',      -- Prospect signed up! 🎉
      'declined',       -- Prospect said NO
      'no_response',    -- Never replied to consent SMS
      'no_answer',      -- Didn't pick up phone
      'failed'          -- Technical failure
    )
  ),

  -- Consent SMS tracking
  consent_sms_sent_at TIMESTAMPTZ,
  -- When "Mind if I call?" SMS was sent

  prospect_replied_at TIMESTAMPTZ,
  -- When prospect replied (YES or NO)

  prospect_reply TEXT,
  -- What they said ("YES", "No thanks", etc.)

  -- Call tracking
  vapi_call_id TEXT,
  -- VAPI call ID for webhook correlation

  call_started_at TIMESTAMPTZ,
  -- When VAPI call was initiated

  call_ended_at TIMESTAMPTZ,
  -- When call completed

  call_duration_seconds INTEGER DEFAULT 0,
  -- Length of call

  call_transcript TEXT,
  -- Full conversation transcript from VAPI
  -- Used for email personalization

  -- Email capture
  email_received TEXT,
  -- Email address captured from prospect

  email_received_at TIMESTAMPTZ,
  -- When we got the email

  email_source TEXT CHECK (
    email_source IN ('call_transcript', 'sms_reply', NULL)
  ),
  -- How we captured the email:
  -- - call_transcript: Prospect gave email during call
  -- - sms_reply: Prospect texted email after call

  personalized_email_sent_at TIMESTAMPTZ,
  -- When Claude-generated email was sent

  personalized_email_id TEXT,
  -- Resend email ID for tracking

  -- Conversion tracking
  converted_at TIMESTAMPTZ,
  -- When prospect signed up

  converted_subscriber_id UUID,
  -- Links to subscribers(id)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_demo_calls_rep
  ON demo_calls(rep_id, created_at DESC);
-- Rep dashboard: show my demos

CREATE INDEX IF NOT EXISTS idx_demo_calls_prospect_phone
  ON demo_calls(prospect_phone);
-- SMS webhook: find demo by incoming phone

CREATE INDEX IF NOT EXISTS idx_demo_calls_vapi
  ON demo_calls(vapi_call_id)
  WHERE vapi_call_id IS NOT NULL;
-- VAPI webhook: find demo by call ID

CREATE INDEX IF NOT EXISTS idx_demo_calls_status
  ON demo_calls(status, created_at DESC);
-- Admin dashboard: monitor demo pipeline

CREATE INDEX IF NOT EXISTS idx_demo_calls_active
  ON demo_calls(prospect_phone, created_at DESC)
  WHERE status IN ('awaiting_yes', 'call_approved', 'calling',
                    'call_completed', 'email_requested', 'email_received');
-- Find active demos for duplicate detection

-- RLS
ALTER TABLE demo_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reps_own_demos" ON demo_calls
  FOR ALL USING (rep_id = auth.uid());
-- Reps can only see their own demos


-- ─────────────────────────────────────────────────────
-- FUNCTION: Auto-create claimed_prospects when demo created
-- ─────────────────────────────────────────────────────
-- This ensures attribution safety net is always in place

CREATE OR REPLACE FUNCTION create_claim_from_demo()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into claimed_prospects (ignore if duplicate)
  INSERT INTO claimed_prospects (
    rep_id,
    rep_code,
    prospect_phone,
    prospect_email,
    prospect_name,
    claim_source
  ) VALUES (
    NEW.rep_id,
    NEW.rep_code,
    NEW.prospect_phone,
    NEW.email_received,  -- May be NULL initially
    NEW.prospect_name,
    'demo_trigger'
  )
  ON CONFLICT (prospect_phone) DO NOTHING;
  -- If phone already claimed, don't overwrite
  -- Latest demo wins is handled in attribution logic

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER demo_creates_claim
  AFTER INSERT ON demo_calls
  FOR EACH ROW
  EXECUTE FUNCTION create_claim_from_demo();


-- ─────────────────────────────────────────────────────
-- FUNCTION: Update claim when email received
-- ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_claim_with_email()
RETURNS TRIGGER AS $$
BEGIN
  -- When demo gets email, update the claim
  IF NEW.email_received IS NOT NULL AND
     (OLD.email_received IS NULL OR OLD.email_received != NEW.email_received) THEN

    UPDATE claimed_prospects
    SET prospect_email = NEW.email_received,
        updated_at = NOW()
    WHERE prospect_phone = NEW.prospect_phone
      AND rep_code = NEW.rep_code
      AND converted = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER demo_updates_claim_email
  AFTER UPDATE ON demo_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_claim_with_email();


-- ─────────────────────────────────────────────────────
-- Add unique constraint on phone (after thinking about it)
-- ─────────────────────────────────────────────────────
-- Actually, DON'T make phone unique - allow multiple reps to claim
-- Most recent claim wins (handled in attribution logic)


-- ─────────────────────────────────────────────────────
-- MIGRATION COMPLETE
-- ─────────────────────────────────────────────────────
