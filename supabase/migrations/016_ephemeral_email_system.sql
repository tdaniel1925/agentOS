-- Migration 016: Ephemeral Email System
-- Adds unique Jordyn email addresses for each subscriber
-- Enables privacy-first email processing (analyze + delete in 60 seconds)

-- Add jordyn_email_address to subscribers table
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS jordyn_email_address TEXT UNIQUE;

-- Create index for fast lookup by email address
CREATE INDEX IF NOT EXISTS idx_subscribers_jordyn_email ON subscribers(jordyn_email_address);

-- Update email_summaries to remove full email storage
-- We only store metadata and AI summaries now
ALTER TABLE email_summaries
DROP COLUMN IF EXISTS emails_data;

-- Add columns for enhanced privacy-first summaries
ALTER TABLE email_summaries
ADD COLUMN IF NOT EXISTS summary_metadata JSONB DEFAULT '{}'::jsonb;

-- Add processed_at timestamp to track ephemeral processing
ALTER TABLE email_summaries
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ DEFAULT NOW();

-- Comments
COMMENT ON COLUMN subscribers.jordyn_email_address IS 'Unique email address for this subscriber (e.g., u-abc123@mail.jordyn.app). Users forward emails here for ephemeral processing.';
COMMENT ON COLUMN email_summaries.summary_metadata IS 'Metadata about emails (sender, subject, timestamp, category) - NO full content stored';
COMMENT ON COLUMN email_summaries.processed_at IS 'Timestamp when email was processed and full content deleted';

-- Create email_inbound_log table for tracking (metadata only, no content)
CREATE TABLE IF NOT EXISTS email_inbound_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  from_address TEXT NOT NULL,
  subject TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  category TEXT, -- urgent, client, lead, admin, junk
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  summary_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_email_inbound_subscriber ON email_inbound_log(subscriber_id, received_at DESC);

COMMENT ON TABLE email_inbound_log IS 'Logs inbound emails (metadata only). Full email content is NEVER stored - processed and deleted immediately.';

-- RLS policies
ALTER TABLE email_inbound_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email logs"
  ON email_inbound_log
  FOR SELECT
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );
