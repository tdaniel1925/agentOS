-- Migration: Switch from VAPI phone numbers to Twilio phone numbers
-- Date: March 17, 2026
-- Reason: Each subscriber gets dedicated Twilio number (voice + SMS) with A2P compliance

BEGIN;

-- 1. Rename columns (if they exist)
DO $$
BEGIN
    -- Rename vapi_phone_number to phone_number
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscribers' AND column_name = 'vapi_phone_number'
    ) THEN
        ALTER TABLE subscribers RENAME COLUMN vapi_phone_number TO phone_number;
    END IF;

    -- Rename vapi_phone_number_id to phone_number_sid
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscribers' AND column_name = 'vapi_phone_number_id'
    ) THEN
        ALTER TABLE subscribers RENAME COLUMN vapi_phone_number_id TO phone_number_sid;
    END IF;
END $$;

-- 2. Add new columns if they don't exist
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_number_sid TEXT,
ADD COLUMN IF NOT EXISTS phone_provisioned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_method_added BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method_added_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- 3. Create admin_alerts table
CREATE TABLE IF NOT EXISTS admin_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type TEXT NOT NULL,
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES subscribers(id),

  -- Indexes
  CONSTRAINT admin_alerts_subscriber_fkey FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_alerts_subscriber ON admin_alerts(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_type ON admin_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_resolved ON admin_alerts(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscribers_phone_number ON subscribers(phone_number);
CREATE INDEX IF NOT EXISTS idx_subscribers_phone_number_sid ON subscribers(phone_number_sid);
CREATE INDEX IF NOT EXISTS idx_subscribers_payment_method ON subscribers(payment_method_added);

-- 5. Enable RLS on admin_alerts
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for admin_alerts
CREATE POLICY "Admins can view all alerts"
  ON admin_alerts FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update alerts"
  ON admin_alerts FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert alerts"
  ON admin_alerts FOR INSERT
  WITH CHECK (true);

-- 7. Update existing data (if any VAPI numbers exist)
-- This is safe to run even if columns don't exist yet
DO $$
BEGIN
    -- Log migration start
    RAISE NOTICE 'Migration started: Converting VAPI numbers to Twilio architecture';

    -- Count subscribers with phone numbers
    RAISE NOTICE 'Subscribers with phone numbers: %', (
        SELECT COUNT(*) FROM subscribers WHERE phone_number IS NOT NULL
    );
END $$;

COMMIT;

-- Post-migration notes:
-- 1. New signups will automatically provision Twilio numbers
-- 2. Existing subscribers with VAPI numbers can continue using them
-- 3. When they upgrade/renew, migrate them to Twilio numbers
-- 4. vapi_assistant_id is kept - still used for voice forwarding
