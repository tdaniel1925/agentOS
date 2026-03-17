-- Phone Numbers and Usage Tracking Migration
-- Implements per-subscriber phone numbers with Twilio/VAPI integration
-- and comprehensive usage tracking with spending limits

-- =====================================================
-- 1. SUBSCRIBER PHONE NUMBERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriber_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,

  -- Phone number details
  phone_number TEXT NOT NULL UNIQUE, -- E.164 format: +14155551234
  phone_number_id TEXT NOT NULL, -- VAPI phone number ID
  twilio_sid TEXT, -- Twilio incoming phone number SID

  -- Provider and type
  provider TEXT NOT NULL CHECK (provider IN ('vapi', 'twilio')) DEFAULT 'twilio',
  number_type TEXT NOT NULL CHECK (number_type IN ('local', 'tollfree', 'mobile')) DEFAULT 'local',
  area_code TEXT NOT NULL, -- 3 digits
  locality TEXT, -- City name
  region TEXT, -- State

  -- VAPI assistant linkage
  vapi_assistant_id TEXT, -- VAPI assistant ID for this subscriber

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('provisioning', 'active', 'quarantined', 'released')) DEFAULT 'provisioning',
  quarantine_until TIMESTAMPTZ,

  -- Usage tracking (updated real-time)
  total_inbound_calls INTEGER DEFAULT 0,
  total_outbound_calls INTEGER DEFAULT 0,
  total_minutes_used DECIMAL(10,2) DEFAULT 0,
  total_sms_sent INTEGER DEFAULT 0,
  total_sms_received INTEGER DEFAULT 0,

  -- Lifecycle
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  times_recycled INTEGER DEFAULT 0,
  previous_subscriber_ids UUID[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_phone_numbers_subscriber ON subscriber_phone_numbers(subscriber_id);
CREATE INDEX idx_phone_numbers_status ON subscriber_phone_numbers(status);
CREATE INDEX idx_phone_numbers_area_code ON subscriber_phone_numbers(area_code);
CREATE INDEX idx_phone_numbers_quarantine ON subscriber_phone_numbers(quarantine_until) WHERE status = 'quarantined';

-- Partial unique index to enforce one active number per subscriber
CREATE UNIQUE INDEX idx_unique_active_subscriber ON subscriber_phone_numbers(subscriber_id) WHERE status = 'active';

-- RLS Policies
ALTER TABLE subscriber_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view own phone numbers"
  ON subscriber_phone_numbers FOR SELECT
  USING (subscriber_id IN (SELECT id FROM subscribers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Service role full access"
  ON subscriber_phone_numbers FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 2. USAGE TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriber_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,

  -- Current billing period
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,

  -- Voice minutes
  voice_minutes_included INTEGER NOT NULL DEFAULT 200,
  voice_minutes_used DECIMAL(10,2) DEFAULT 0,
  voice_minutes_remaining DECIMAL(10,2) DEFAULT 200,
  voice_overage_minutes DECIMAL(10,2) DEFAULT 0,

  -- SMS messages
  sms_messages_included INTEGER NOT NULL DEFAULT 500,
  sms_messages_used INTEGER DEFAULT 0,
  sms_messages_remaining INTEGER DEFAULT 500,
  sms_overage_count INTEGER DEFAULT 0,

  -- Spending
  monthly_base_fee DECIMAL(10,2) DEFAULT 97.00,
  voice_overage_charges DECIMAL(10,2) DEFAULT 0.00,
  sms_overage_charges DECIMAL(10,2) DEFAULT 0.00,
  total_charges DECIMAL(10,2) DEFAULT 97.00,

  -- Limits and alerts
  spending_limit DECIMAL(10,2) DEFAULT 500.00,
  alert_threshold_percent INTEGER DEFAULT 80,
  alert_sent_50_percent BOOLEAN DEFAULT FALSE,
  alert_sent_80_percent BOOLEAN DEFAULT FALSE,
  alert_sent_100_percent BOOLEAN DEFAULT FALSE,

  -- Rate limiting (rolling windows)
  calls_this_hour INTEGER DEFAULT 0,
  calls_this_day INTEGER DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  hour_window_start TIMESTAMPTZ DEFAULT NOW(),
  day_window_start TIMESTAMPTZ DEFAULT DATE_TRUNC('day', NOW()),

  -- Fraud detection
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  flagged_at TIMESTAMPTZ,
  is_paused BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_subscriber_billing_period UNIQUE (subscriber_id, billing_period_start)
);

-- Indexes
CREATE INDEX idx_usage_subscriber ON subscriber_usage(subscriber_id);
CREATE INDEX idx_usage_billing_period ON subscriber_usage(billing_period_start, billing_period_end);
CREATE INDEX idx_usage_flagged ON subscriber_usage(is_flagged) WHERE is_flagged = TRUE;

-- RLS Policies
ALTER TABLE subscriber_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view own usage"
  ON subscriber_usage FOR SELECT
  USING (subscriber_id IN (SELECT id FROM subscribers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Service role full access"
  ON subscriber_usage FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 3. CALL LOGS TABLE (Detailed per-call tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES subscriber_phone_numbers(id),

  -- Call identifiers
  vapi_call_id TEXT NOT NULL UNIQUE,
  twilio_call_sid TEXT,

  -- Call details
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,

  -- Timing
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  duration_minutes DECIMAL(10,2),

  -- Status
  status TEXT NOT NULL CHECK (status IN ('queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer')),
  end_reason TEXT,

  -- Costs
  voice_cost DECIMAL(10,4),
  ai_cost DECIMAL(10,4),
  total_cost DECIMAL(10,4),
  billable_minutes DECIMAL(10,2),
  charged_amount DECIMAL(10,2),

  -- AI details
  assistant_id TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,

  -- Transcript and summary
  transcript TEXT,
  summary TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_call_logs_subscriber ON call_logs(subscriber_id);
CREATE INDEX idx_call_logs_direction ON call_logs(direction);
CREATE INDEX idx_call_logs_status ON call_logs(status);
CREATE INDEX idx_call_logs_started_at ON call_logs(started_at DESC);
CREATE INDEX idx_call_logs_vapi_call_id ON call_logs(vapi_call_id);

-- RLS Policies
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view own call logs"
  ON call_logs FOR SELECT
  USING (subscriber_id IN (SELECT id FROM subscribers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Service role full access"
  ON call_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 4. SMS LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES subscriber_phone_numbers(id),

  -- Message identifiers
  twilio_message_sid TEXT NOT NULL UNIQUE,

  -- Message details
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'undelivered', 'failed', 'received')),
  error_code INTEGER,
  error_message TEXT,

  -- Costs
  cost DECIMAL(10,4),
  charged_amount DECIMAL(10,2),

  -- Metadata
  media_urls TEXT[],
  num_segments INTEGER DEFAULT 1,
  metadata JSONB,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sms_logs_subscriber ON sms_logs(subscriber_id);
CREATE INDEX idx_sms_logs_direction ON sms_logs(direction);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_created_at ON sms_logs(created_at DESC);

-- RLS Policies
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view own sms logs"
  ON sms_logs FOR SELECT
  USING (subscriber_id IN (SELECT id FROM subscribers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Service role full access"
  ON sms_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 5. PRICING CONFIGURATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Version control
  version TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,

  -- One-time fees
  setup_fee DECIMAL(10,2) NOT NULL DEFAULT 15.00,

  -- Monthly subscription
  monthly_base DECIMAL(10,2) NOT NULL DEFAULT 97.00,

  -- Included usage
  voice_minutes_included INTEGER NOT NULL DEFAULT 200,
  sms_messages_included INTEGER NOT NULL DEFAULT 500,

  -- Overage rates
  voice_per_minute DECIMAL(10,4) NOT NULL DEFAULT 0.40,
  sms_per_message DECIMAL(10,4) NOT NULL DEFAULT 0.02,

  -- Limits
  default_spending_limit DECIMAL(10,2) DEFAULT 500.00,
  max_calls_per_hour INTEGER DEFAULT 50,
  max_calls_per_day INTEGER DEFAULT 200,

  -- Effective dates
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default active pricing
INSERT INTO pricing_config (version, is_active, setup_fee, monthly_base, voice_minutes_included, sms_messages_included, voice_per_minute, sms_per_message)
VALUES ('v1.0', TRUE, 15.00, 97.00, 200, 500, 0.40, 0.02)
ON CONFLICT (version) DO NOTHING;

-- Only one active pricing config at a time
CREATE UNIQUE INDEX idx_pricing_config_active ON pricing_config(is_active) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing"
  ON pricing_config FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Service role full access"
  ON pricing_config FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_phone_numbers_updated_at
  BEFORE UPDATE ON subscriber_phone_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_usage_updated_at
  BEFORE UPDATE ON subscriber_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pricing_config_updated_at
  BEFORE UPDATE ON pricing_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to initialize usage tracking for new billing period
CREATE OR REPLACE FUNCTION initialize_billing_period(
  p_subscriber_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_usage_id UUID;
  v_pricing RECORD;
BEGIN
  -- Get active pricing
  SELECT * INTO v_pricing FROM pricing_config WHERE is_active = TRUE LIMIT 1;

  -- Create usage record
  INSERT INTO subscriber_usage (
    subscriber_id,
    billing_period_start,
    billing_period_end,
    voice_minutes_included,
    voice_minutes_remaining,
    sms_messages_included,
    sms_messages_remaining,
    monthly_base_fee,
    total_charges,
    spending_limit
  ) VALUES (
    p_subscriber_id,
    p_period_start,
    p_period_end,
    v_pricing.voice_minutes_included,
    v_pricing.voice_minutes_included,
    v_pricing.sms_messages_included,
    v_pricing.sms_messages_included,
    v_pricing.monthly_base,
    v_pricing.monthly_base,
    v_pricing.default_spending_limit
  )
  RETURNING id INTO v_usage_id;

  RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track call usage
CREATE OR REPLACE FUNCTION track_call_usage(
  p_subscriber_id UUID,
  p_duration_minutes DECIMAL,
  p_direction TEXT
)
RETURNS VOID AS $$
DECLARE
  v_pricing RECORD;
  v_usage RECORD;
  v_overage_minutes DECIMAL;
  v_overage_charge DECIMAL;
BEGIN
  -- Get active pricing
  SELECT * INTO v_pricing FROM pricing_config WHERE is_active = TRUE LIMIT 1;

  -- Get current usage
  SELECT * INTO v_usage FROM subscriber_usage
  WHERE subscriber_id = p_subscriber_id
    AND billing_period_start <= NOW()
    AND billing_period_end >= NOW()
  LIMIT 1;

  -- Calculate overage
  v_overage_minutes := GREATEST(0, (v_usage.voice_minutes_used + p_duration_minutes) - v_usage.voice_minutes_included);
  v_overage_charge := v_overage_minutes * v_pricing.voice_per_minute;

  -- Update usage
  UPDATE subscriber_usage SET
    voice_minutes_used = voice_minutes_used + p_duration_minutes,
    voice_minutes_remaining = GREATEST(0, voice_minutes_remaining - p_duration_minutes),
    voice_overage_minutes = v_overage_minutes,
    voice_overage_charges = v_overage_charge,
    total_charges = monthly_base_fee + v_overage_charge + sms_overage_charges,
    calls_this_hour = calls_this_hour + 1,
    calls_this_day = calls_this_day + 1,
    last_call_at = NOW()
  WHERE id = v_usage.id;

  -- Update phone number stats
  IF p_direction = 'inbound' THEN
    UPDATE subscriber_phone_numbers SET
      total_inbound_calls = total_inbound_calls + 1,
      total_minutes_used = total_minutes_used + p_duration_minutes
    WHERE subscriber_id = p_subscriber_id AND status = 'active';
  ELSE
    UPDATE subscriber_phone_numbers SET
      total_outbound_calls = total_outbound_calls + 1,
      total_minutes_used = total_minutes_used + p_duration_minutes
    WHERE subscriber_id = p_subscriber_id AND status = 'active';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track SMS usage
CREATE OR REPLACE FUNCTION track_sms_usage(
  p_subscriber_id UUID,
  p_direction TEXT,
  p_num_segments INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_pricing RECORD;
  v_usage RECORD;
  v_overage_count INTEGER;
  v_overage_charge DECIMAL;
BEGIN
  -- Get active pricing
  SELECT * INTO v_pricing FROM pricing_config WHERE is_active = TRUE LIMIT 1;

  -- Get current usage
  SELECT * INTO v_usage FROM subscriber_usage
  WHERE subscriber_id = p_subscriber_id
    AND billing_period_start <= NOW()
    AND billing_period_end >= NOW()
  LIMIT 1;

  -- Calculate overage
  v_overage_count := GREATEST(0, (v_usage.sms_messages_used + p_num_segments) - v_usage.sms_messages_included);
  v_overage_charge := v_overage_count * v_pricing.sms_per_message;

  -- Update usage
  UPDATE subscriber_usage SET
    sms_messages_used = sms_messages_used + p_num_segments,
    sms_messages_remaining = GREATEST(0, sms_messages_remaining - p_num_segments),
    sms_overage_count = v_overage_count,
    sms_overage_charges = v_overage_charge,
    total_charges = monthly_base_fee + voice_overage_charges + v_overage_charge
  WHERE id = v_usage.id;

  -- Update phone number stats
  IF p_direction = 'outbound' THEN
    UPDATE subscriber_phone_numbers SET
      total_sms_sent = total_sms_sent + p_num_segments
    WHERE subscriber_id = p_subscriber_id AND status = 'active';
  ELSE
    UPDATE subscriber_phone_numbers SET
      total_sms_received = total_sms_received + p_num_segments
    WHERE subscriber_id = p_subscriber_id AND status = 'active';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ADD COLUMNS TO EXISTING SUBSCRIBERS TABLE
-- =====================================================

-- Add pricing tier tracking (for future tiered pricing)
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS pricing_version TEXT DEFAULT 'v1.0';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS setup_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS setup_fee_amount DECIMAL(10,2);
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS setup_fee_paid_at TIMESTAMPTZ;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
