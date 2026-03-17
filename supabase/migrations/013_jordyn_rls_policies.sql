-- MIGRATION 013: Row Level Security for Jordyn Tables
-- Ensures each subscriber can only see their own data

-- Enable RLS on all Jordyn tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- AGENTS POLICIES
-- =====================================================

-- Subscribers can view their own agent
CREATE POLICY "Subscribers can view own agent"
  ON agents FOR SELECT
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Subscribers can update their own agent
CREATE POLICY "Subscribers can update own agent"
  ON agents FOR UPDATE
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Service role can do anything (for webhooks and system operations)
CREATE POLICY "Service role full access to agents"
  ON agents FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- CALLS POLICIES
-- =====================================================

-- Subscribers can view their own calls
CREATE POLICY "Subscribers can view own calls"
  ON calls FOR SELECT
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Service role can do anything (for webhooks)
CREATE POLICY "Service role full access to calls"
  ON calls FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- MESSAGES POLICIES
-- =====================================================

-- Subscribers can view their own messages
CREATE POLICY "Subscribers can view own messages"
  ON messages FOR SELECT
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Service role can do anything (for webhooks and SMS sending)
CREATE POLICY "Service role full access to messages"
  ON messages FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SMS COMMANDS POLICIES
-- =====================================================

-- Subscribers can view their own SMS commands
CREATE POLICY "Subscribers can view own sms commands"
  ON sms_commands FOR SELECT
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Subscribers can create SMS commands (when they text)
CREATE POLICY "Subscribers can create own sms commands"
  ON sms_commands FOR INSERT
  WITH CHECK (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Service role can do anything (for webhook processing)
CREATE POLICY "Service role full access to sms commands"
  ON sms_commands FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- LEADS POLICIES
-- =====================================================

-- Subscribers can view their own leads
CREATE POLICY "Subscribers can view own leads"
  ON leads FOR SELECT
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Subscribers can update their own leads
CREATE POLICY "Subscribers can update own leads"
  ON leads FOR UPDATE
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Service role can do anything (for auto-creating leads from calls)
CREATE POLICY "Service role full access to leads"
  ON leads FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- APPOINTMENTS POLICIES
-- =====================================================

-- Subscribers can view their own appointments
CREATE POLICY "Subscribers can view own appointments"
  ON appointments FOR SELECT
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Subscribers can update their own appointments
CREATE POLICY "Subscribers can update own appointments"
  ON appointments FOR UPDATE
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- Service role can do anything (for auto-creating appointments from calls)
CREATE POLICY "Service role full access to appointments"
  ON appointments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
