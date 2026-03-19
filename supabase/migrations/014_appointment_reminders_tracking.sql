-- Appointment Reminders Tracking Enhancement
-- Track multiple reminders per appointment (24h, 1h, 15m)

-- Add array field to track which reminders have been sent
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reminders_sent TEXT[] DEFAULT '{}';

-- Create index for reminder queries
CREATE INDEX IF NOT EXISTS idx_appointments_reminders ON appointments(start_time, status, reminders_sent);

-- Comment
COMMENT ON COLUMN appointments.reminders_sent IS 'Array of sent reminder types: 24h, 1h, 15m';
