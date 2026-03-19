-- Add timezone support to subscribers
-- Store timezone as IANA timezone string (e.g., 'America/New_York', 'America/Chicago')

ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Chicago';

-- Add index for timezone queries
CREATE INDEX IF NOT EXISTS idx_subscribers_timezone ON subscribers(timezone);

-- Comment
COMMENT ON COLUMN subscribers.timezone IS 'IANA timezone string (e.g., America/New_York, America/Los_Angeles, America/Chicago, America/Denver, Europe/London)';

-- Update existing subscribers to default timezone (Central Time)
UPDATE subscribers
SET timezone = 'America/Chicago'
WHERE timezone IS NULL;
