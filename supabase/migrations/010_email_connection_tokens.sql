-- =============================================
-- EMAIL CONNECTION TOKENS
-- Temporary tokens for OAuth email connection flow
-- =============================================
-- Migration: 010
-- Purpose: Map SMS-generated tokens to subscribers for OAuth callback
-- =============================================

CREATE TABLE IF NOT EXISTS email_connection_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Token sent via SMS
  token TEXT UNIQUE NOT NULL,

  -- Subscriber initiating connection
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,

  -- Provider they're connecting
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),

  -- Token expiration (15 minutes)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'failed')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_connection_tokens_token ON email_connection_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_connection_tokens_subscriber ON email_connection_tokens(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_connection_tokens_expires ON email_connection_tokens(expires_at);

-- Auto-cleanup expired tokens (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_email_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_connection_tokens
  WHERE expires_at <= NOW()
    AND status = 'pending';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE email_connection_tokens IS 'Temporary tokens for OAuth email connection flow - auto-expire after 15 minutes';
COMMENT ON FUNCTION cleanup_expired_email_tokens() IS 'Cleanup expired email connection tokens - run daily via cron';
