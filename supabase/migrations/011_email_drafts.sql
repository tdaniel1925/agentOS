-- Email Drafts Table
-- Stores email drafts created via SMS or web interface
-- Used for reply and compose functionality

CREATE TABLE email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,

  -- Reply context (if replying to an existing email)
  reply_to_message_id TEXT,
  original_email_data JSONB,

  -- Email fields
  to_address TEXT NOT NULL,
  cc_addresses TEXT[],
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  failed_reason TEXT,

  -- Reference numbering (for SMS commands like "reply to #1")
  reference_number INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_email_drafts_subscriber ON email_drafts(subscriber_id);
CREATE INDEX idx_email_drafts_reference ON email_drafts(subscriber_id, reference_number);
CREATE INDEX idx_email_drafts_status ON email_drafts(status);
CREATE INDEX idx_email_drafts_expires ON email_drafts(expires_at);

-- Row Level Security
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Subscribers can read their own drafts
CREATE POLICY "Subscribers can read own drafts"
  ON email_drafts
  FOR SELECT
  USING (auth.uid()::text = subscriber_id::text);

-- Policy: Subscribers can insert their own drafts
CREATE POLICY "Subscribers can insert own drafts"
  ON email_drafts
  FOR INSERT
  WITH CHECK (auth.uid()::text = subscriber_id::text);

-- Policy: Subscribers can update their own drafts
CREATE POLICY "Subscribers can update own drafts"
  ON email_drafts
  FOR UPDATE
  USING (auth.uid()::text = subscriber_id::text)
  WITH CHECK (auth.uid()::text = subscriber_id::text);

-- Policy: Subscribers can delete their own drafts
CREATE POLICY "Subscribers can delete own drafts"
  ON email_drafts
  FOR DELETE
  USING (auth.uid()::text = subscriber_id::text);

-- Function to auto-delete expired drafts (run daily via cron)
CREATE OR REPLACE FUNCTION delete_expired_drafts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM email_drafts
  WHERE expires_at < NOW()
    AND status IN ('draft', 'failed');
END;
$$;

-- Comment on table
COMMENT ON TABLE email_drafts IS 'Email drafts created via SMS or web interface for reply and compose functionality';
