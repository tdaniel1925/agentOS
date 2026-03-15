-- MIGRATION 003: Indexes for Performance
-- Create indexes on frequently queried columns
-- Run this AFTER 002_row_level_security.sql

-- SUBSCRIBERS TABLE INDEXES
-- Most queries will filter by Stripe customer ID, VAPI assistant ID, phone, email, or rep
CREATE INDEX idx_subscribers_stripe ON subscribers(stripe_customer_id);
CREATE INDEX idx_subscribers_vapi ON subscribers(vapi_assistant_id);
CREATE INDEX idx_subscribers_phone ON subscribers(control_phone);
CREATE INDEX idx_subscribers_email ON subscribers(control_email);
CREATE INDEX idx_subscribers_rep ON subscribers(rep_id);
CREATE INDEX idx_subscribers_auth_user ON subscribers(auth_user_id);
CREATE INDEX idx_subscribers_status ON subscribers(status);

-- FEATURE FLAGS TABLE INDEXES
-- Queries will filter by subscriber_id and feature_name together
CREATE INDEX idx_feature_flags_subscriber ON feature_flags(subscriber_id, feature_name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);

-- COMMANDS LOG TABLE INDEXES
-- Queries will filter by subscriber and sort by created_at descending
CREATE INDEX idx_commands_log_subscriber ON commands_log(subscriber_id, created_at DESC);
CREATE INDEX idx_commands_log_channel ON commands_log(channel);
CREATE INDEX idx_commands_log_skill ON commands_log(skill_triggered);

-- CAMPAIGNS TABLE INDEXES
-- Queries will filter by subscriber and status
CREATE INDEX idx_campaigns_subscriber ON campaigns(subscriber_id, status);
CREATE INDEX idx_campaigns_next_send ON campaigns(next_send_at, status);

-- CAMPAIGN EMAILS TABLE INDEXES
-- Queries will filter by scheduled_at and status for cron jobs
CREATE INDEX idx_campaign_emails_scheduled ON campaign_emails(scheduled_at, status);
CREATE INDEX idx_campaign_emails_campaign ON campaign_emails(campaign_id);

-- COST EVENTS TABLE INDEXES
-- Queries will filter by subscriber and billed status for invoicing
CREATE INDEX idx_cost_events_subscriber ON cost_events(subscriber_id, billed);
CREATE INDEX idx_cost_events_billable ON cost_events(billable, billed);
CREATE INDEX idx_cost_events_created ON cost_events(created_at DESC);

-- UPGRADE EVENTS TABLE INDEXES
-- Idempotency checks by stripe_event_id
CREATE INDEX idx_upgrade_events_stripe ON upgrade_events(stripe_event_id);
CREATE INDEX idx_upgrade_events_subscriber ON upgrade_events(subscriber_id);

-- CALL SUMMARIES TABLE INDEXES
-- Queries will filter by subscriber and vapi_call_id
CREATE INDEX idx_call_summaries_subscriber ON call_summaries(subscriber_id, created_at DESC);
CREATE INDEX idx_call_summaries_vapi ON call_summaries(vapi_call_id);
CREATE INDEX idx_call_summaries_action_required ON call_summaries(action_required, subscriber_id);

-- WEEKLY SCORECARDS TABLE INDEXES
-- Queries will filter by subscriber and week dates
CREATE INDEX idx_weekly_scorecards_subscriber ON weekly_scorecards(subscriber_id, week_start DESC);

-- TASK PERFORMANCE TABLE INDEXES
-- Queries will filter by subscriber and skill_name for monitoring
CREATE INDEX idx_task_performance_subscriber ON task_performance(subscriber_id, created_at DESC);
CREATE INDEX idx_task_performance_skill ON task_performance(skill_name, success);

-- REPS TABLE INDEXES
-- Queries will filter by apex_rep_code for referrals
CREATE INDEX idx_reps_apex_code ON reps(apex_rep_code);
CREATE INDEX idx_reps_email ON reps(email);

-- APEX COMMISSIONS TABLE INDEXES
-- Queries will filter by rep_id for commission calculations
CREATE INDEX idx_apex_commissions_rep ON apex_commissions(rep_id, processed_at DESC);
CREATE INDEX idx_apex_commissions_subscriber ON apex_commissions(subscriber_id);
CREATE INDEX idx_apex_commissions_stripe ON apex_commissions(stripe_event_id);

-- UNKNOWN REQUESTS TABLE INDEXES
-- Queries will filter by handled status for feature request pipeline
CREATE INDEX idx_unknown_requests_handled ON unknown_requests(handled, created_at DESC);
CREATE INDEX idx_unknown_requests_subscriber ON unknown_requests(subscriber_id);

-- SUBSCRIBER APPS TABLE INDEXES
-- Queries will filter by subscriber and status
CREATE INDEX idx_subscriber_apps_subscriber ON subscriber_apps(subscriber_id, status);
