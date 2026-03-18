-- Force Fix RLS Policies - Drops ALL policies and recreates them correctly

BEGIN;

-- =====================================================
-- DROP ALL EXISTING POLICIES
-- =====================================================

-- subscriber_phone_numbers
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subscriber_phone_numbers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON subscriber_phone_numbers';
    END LOOP;
END $$;

-- subscriber_usage
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subscriber_usage') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON subscriber_usage';
    END LOOP;
END $$;

-- call_logs
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'call_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON call_logs';
    END LOOP;
END $$;

-- sms_logs
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sms_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON sms_logs';
    END LOOP;
END $$;

-- =====================================================
-- RECREATE POLICIES CORRECTLY
-- =====================================================

-- subscriber_phone_numbers
CREATE POLICY "authenticated_select_own_phone_numbers"
  ON subscriber_phone_numbers FOR SELECT
  TO authenticated
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_all_phone_numbers"
  ON subscriber_phone_numbers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- subscriber_usage
CREATE POLICY "authenticated_select_own_usage"
  ON subscriber_usage FOR SELECT
  TO authenticated
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_all_usage"
  ON subscriber_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- call_logs
CREATE POLICY "authenticated_select_own_call_logs"
  ON call_logs FOR SELECT
  TO authenticated
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_all_call_logs"
  ON call_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- sms_logs
CREATE POLICY "authenticated_select_own_sms_logs"
  ON sms_logs FOR SELECT
  TO authenticated
  USING (
    subscriber_id IN (
      SELECT id FROM subscribers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_all_sms_logs"
  ON sms_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- VERIFY RLS IS ENABLED
-- =====================================================

ALTER TABLE subscriber_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

COMMIT;

SELECT 'RLS policies recreated successfully!' as status;
