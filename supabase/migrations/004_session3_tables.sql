-- Session 3 Growth Features Tables
-- Adds tables for pending approvals, scheduled posts, and contacts

-- Pending approvals (for campaigns, posts, etc)
CREATE TABLE IF NOT EXISTS pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  approval_type TEXT NOT NULL, -- 'social_post', 'campaign', 'lead_list', etc
  item_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- Scheduled social media posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  post_text TEXT NOT NULL,
  hashtags TEXT[],
  platforms TEXT[] DEFAULT ARRAY['facebook', 'instagram', 'linkedin'],
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'published', 'failed'
  predis_post_id TEXT,
  engagement_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_approvals_subscriber ON pending_approvals(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_type ON pending_approvals(approval_type);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_expires ON pending_approvals(expires_at);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_subscriber ON scheduled_posts(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

-- Contacts/leads table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  business_name TEXT,
  industry TEXT,
  location TEXT,
  linkedin_url TEXT,
  source TEXT DEFAULT 'lead_generation', -- 'lead_generation', 'manual', 'referral', etc
  qualification_score INTEGER, -- 0-100
  qualification_notes TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'unresponsive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

-- Indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_subscriber ON contacts(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_score ON contacts(qualification_score);

-- Email connections (OAuth tokens for Gmail/Outlook)
CREATE TABLE IF NOT EXISTS email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'gmail', 'outlook'
  email_address TEXT NOT NULL,
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'revoked'
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email summaries (cached summaries, auto-expire after 24hrs)
CREATE TABLE IF NOT EXISTS email_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  summary_date DATE DEFAULT CURRENT_DATE,
  total_unread INTEGER DEFAULT 0,
  urgent_count INTEGER DEFAULT 0,
  client_count INTEGER DEFAULT 0,
  lead_count INTEGER DEFAULT 0,
  admin_count INTEGER DEFAULT 0,
  summary_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Indexes for email tables
CREATE INDEX IF NOT EXISTS idx_email_connections_subscriber ON email_connections(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_connections_provider ON email_connections(provider);
CREATE INDEX IF NOT EXISTS idx_email_summaries_subscriber ON email_summaries(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_summaries_date ON email_summaries(summary_date);
CREATE INDEX IF NOT EXISTS idx_email_summaries_expires ON email_summaries(expires_at);
