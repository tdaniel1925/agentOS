# Production Deployment Checklist

**Date:** March 17, 2026
**Status:** Ready for deployment after completing checklist below

---

## ✅ What's Complete

All code is written and tested:
- ✅ Stripe payment method collection during trial
- ✅ Twilio phone number provisioning (voice + SMS)
- ✅ A2P auto-association (SMS compliance)
- ✅ Dashboard UI alerts (payment + phone)
- ✅ Admin alert system (email + SMS)
- ✅ Webhook handlers for Stripe events
- ✅ Manual phone provisioning API
- ✅ Cleanup cron for expired trials
- ✅ Outbound call system (already built)

---

## 🔧 Pre-Deployment Steps

### 1. Run Database Migration

```bash
# Connect to Supabase
supabase db push

# Or manually run the migration:
psql $DATABASE_URL -f supabase/migrations/999_migrate_to_twilio_numbers.sql
```

**This migration:**
- Renames `vapi_phone_number` → `phone_number`
- Renames `vapi_phone_number_id` → `phone_number_sid`
- Adds payment method fields
- Creates `admin_alerts` table
- Adds indexes for performance

### 2. Verify Environment Variables

Your `.env` should have:

```env
# Twilio (REQUIRED)
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxx  ✅ You have this (A2P approved)
TWILIO_A2P_BRAND_SID=BNxxxxxxxxx          ✅ You have this

# Stripe (REQUIRED)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASE=price_...             # $97/month product

# VAPI (REQUIRED)
VAPI_API_KEY=your_vapi_key

# Admin Alerts (REQUIRED)
ADMIN_EMAIL=support@jordyn.app
ADMIN_PHONE=+16517287626

# Other (already configured)
ANTHROPIC_API_KEY=...
NEXT_PUBLIC_APP_URL=https://jordyn.app
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
```

### 3. Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"+ Add endpoint"**
3. **Endpoint URL:** `https://jordyn.app/api/webhooks/stripe`
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Signing secret** → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

### 4. Test Signup Flow (Staging)

```bash
# Run locally or on staging:
npm run dev

# Test complete signup:
1. Go to /signup-v2
2. Fill out business info
3. Wait for agent training
4. Preview audio
5. Create account
6. Verify:
   - ✅ Twilio number provisioned
   - ✅ Number shows in dashboard
   - ✅ Stripe subscription created
   - ✅ Welcome SMS received
   - ✅ Payment method prompt appears
```

### 5. Test Phone Provisioning

```bash
# Check Twilio console:
https://console.twilio.com/us1/develop/phone-numbers/manage/active

# You should see:
- New number purchased
- SMS Webhook: https://jordyn.app/api/webhooks/twilio-sms
- Voice Webhook: https://jordyn.app/api/webhooks/voice/forward-to-vapi
```

### 6. Test A2P Compliance

```bash
# Check messaging service:
https://console.twilio.com/us1/develop/sms/services/{MESSAGING_SERVICE_SID}

# Verify:
- ✅ Campaign status: "Active" or "Approved"
- ✅ New phone number appears in "Phone Numbers" tab
```

### 7. Test Admin Alerts

```bash
# Trigger a test failure (temporarily break VAPI key):
# Edit .env: VAPI_API_KEY=invalid_key

# Try signup → phone provisioning will fail

# Verify:
- ✅ Email sent to ADMIN_EMAIL
- ✅ SMS sent to ADMIN_PHONE (if critical)
- ✅ Alert logged in admin_alerts table
- ✅ Dashboard shows "Phone provisioning failed" banner

# Restore VAPI key and test retry button
```

---

## 🚀 Deployment Steps

### 1. Deploy Code

```bash
git add .
git commit -m "feat: Twilio phone provisioning with A2P compliance"
git push origin main

# Vercel auto-deploys from main branch
# Or manually: vercel --prod
```

### 2. Run Migration in Production

```bash
# Via Supabase dashboard:
https://app.supabase.com/project/{PROJECT_ID}/sql

# Paste migration SQL and run
```

### 3. Set Production Environment Variables

```bash
# Via Vercel dashboard:
https://vercel.com/your-team/agentos-platform/settings/environment-variables

# Or via CLI:
vercel env add ADMIN_EMAIL production
vercel env add ADMIN_PHONE production
# (Others should already be set)
```

### 4. Monitor First Signups

```bash
# Watch logs:
vercel logs --follow

# Look for:
✅ "Phone provisioned: +12145551234"
✅ "Auto-associated with A2P campaign"
✅ "Stripe subscription created: sub_..."
✅ "Welcome SMS sent"
```

### 5. Test Production Signup

1. Go to https://jordyn.app/signup-v2
2. Complete full signup flow
3. Verify dashboard shows:
   - ✅ Phone number
   - ✅ Trial countdown
   - ✅ "Add Payment Method" banner
4. Click "Add Payment Method"
5. Complete Stripe checkout
6. Verify banner disappears

---

## 🧪 Testing Checklist

### Core Signup Flow
- [ ] Signup creates Twilio number (not VAPI)
- [ ] Number auto-associates with A2P campaign
- [ ] Welcome SMS sends from subscriber's own number
- [ ] Stripe subscription created with 7-day trial
- [ ] Dashboard loads correctly
- [ ] Trial countdown shows in banner

### Payment Method Flow
- [ ] Yellow banner shows for trial users
- [ ] "Add Payment Method" button works
- [ ] Stripe Checkout Session created
- [ ] Redirect to Stripe hosted page
- [ ] After adding card, webhook fires
- [ ] `payment_method_added` flag set to true
- [ ] Banner disappears after completion
- [ ] Card will auto-charge on day 8

### Phone Provisioning Retry
- [ ] If provisioning fails, blue banner shows
- [ ] "Retry Setup" button appears
- [ ] Manual provisioning API works
- [ ] Retries up to 3 times with backoff
- [ ] Success shows checkmark, reloads page
- [ ] Number appears in dashboard

### Admin Alerts
- [ ] Phone provisioning failure sends email
- [ ] Critical failures send SMS
- [ ] Alerts logged in `admin_alerts` table
- [ ] Alert format is clear and actionable

### SMS Compliance
- [ ] All SMS uses messaging service SID
- [ ] Messages delivered successfully
- [ ] No "blocked" status in Twilio logs
- [ ] SMS sends from subscriber's number

### Voice Calls
- [ ] Inbound calls forward to VAPI
- [ ] AI assistant answers
- [ ] Conversation works naturally
- [ ] Call summary generated

### Outbound Calls (Already Built)
- [ ] Text "Call John at 281-545-1858..." works
- [ ] AI makes outbound call
- [ ] Dynamic conversation happens
- [ ] Summary texted back to subscriber

### Trial Cleanup
- [ ] Expired trials release Twilio numbers
- [ ] VAPI assistants deleted
- [ ] Subscribers marked as expired
- [ ] Trial_conversions table updated

---

## ⚠️ Known Limitations

### 1. Existing Subscribers Migration
If you have existing subscribers with VAPI numbers:
- They will continue working (VAPI numbers still valid)
- New signups get Twilio numbers automatically
- Migrate existing when they renew/upgrade

### 2. Phone Number Availability
- Twilio sometimes runs out of numbers in specific area codes
- Provisioning automatically tries nearby area codes
- Falls back to any US number if needed

### 3. A2P Approval Time
- Your campaign is already approved ✅
- New numbers auto-associate instantly
- No delays for new subscribers

---

## 📊 Success Metrics

Monitor these after deployment:

### Phone Provisioning Success Rate
Target: >95%
```sql
SELECT
  COUNT(CASE WHEN phone_number IS NOT NULL THEN 1 END)::FLOAT / COUNT(*) * 100 as success_rate
FROM subscribers
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Payment Method Collection Rate
Target: >70%
```sql
SELECT
  COUNT(CASE WHEN payment_method_added = true THEN 1 END)::FLOAT /
  COUNT(CASE WHEN billing_status = 'trialing' THEN 1 END) * 100 as collection_rate
FROM subscribers
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Trial to Paid Conversion
Target: >50%
```sql
SELECT
  COUNT(CASE WHEN billing_status = 'active' THEN 1 END)::FLOAT /
  COUNT(*) * 100 as conversion_rate
FROM subscribers
WHERE trial_ends_at < NOW()
AND created_at > NOW() - INTERVAL '30 days';
```

### SMS Delivery Rate
Check Twilio console:
- https://console.twilio.com/us1/monitor/logs/sms
- Target: >98% delivered
- Watch for "blocked" or "undelivered" status

---

## 🆘 Rollback Plan

If something goes wrong:

### 1. Revert Code
```bash
git revert HEAD
git push origin main
```

### 2. Pause New Signups (Emergency)
```typescript
// Add to src/app/(public)/signup-v2/page.tsx:
return <div>Signups temporarily paused for maintenance</div>
```

### 3. Fix Issues
- Check Vercel logs for errors
- Check Supabase logs
- Check Twilio console
- Review admin_alerts table

### 4. Resume
Once fixed, redeploy and monitor closely

---

## ✅ Final Checklist

Before going live:

- [ ] Database migration completed
- [ ] All environment variables set
- [ ] Stripe webhook configured
- [ ] Test signup completed successfully
- [ ] Phone provisioning tested
- [ ] Payment method flow tested
- [ ] Admin alerts tested
- [ ] SMS compliance verified
- [ ] Outbound calls tested
- [ ] Team notified of launch
- [ ] Monitoring dashboard ready
- [ ] Support email configured

---

## 🎉 You're Ready When:

✅ Migration runs without errors
✅ Test signup provisions Twilio number
✅ Number shows in A2P campaign
✅ SMS sends successfully
✅ Payment method can be added
✅ Admin alerts trigger correctly

**Then you're ready to launch!** 🚀

---

## 📞 Support

If issues arise:
- **Twilio:** https://support.twilio.com
- **Stripe:** https://support.stripe.com
- **Supabase:** https://supabase.com/support
- **Internal:** Check `admin_alerts` table first

Monitor first 24 hours closely, then weekly reviews.
