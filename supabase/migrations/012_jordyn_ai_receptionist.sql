-- MIGRATION 012: Jordyn AI Receptionist Features
-- Adds tables for AI agent configuration, detailed call logs, and SMS command handling

-- Agents (AI assistant configuration per subscriber)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE UNIQUE,

  -- VAPI configuration
  vapi_assistant_id TEXT UNIQUE,
  twilio_number TEXT,

  -- Agent personality
  agent_name TEXT DEFAULT 'Jordan',
  personality TEXT DEFAULT 'professional', -- professional | friendly | formal | casual
  capabilities TEXT[] DEFAULT ARRAY['answer_questions', 'take_messages', 'capture_leads', 'transfer_calls'],

  -- Knowledge base
  faqs JSONB DEFAULT '[]'::jsonb, -- [{question: string, answer: string}]
  business_description TEXT,

  -- Call handling
  opening_greeting TEXT DEFAULT 'Hello! This is Jordan. How can I help you today?',
  transfer_number TEXT, -- number to transfer to if caller asks for human
  voicemail_enabled BOOLEAN DEFAULT true,
  call_recording_enabled BOOLEAN DEFAULT true,

  -- Auto follow-up
  auto_followup_enabled BOOLEAN DEFAULT false,
  followup_delay_minutes INTEGER DEFAULT 15,

  -- Status
  status TEXT DEFAULT 'active', -- active | inactive | configuring
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calls (detailed call tracking with AI analysis)
-- Note: This extends the existing call_summaries table with more detail
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),

  -- Call metadata
  vapi_call_id TEXT UNIQUE,
  twilio_call_sid TEXT,
  call_type TEXT NOT NULL, -- inbound | outbound_auto | outbound_sms_command | outbound_followup
  direction TEXT NOT NULL, -- inbound | outbound

  -- Participants
  caller_number TEXT,
  callee_number TEXT,
  contact_name TEXT,

  -- Call details
  duration_seconds INTEGER DEFAULT 0,
  status TEXT, -- completed | missed | transferred | blocked | failed | in_progress
  recording_url TEXT,
  transcript TEXT,

  -- AI analysis (powered by Claude)
  ai_intent TEXT, -- what the caller wanted
  ai_sentiment TEXT, -- positive | neutral | negative | frustrated | urgent
  ai_summary TEXT, -- brief summary of the call
  ai_action_taken TEXT, -- what the agent did
  ai_next_step TEXT, -- recommended next action

  -- Outcomes
  lead_captured BOOLEAN DEFAULT false,
  appointment_booked BOOLEAN DEFAULT false,
  escalated BOOLEAN DEFAULT false,
  transferred BOOLEAN DEFAULT false,
  message_taken BOOLEAN DEFAULT false,

  -- Linked data
  lead_id UUID, -- if lead was captured
  appointment_id UUID, -- if appointment was booked

  -- Timestamps
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (SMS - both inbound and outbound)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),

  -- Twilio metadata
  twilio_sid TEXT UNIQUE,
  direction TEXT NOT NULL, -- inbound | outbound

  -- Message details
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Classification
  message_type TEXT, -- post_call_summary | command | lead_followup | reminder | notification
  status TEXT, -- queued | sent | delivered | failed | received

  -- Linked data
  call_id UUID REFERENCES calls(id), -- if this is a post-call summary

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMS Commands (when subscriber texts Jordan to trigger actions)
CREATE TABLE IF NOT EXISTS sms_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,

  -- Raw input
  raw_message TEXT NOT NULL,
  from_number TEXT NOT NULL,

  -- Parsed intent (by Claude)
  parsed_action TEXT, -- outbound_call | update_config | check_status | stop | start
  parsed_target TEXT, -- extracted name or phone number
  parsed_context TEXT, -- what the agent should say/do on the call

  -- Execution
  resolved_number TEXT, -- final phone number to call
  call_id UUID REFERENCES calls(id), -- resulting call if action was outbound_call

  -- Status
  status TEXT DEFAULT 'pending', -- pending | processing | completed | failed | ambiguous
  error_message TEXT,

  -- Response sent back to subscriber
  response_sent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Leads (captured from calls)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,

  -- Lead info
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,

  -- Source
  source TEXT DEFAULT 'inbound_call', -- inbound_call | web_form | referral
  call_id UUID REFERENCES calls(id), -- originating call

  -- Context
  inquiry_type TEXT, -- what they're interested in
  notes TEXT,
  priority TEXT DEFAULT 'medium', -- low | medium | high | urgent

  -- Follow-up
  followup_status TEXT DEFAULT 'new', -- new | contacted | qualified | converted | lost
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,

  -- Conversion
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments (booked during calls)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,

  -- Appointment details
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,

  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  appointment_type TEXT, -- consultation | demo | callback | meeting

  -- Source
  call_id UUID REFERENCES calls(id), -- call where it was booked
  lead_id UUID REFERENCES leads(id),

  -- Status
  status TEXT DEFAULT 'scheduled', -- scheduled | confirmed | cancelled | completed | no_show

  -- Notes
  notes TEXT,
  internal_notes TEXT,

  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_subscriber_id ON agents(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_calls_subscriber_id ON calls(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_calls_vapi_call_id ON calls(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_subscriber_id ON messages(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_messages_call_id ON messages(call_id);
CREATE INDEX IF NOT EXISTS idx_sms_commands_subscriber_id ON sms_commands(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_sms_commands_status ON sms_commands(status);
CREATE INDEX IF NOT EXISTS idx_leads_subscriber_id ON leads(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_leads_followup_status ON leads(followup_status);
CREATE INDEX IF NOT EXISTS idx_appointments_subscriber_id ON appointments(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);

-- Update agents table when subscriber VAPI info changes
CREATE OR REPLACE FUNCTION sync_subscriber_to_agent()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscriber has a VAPI assistant but no agent record, create one
  IF NEW.vapi_assistant_id IS NOT NULL THEN
    INSERT INTO agents (
      subscriber_id,
      vapi_assistant_id,
      twilio_number,
      agent_name,
      business_description
    )
    VALUES (
      NEW.id,
      NEW.vapi_assistant_id,
      NEW.vapi_phone_number,
      NEW.bot_name,
      COALESCE(NEW.business_name, 'My Business')
    )
    ON CONFLICT (subscriber_id)
    DO UPDATE SET
      vapi_assistant_id = NEW.vapi_assistant_id,
      twilio_number = NEW.vapi_phone_number,
      agent_name = NEW.bot_name,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create agent when subscriber VAPI is provisioned
DROP TRIGGER IF EXISTS trigger_sync_subscriber_to_agent ON subscribers;
CREATE TRIGGER trigger_sync_subscriber_to_agent
  AFTER INSERT OR UPDATE OF vapi_assistant_id ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscriber_to_agent();
