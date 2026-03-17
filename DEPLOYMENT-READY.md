# 🚀 Signup V2 - Ready to Deploy

## What's Ready ✅

All code is complete and ready to deploy:

### ✅ Code Complete
- 4-step signup flow (Tell us about business → Train → Preview → Create account)
- Email/password authentication only (no OAuth)
- AI agent training with ElevenLabs audio previews
- 7-day free trial system with automated reminders
- Trial expiration handling

### ✅ Cron Job Configured
- `vercel.json` created with daily cron at 9:00 AM UTC
- Automatically checks trial expirations
- Sends Day 5 reminders and Day 7 expiration emails

### ✅ Environment Variables Ready
```env
ELEVENLABS_API_KEY=sk_073ed23321e0920c482969df382d59113b324617bb8c0a88
CRON_SECRET=fddc4e57768ab8bfffc7ceb27b469b1dbd31c57a75caba748c74da86b827b007
```

## What You Need to Do 📋

### 1. Database Migration (5 minutes)
```
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run: supabase/migrations/014_signup_v2_schema.sql
4. Verify no errors
```

### 2. Storage Bucket (2 minutes)
```
1. Open Supabase Dashboard → Storage
2. Click "Create bucket"
3. Name: audio-previews
4. Make it PUBLIC (for audio playback)
5. Click Create
```

### 3. Environment Variables (3 minutes)
```
1. Open Vercel Dashboard
2. Go to Project Settings → Environment Variables
3. Add both variables above
4. Save
```

### 4. Deploy (1 minute)
```bash
git add .
git commit -m "Add Signup V2 flow with email auth"
git push
```

Vercel will auto-deploy and activate the cron job.

### 5. Test (5 minutes)
```
1. Visit: https://jordyn.app/signup-v2
2. Fill business info form
3. Watch training animation
4. Play audio samples (should say business name)
5. Create account with email/password
6. Verify you land in dashboard
7. Check trial period in database
```

## Total Time: ~15 minutes

## What Happens After Deployment

### Cron Job (Automatic)
- **Daily at 9:00 AM UTC**, the cron job runs
- Checks all trialing subscribers
- Sends Day 5 reminder: "2 days left in your trial"
- Sends Day 7 expiration: "Your trial has ended"
- Pauses features for expired trials

### User Flow
1. User visits `/signup-v2`
2. Enters business info (name, phone, address, description)
3. AI trains for 15-20 seconds
4. User hears 3 personalized audio samples
5. User creates account (email/password)
6. **7-day free trial starts** (no credit card)
7. User lands in dashboard with trial banner
8. Day 5: User gets reminder email
9. Day 7: Trial expires, features pause, upgrade prompt

## Monitoring

After deployment, monitor:

### Trial Conversions
```sql
SELECT * FROM trial_conversions
ORDER BY converted_at DESC
LIMIT 10;
```

### Active Trials
```sql
SELECT
  email,
  business_name,
  trial_ends_at,
  EXTRACT(DAY FROM trial_ends_at - NOW()) as days_remaining
FROM subscribers
WHERE billing_status = 'trialing'
ORDER BY trial_ends_at ASC;
```

### Expired Trials
```sql
SELECT COUNT(*) as expired_count
FROM subscribers
WHERE billing_status = 'trial_expired';
```

## Support

If you see any issues:

1. **Audio not generating?**
   - Check ELEVENLABS_API_KEY is set correctly
   - Check Vercel logs for errors

2. **Trial not starting?**
   - Verify database migration ran successfully
   - Check `subscribers` table has trial_started_at column

3. **Cron not running?**
   - Check Vercel Dashboard → Cron Jobs tab
   - Verify CRON_SECRET matches in both vercel.json and env vars
   - Check cron execution logs

4. **Storage errors?**
   - Verify `audio-previews` bucket exists
   - Verify bucket is PUBLIC
   - Check Supabase storage logs

---

**You're ready to launch!** 🎉

See `SIGNUP-V2-SIMPLE-FORM.md` for detailed technical documentation.
