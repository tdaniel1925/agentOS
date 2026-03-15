-- MIGRATION 001: Core Tables
-- AgentOS Database Schema
-- Run this in Supabase SQL Editor

-- Reps (Apex distributors)
CREATE TABLE reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  apex_rep_code TEXT UNIQUE NOT NULL,
  upline_rep_id UUID REFERENCES reps(id),
  tier_level INTEGER DEFAULT 1,
  total_subscribers INTEGER DEFAULT 0,
  total_mrr DECIMAL DEFAULT 0,
  total_commission DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_commission_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscribers (paying customers)
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id),

  -- Identity
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  business_name TEXT,
  business_type TEXT CHECK (business_type IN (
    'insurance', 'cpa', 'law', 'realestate', 'other'
  )),

  -- Bot config
  bot_name TEXT DEFAULT 'Jordan',
  bot_personality TEXT DEFAULT 'friendly',
  bot_timezone TEXT DEFAULT 'America/Chicago',
  industry_pack TEXT,

  -- Billing
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_mrr DECIMAL DEFAULT 97,
  billing_status TEXT DEFAULT 'active',

  -- Control channels
  control_phone TEXT,
  control_email TEXT,
  control_discord_id TEXT,
  preferred_channel TEXT DEFAULT 'sms',

  -- VAPI
  vapi_assistant_id TEXT,
  vapi_phone_number_id TEXT,
  vapi_phone_number TEXT,

  -- Rep relationship
  rep_id UUID REFERENCES reps(id),
  apex_rep_code TEXT,

  -- Status
  status TEXT DEFAULT 'pending',
  onboarded_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flags (which skills are active per subscriber)
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  price_add_on DECIMAL DEFAULT 0,
  skill_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscriber_id, feature_name)
);

-- Control states (stop/start/pause commands)
CREATE TABLE control_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE UNIQUE,
  outbound_calls_enabled BOOLEAN DEFAULT true,
  social_posting_enabled BOOLEAN DEFAULT true,
  email_sending_enabled BOOLEAN DEFAULT true,
  campaigns_enabled BOOLEAN DEFAULT true,
  calling_hours_start TIME DEFAULT '09:00',
  calling_hours_end TIME DEFAULT '17:00',
  blackout_days TEXT[] DEFAULT '{}',
  mode TEXT DEFAULT 'full',
  mode_expires_at TIMESTAMPTZ,
  paused_until TIMESTAMPTZ,
  paused_features TEXT[] DEFAULT '{}',
  priority_task TEXT,
  paused_campaigns UUID[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commands log (every subscriber action)
CREATE TABLE commands_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  channel TEXT CHECK (channel IN ('sms','email','discord','phone','app')),
  raw_message TEXT,
  parsed_intent TEXT,
  skill_triggered TEXT,
  result TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  duration_ms INTEGER,
  cost_usd DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unknown requests (feature request intelligence)
CREATE TABLE unknown_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  raw_message TEXT NOT NULL,
  channel TEXT,
  suggested_feature TEXT,
  subscriber_suggested BOOLEAN DEFAULT false,
  handled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call summaries
CREATE TABLE call_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  vapi_call_id TEXT UNIQUE,
  call_type TEXT CHECK (call_type IN ('inbound','outbound')),
  caller_number TEXT,
  contact_name TEXT,
  duration_seconds INTEGER DEFAULT 0,
  transcript TEXT,
  summary TEXT,
  sentiment TEXT,
  action_required BOOLEAN DEFAULT false,
  action_items JSONB,
  lead_captured BOOLEAN DEFAULT false,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  prospect_name TEXT NOT NULL,
  prospect_email TEXT NOT NULL,
  prospect_phone TEXT,
  industry TEXT,
  goal TEXT,
  sequence_length INTEGER DEFAULT 45,
  interval_days INTEGER DEFAULT 4,
  status TEXT DEFAULT 'draft',
  current_email_index INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  unsubscribed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Campaign emails (individual emails in sequence)
CREATE TABLE campaign_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES subscribers(id),
  sequence_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  resend_email_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost events (every API call tracked)
CREATE TABLE cost_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  event_type TEXT NOT NULL,
  skill_name TEXT,
  provider TEXT NOT NULL,
  model TEXT,
  units DECIMAL,
  unit_type TEXT,
  cost_usd DECIMAL NOT NULL,
  markup_pct INTEGER DEFAULT 100,
  bill_amount DECIMAL,
  billable BOOLEAN DEFAULT true,
  billed BOOLEAN DEFAULT false,
  task_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apex commissions
CREATE TABLE apex_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID REFERENCES reps(id),
  subscriber_id UUID REFERENCES subscribers(id),
  event_type TEXT NOT NULL,
  old_mrr DECIMAL DEFAULT 0,
  new_mrr DECIMAL DEFAULT 0,
  mrr_delta DECIMAL DEFAULT 0,
  rep_commission DECIMAL DEFAULT 0,
  waterfall_breakdown JSONB,
  stripe_event_id TEXT UNIQUE,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade events (idempotency)
CREATE TABLE upgrade_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  feature_name TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly scorecards
CREATE TABLE weekly_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  calls_handled INTEGER DEFAULT 0,
  calls_missed INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_received INTEGER DEFAULT 0,
  appointments_booked INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  campaigns_active INTEGER DEFAULT 0,
  social_posts_published INTEGER DEFAULT 0,
  top_action_item TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task performance (AI execution monitoring)
CREATE TABLE task_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  skill_name TEXT NOT NULL,
  model_used TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  tool_calls_made INTEGER DEFAULT 0,
  tool_calls_succeeded INTEGER DEFAULT 0,
  duration_ms INTEGER,
  cost_usd DECIMAL,
  success BOOLEAN DEFAULT true,
  error_type TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriber apps (built by Jordan)
CREATE TABLE subscriber_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  app_name TEXT NOT NULL,
  description TEXT,
  github_repo TEXT,
  supabase_project_id TEXT,
  vercel_project_id TEXT,
  live_url TEXT,
  status TEXT DEFAULT 'building',
  build_log JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_at TIMESTAMPTZ
);
