-- Check RLS policies on tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('subscriber_phone_numbers', 'subscriber_usage', 'call_logs', 'sms_logs')
ORDER BY tablename, policyname;
