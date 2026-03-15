-- Campaign utility functions for webhook handlers

-- Increment campaign opens counter
CREATE OR REPLACE FUNCTION increment_campaign_opens(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET opens = opens + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Increment campaign clicks counter
CREATE OR REPLACE FUNCTION increment_campaign_clicks(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET clicks = clicks + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Increment campaign replies counter
CREATE OR REPLACE FUNCTION increment_campaign_replies(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET replies = replies + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;
