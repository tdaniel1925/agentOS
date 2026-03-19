-- Calendar System Migration
-- Hybrid approach: CalDAV read + .ics email write
-- Created: 2026-03-19

-- Add calendar URL to subscribers table
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS calendar_url TEXT,
ADD COLUMN IF NOT EXISTS calendar_type TEXT; -- 'google' | 'microsoft' | 'apple' | 'other'

-- Drop existing appointments table if it exists (clean slate)
DROP TABLE IF EXISTS appointments CASCADE;

-- Appointments table (Jordyn-managed appointments)
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,

  -- Appointment details
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  location TEXT,

  -- Attendees
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  -- Status
  status TEXT DEFAULT 'scheduled', -- scheduled | completed | cancelled | no_show

  -- Reminders
  reminder_minutes INTEGER DEFAULT 15, -- minutes before appointment
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,

  -- External calendar sync
  ics_sent BOOLEAN DEFAULT false,
  ics_sent_at TIMESTAMPTZ,
  external_event_id TEXT, -- if synced to external calendar

  -- Linked data
  call_id UUID REFERENCES calls(id), -- if booked during a call
  lead_id UUID REFERENCES leads(id), -- if related to a lead

  -- Metadata
  notes TEXT,
  created_via TEXT, -- 'sms' | 'voice' | 'api' | 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_subscriber_id ON appointments(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_reminder ON appointments(reminder_sent, start_time);

-- RLS Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Subscribers can read their own appointments
CREATE POLICY "subscribers_read_own_appointments"
  ON appointments FOR SELECT
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Service role can do anything
CREATE POLICY "service_role_all_appointments"
  ON appointments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- Comment
COMMENT ON TABLE appointments IS 'Jordyn-managed appointments with calendar sync via .ics email';
COMMENT ON COLUMN subscribers.calendar_url IS 'CalDAV/iCal feed URL for reading external calendar';
