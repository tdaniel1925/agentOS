-- Add VAPI phone number ID to subscribers table
-- This stores the VAPI phone number ID for each subscriber
-- Used when making outbound calls via VAPI

ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS vapi_phone_number_id TEXT;

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_vapi_phone_number_id
ON subscribers(vapi_phone_number_id);

-- Update the current subscriber with their VAPI phone ID
UPDATE subscribers
SET vapi_phone_number_id = 'fc067291-7039-496a-8d92-10731bb49eb0'
WHERE id = '09fab1d9-f180-44ca-acb6-5a3a774362e3';

SELECT 'Column added and data updated!' as status;
