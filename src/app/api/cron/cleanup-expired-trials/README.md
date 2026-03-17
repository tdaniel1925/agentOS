# Cleanup Expired Trials Cron Job

Automatically cleans up resources from trials that expired without converting to paid subscriptions.

## What It Does

1. **Finds expired trials** - Subscribers with `billing_status='trialing'` and `trial_ends_at < NOW()`
2. **Releases VAPI phone numbers** - Saves ~$1/month per number
3. **Deletes VAPI assistants** - Cleanup resources
4. **Updates database** - Marks subscriber as `trial_expired` and `billing_status='cancelled'`
5. **Logs everything** - Records cleanup in `commands_log` table

## Schedule

Runs **daily at 2:00 AM UTC** via Vercel Cron

Configured in `vercel.json`:
```json
{
  "path": "/api/cron/cleanup-expired-trials",
  "schedule": "0 2 * * *"
}
```

## Security

Protected by `CRON_SECRET` environment variable. Vercel automatically includes the secret in the `Authorization` header when calling cron jobs.

Add to your `.env`:
```
CRON_SECRET=your-random-secret-here
```

## Testing Locally

### Method 1: Direct API call
```bash
curl -X POST http://localhost:3000/api/cron/cleanup-expired-trials \
  -H "Authorization: Bearer your-cron-secret"
```

### Method 2: Using the Vercel CLI
```bash
vercel env pull .env.local
vercel dev
# Then call the endpoint
```

## Testing in Production

```bash
curl -X POST https://jordyn.app/api/cron/cleanup-expired-trials \
  -H "Authorization: Bearer your-cron-secret"
```

## Response Format

```json
{
  "success": true,
  "total": 5,
  "phone_numbers_released": 5,
  "assistants_deleted": 5,
  "subscribers_updated": 5,
  "errors": []
}
```

## What Happens to Failed Trials

### Before Cleanup (Trial Active)
```
subscriber {
  billing_status: 'trialing',
  trial_ends_at: '2024-01-15',
  vapi_phone_number: '+15551234567',
  vapi_phone_number_id: 'ph_abc123',
  vapi_assistant_id: 'ast_xyz789',
  status: 'pending'
}
```

### After Cleanup (Trial Expired)
```
subscriber {
  billing_status: 'cancelled',
  trial_ends_at: '2024-01-15',
  vapi_phone_number: null,
  vapi_phone_number_id: null,
  vapi_assistant_id: 'ast_xyz789', // kept for reference
  status: 'trial_expired'
}
```

### Trial Conversions Table
```
trial_conversions {
  subscriber_id: 'sub_123',
  converted: false,
  trial_ended_at: '2024-01-15T02:00:00Z'
}
```

## Monitoring

Check Vercel Logs:
1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs"
4. Filter by `/api/cron/cleanup-expired-trials`

Look for:
- ✅ `Cleanup job complete!`
- 📊 Summary stats (phone numbers released, etc.)
- ⚠️ Any errors

## Error Handling

The cron job is **fault-tolerant**:
- If a phone number fails to release, it continues with the next trial
- If an assistant fails to delete, it continues
- All errors are logged and returned in the response
- Partial success is possible (e.g., 4/5 trials cleaned up)

## Database Impact

**Tables Modified:**
- `subscribers` - Status updated to `trial_expired`
- `trial_conversions` - Marked as not converted
- `commands_log` - Cleanup event recorded

**Not Modified:**
- `vapi_assistant_id` kept in `subscribers` for historical reference
- Original trial dates preserved
- All other data intact

## Cost Savings

**Per expired trial:**
- VAPI phone number: ~$2-3/month → $0 (released)
- VAPI assistant: Minimal cost, but cleanup is good practice

**Example:**
- 50 expired trials/month
- $2.50/number average
- **Saves: $125/month** in phone number costs

## Manual Cleanup

If you need to manually clean up a specific subscriber:

```sql
-- Find the subscriber
SELECT id, email, vapi_phone_number, vapi_assistant_id
FROM subscribers
WHERE email = 'user@example.com';

-- Then call the cron job or manually:
-- 1. Release phone in VAPI dashboard
-- 2. Delete assistant in VAPI dashboard
-- 3. Update subscriber status
UPDATE subscribers
SET status = 'trial_expired',
    billing_status = 'cancelled',
    vapi_phone_number = null,
    vapi_phone_number_id = null
WHERE id = 'sub_123';
```

## Rollback

If you need to restore a trial user (e.g., they want to convert after expiration):

1. They'd need to sign up again (new trial)
2. Or manually provision new phone number
3. Update their status back to active

**Note:** Once VAPI resources are deleted, they cannot be restored. The user would get a new phone number.
