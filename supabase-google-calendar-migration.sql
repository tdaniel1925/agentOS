-- Add Google Calendar columns to subscribers table
-- Run this in Supabase SQL Editor

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS google_access_token TEXT;

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMPTZ;

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_calendar_connected
  ON subscribers(google_calendar_connected);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscribers'
  AND column_name LIKE 'google_%'
ORDER BY column_name;
