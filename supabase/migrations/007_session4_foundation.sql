-- =====================================================
-- AgentOS — Session 4: Foundation Tables
-- Migration 007: agentos_reps + webhook_events
-- =====================================================
--
-- This migration creates the two-way webhook sync
-- foundation between AgentOS and Apex.
--
-- agentos_reps: Mirror of Apex rep data (Apex is source of truth)
-- webhook_events: Complete audit trail of all webhook traffic
--

-- ─────────────────────────────────────────────────────
-- TABLE: agentos_reps
-- ─────────────────────────────────────────────────────
-- Stores rep data received from Apex via webhook.
-- Updated on rep.created, rep.updated, rep.deactivated.

CREATE TABLE IF NOT EXISTS agentos_reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Apex identifiers
  apex_rep_id TEXT UNIQUE NOT NULL,
  -- Apex's internal rep ID (UUID from Apex database)

  apex_rep_code TEXT UNIQUE NOT NULL,
  -- Used in /join/[code] signup links
  -- Used in all webhook payloads back to Apex
  -- Example: "MJ4829"

  -- Rep details
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  -- CRITICAL: phone needed for SMS demo triggers
  -- and financial event notifications

  -- Status
  active BOOLEAN DEFAULT true,
  -- Set to false on rep.deactivated webhook

  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  -- Updated every time Apex sends rep.updated

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agentos_reps_code
  ON agentos_reps(apex_rep_code);
-- Fast lookup for /join/[code] signups

CREATE INDEX IF NOT EXISTS idx_agentos_reps_phone
  ON agentos_reps(phone);
-- Fast lookup for SMS-triggered demo flows

CREATE INDEX IF NOT EXISTS idx_agentos_reps_active
  ON agentos_reps(active);
-- Filter to active reps only

-- RLS — service role only
-- Reps do not directly query this table
-- Rep dashboard reads it via server components
ALTER TABLE agentos_reps ENABLE ROW LEVEL SECURITY;

-- No policies — service role bypasses RLS
-- Client queries happen via server components


-- ─────────────────────────────────────────────────────
-- TABLE: webhook_events
-- ─────────────────────────────────────────────────────
-- Logs every webhook sent TO Apex and received FROM Apex.
-- Complete audit trail. Never delete records.
-- Retry job reads failed outbound webhooks.

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Direction
  direction TEXT NOT NULL CHECK (
    direction IN ('inbound', 'outbound')
  ),
  -- inbound = received from Apex (rep sync events)
  -- outbound = sent to Apex (financial events)

  -- Event details
  event_type TEXT NOT NULL,
  -- Examples:
  --   inbound: rep.created, rep.updated, rep.deactivated
  --   outbound: subscriber.created, subscriber.upgraded,
  --             subscriber.downgraded, subscriber.cancelled

  payload JSONB NOT NULL,
  -- Full webhook payload as received/sent

  -- Delivery status (outbound only)
  delivered BOOLEAN DEFAULT false,
  -- true = successfully delivered (got 200 OK from Apex)

  delivered_at TIMESTAMPTZ,
  -- Timestamp when 200 OK received

  http_status INTEGER,
  -- HTTP status code from Apex response

  response_body JSONB,
  -- Response payload from Apex

  -- Retry tracking (outbound only)
  attempts INTEGER DEFAULT 0,
  -- Number of delivery attempts (increments on each try)

  last_attempt_at TIMESTAMPTZ,
  -- Timestamp of most recent delivery attempt

  last_error TEXT,
  -- Error message from most recent failed attempt

  max_attempts INTEGER DEFAULT 5,
  -- Stop retrying after this many attempts

  -- Idempotency
  idempotency_key TEXT UNIQUE,
  -- Format examples:
  --   inbound:  inbound_rep.created_[apex_rep_id]_[timestamp]
  --   outbound: subscriber.upgraded_sub_xxx_inv_xxx
  -- Prevents duplicate processing of same event

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_direction
  ON webhook_events(direction, created_at DESC);
-- Fast queries for inbound vs outbound webhooks

CREATE INDEX IF NOT EXISTS idx_webhook_undelivered
  ON webhook_events(delivered, attempts, created_at)
  WHERE delivered = false AND direction = 'outbound';
-- Retry job uses this index to find failed outbound webhooks
-- that haven't hit max_attempts yet

CREATE INDEX IF NOT EXISTS idx_webhook_idempotency
  ON webhook_events(idempotency_key);
-- Fast duplicate detection

-- RLS — service role only
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies — service role only
-- Webhook endpoints and retry jobs use service role


-- ─────────────────────────────────────────────────────
-- MIGRATION COMPLETE
-- ─────────────────────────────────────────────────────
