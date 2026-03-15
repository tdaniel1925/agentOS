#!/bin/bash
# Setup pg_cron jobs via Supabase API

SUPABASE_URL="https://xxxtbzypheuiniuqynas.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc"

echo "Setting up pg_cron jobs..."

# Job 1: Process campaign emails every hour
curl -X POST "$SUPABASE_URL/rest/v1/rpc/cron_schedule" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "job_name": "process-campaign-emails",
    "schedule": "0 * * * *",
    "command": "SELECT net.http_post(url := '\''https://xxxtbzypheuiniuqynas.supabase.co/functions/v1/process-campaigns'\'', headers := '\''{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc\"}'\''::jsonb, body := '\''{}'\''::jsonb) AS request_id;"
  }'

echo "Done! pg_cron jobs setup complete."
echo "To verify, run this SQL in Supabase SQL Editor:"
echo "SELECT * FROM cron.job ORDER BY jobname;"
