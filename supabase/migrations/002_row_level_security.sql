-- MIGRATION 002: Row Level Security
-- Enable RLS on all tables and create policies
-- Run this AFTER 001_core_tables.sql

-- Enable RLS on all tables
ALTER TABLE reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE unknown_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE apex_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_apps ENABLE ROW LEVEL SECURITY;

-- SUBSCRIBERS TABLE POLICIES
-- Subscribers can only see their own data
CREATE POLICY "subscriber_own_data" ON subscribers
  FOR ALL USING (auth_user_id = auth.uid());

-- FEATURE FLAGS POLICIES
-- Subscribers can only see their own features
CREATE POLICY "subscriber_own_features" ON feature_flags
  FOR ALL USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- CONTROL STATES POLICIES
-- Subscribers can only manage their own control state
CREATE POLICY "subscriber_own_control_state" ON control_states
  FOR ALL USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- COMMANDS LOG POLICIES
-- Subscribers can only see their own commands
CREATE POLICY "subscriber_own_commands" ON commands_log
  FOR ALL USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- UNKNOWN REQUESTS POLICIES
-- Subscribers can see their own unknown requests
CREATE POLICY "subscriber_own_unknown_requests" ON unknown_requests
  FOR ALL USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- CALL SUMMARIES POLICIES
-- Subscribers can see their own call summaries
CREATE POLICY "subscriber_own_calls" ON call_summaries
  FOR ALL USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- CAMPAIGNS POLICIES
-- Subscribers can manage their own campaigns
CREATE POLICY "subscriber_own_campaigns" ON campaigns
  FOR ALL USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- CAMPAIGN EMAILS POLICIES
-- Subscribers can see their own campaign emails
CREATE POLICY "subscriber_own_campaign_emails" ON campaign_emails
  FOR ALL USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- COST EVENTS POLICIES
-- Subscribers can see their own cost events
CREATE POLICY "subscriber_own_costs" ON cost_events
  FOR ALL USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- WEEKLY SCORECARDS POLICIES
-- Subscribers can see their own scorecards
CREATE POLICY "subscriber_own_scorecards" ON weekly_scorecards
  FOR ALL USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- TASK PERFORMANCE POLICIES
-- Subscribers can see their own task performance
CREATE POLICY "subscriber_own_task_performance" ON task_performance
  FOR ALL USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- SUBSCRIBER APPS POLICIES
-- Subscribers can see their own apps
CREATE POLICY "subscriber_own_apps" ON subscriber_apps
  FOR ALL USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

-- REPS POLICIES
-- Reps can only see their own data
CREATE POLICY "rep_own_data" ON reps
  FOR SELECT USING (
    email = auth.jwt()->>'email'
  );

-- APEX COMMISSIONS POLICIES
-- Reps can only see their own commissions
CREATE POLICY "rep_own_commissions" ON apex_commissions
  FOR SELECT USING (
    rep_id IN (
      SELECT id FROM reps WHERE email = auth.jwt()->>'email'
    )
  );

-- UPGRADE EVENTS POLICIES
-- Only service role can access (no user policies)
-- This table is for idempotency checking server-side only

-- NOTE: Service role key bypasses ALL RLS policies
-- Use service role only in API routes, NEVER on client
