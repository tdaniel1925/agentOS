#!/usr/bin/env python3
"""
Setup pg_cron jobs for Session 4 Edge Functions
- retry-webhooks: Every 15 minutes
- feature-request-report: Mondays at 7am CST
"""

import psycopg2

# Database connection string
DATABASE_URL = "postgresql://postgres.xxxtbzypheuiniuqynas:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

# Service role key for auth
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc"

CRON_JOBS = [
    {
        "name": "retry-webhooks",
        "schedule": "*/15 * * * *",  # Every 15 minutes
        "description": "Retry failed outbound webhooks to Apex",
        "sql": f"""
SELECT cron.schedule(
  'retry-webhooks',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://xxxtbzypheuiniuqynas.supabase.co/functions/v1/retry-webhooks',
      headers := '{{"Content-Type": "application/json", "Authorization": "Bearer {SERVICE_ROLE_KEY}"}}'::jsonb,
      body := '{{}}'::jsonb
    ) AS request_id;
  $$
);
"""
    },
    {
        "name": "feature-request-report",
        "schedule": "0 13 * * 1",  # Mondays at 1pm UTC (7am CST)
        "description": "Weekly feature request report to BotMakers admin",
        "sql": f"""
SELECT cron.schedule(
  'feature-request-report',
  '0 13 * * 1',
  $$
  SELECT
    net.http_post(
      url := 'https://xxxtbzypheuiniuqynas.supabase.co/functions/v1/feature-request-report',
      headers := '{{"Content-Type": "application/json", "Authorization": "Bearer {SERVICE_ROLE_KEY}"}}'::jsonb,
      body := '{{}}'::jsonb
    ) AS request_id;
  $$
);
"""
    }
]

try:
    print("Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()

    print("\nSetting up Session 4 pg_cron jobs...\n")

    for job in CRON_JOBS:
        print(f"Setting up: {job['name']}")
        print(f"  Schedule: {job['schedule']}")
        print(f"  Description: {job['description']}")

        try:
            # First, try to unschedule if it exists
            cursor.execute(f"SELECT cron.unschedule('{job['name']}');")
            print(f"  Removed existing job")
        except Exception as e:
            print(f"  No existing job to remove")

        # Create the new schedule
        cursor.execute(job['sql'])
        print(f"  Created successfully\n")

    # Verify all cron jobs
    print("All active pg_cron jobs:")
    cursor.execute("""
        SELECT jobid, jobname, schedule, command
        FROM cron.job
        ORDER BY jobid;
    """)

    jobs = cursor.fetchall()
    for job in jobs:
        print(f"  [{job[0]}] {job[1]}")
        print(f"      Schedule: {job[2]}")

    print(f"\nTotal cron jobs: {len(jobs)}")

    cursor.close()
    conn.close()

    print("\nSession 4 cron setup complete!")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
