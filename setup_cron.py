#!/usr/bin/env python3
"""
Setup pg_cron jobs for AgentOS
Executes SQL directly via PostgreSQL connection
"""

import os
import sys

# Database connection string from .env.local
DATABASE_URL = "postgresql://postgres.xxxtbzypheuiniuqynas:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

# SQL statements to execute
CRON_JOBS = [
    {
        "name": "process-campaign-emails",
        "sql": """
SELECT cron.schedule(
  'process-campaign-emails',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://xxxtbzypheuiniuqynas.supabase.co/functions/v1/process-campaigns',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
"""
    },
    {
        "name": "send-morning-briefings",
        "sql": """
SELECT cron.schedule(
  'send-morning-briefings',
  '0 11 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://xxxtbzypheuiniuqynas.supabase.co/functions/v1/send-morning-briefings',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
"""
    },
    {
        "name": "cleanup-expired-approvals",
        "sql": """
SELECT cron.schedule(
  'cleanup-expired-approvals',
  '0 8 * * *',
  $$
  DELETE FROM pending_approvals
  WHERE expires_at < NOW()
    AND approved_at IS NULL
    AND rejected_at IS NULL;
  $$
);
"""
    },
    {
        "name": "auto-resume-control-states",
        "sql": """
SELECT cron.schedule(
  'auto-resume-control-states',
  '*/15 * * * *',
  $$
  UPDATE control_states
  SET mode = 'full', paused_until = NULL, mode_expires_at = NULL
  WHERE mode IN ('paused', 'inbound-only', 'vacation')
    AND (paused_until < NOW() OR mode_expires_at < NOW());
  $$
);
"""
    }
]

def main():
    try:
        import psycopg2
    except ImportError:
        print("ERROR: psycopg2 not installed. Install with: pip install psycopg2-binary")
        print("\nAlternatively, copy these SQL statements into Supabase SQL Editor:")
        print("https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/sql\n")
        for job in CRON_JOBS:
            print(f"-- {job['name']}")
            print(job['sql'])
            print()
        return 1

    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        print("Connected!\n")

        for job in CRON_JOBS:
            print(f"Creating job: {job['name']}...")
            try:
                cur.execute(job['sql'])
                conn.commit()
                print(f"SUCCESS: Job '{job['name']}' created successfully\n")
            except Exception as e:
                print(f"WARNING: Job '{job['name']}' error: {e}")
                print("   (Job may already exist - this is OK)\n")
                conn.rollback()

        # Verify jobs
        print("Verifying created jobs...")
        cur.execute("SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobname;")
        jobs = cur.fetchall()

        if jobs:
            print("\nActive cron jobs:")
            for job in jobs:
                print(f"   - {job[1]:30s} | {job[2]:15s} | Active: {job[3]}")
        else:
            print("WARNING: No cron jobs found")

        cur.close()
        conn.close()

        print("\nSETUP COMPLETE!")
        print("\nTo view job run history:")
        print("SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;")

        return 0

    except Exception as e:
        print(f"ERROR: {e}")
        print("\nPlease run the SQL manually in Supabase SQL Editor:")
        print("https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/sql")
        return 1

if __name__ == "__main__":
    sys.exit(main())
