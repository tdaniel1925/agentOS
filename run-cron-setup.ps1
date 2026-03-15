# PowerShell script to setup pg_cron jobs via Supabase SQL API

$SUPABASE_URL = "https://xxxtbzypheuiniuqynas.supabase.co"
$SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2OTQ3MSwiZXhwIjoyMDg5MDQ1NDcxfQ.M4bbQM5-3G_b0zbNFYyuiUcK03q1GpIbtXeSdHXYaJc"

Write-Host "Setting up pg_cron jobs..." -ForegroundColor Green

# Read the SQL file
$sql = Get-Content "supabase/setup-cron-jobs.sql" -Raw

# Split into individual statements (each SELECT cron.schedule)
$statements = $sql -split "(?=SELECT cron\.schedule)" | Where-Object { $_.Trim() -match "^SELECT cron\.schedule" }

foreach ($statement in $statements) {
    $statement = $statement.Trim()
    if ($statement) {
        Write-Host "`nExecuting: $($statement.Substring(0, [Math]::Min(80, $statement.Length)))..." -ForegroundColor Yellow

        # Execute via psql-like connection string
        # Note: This requires PostgreSQL client tools
        # Alternative: Copy-paste into Supabase dashboard
        Write-Host "Please run this in Supabase SQL Editor:" -ForegroundColor Cyan
        Write-Host $statement -ForegroundColor White
        Write-Host ""
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Manual Setup Required:" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/sql" -ForegroundColor White
Write-Host "2. Copy each SQL statement above" -ForegroundColor White
Write-Host "3. Paste and run in the SQL Editor" -ForegroundColor White
Write-Host "4. Verify with: SELECT * FROM cron.job;" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Green
