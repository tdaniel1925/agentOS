# AgentOS SMS Command Center - Testing Plan

## Pre-Testing Setup

### 1. Database Migrations
Run these in Supabase SQL Editor:

```sql
-- Add emails_data column to email_summaries
ALTER TABLE email_summaries
ADD COLUMN IF NOT EXISTS emails_data JSONB;

-- Run the email_drafts migration
-- Copy/paste contents from: supabase/migrations/011_email_drafts.sql
```

### 2. Environment Check
Verify these are set in Vercel (or `.env.local` for local testing):

```bash
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
VAPI_API_KEY=...
VAPI_WEBHOOK_SECRET=...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=...
NEXT_PUBLIC_APP_URL=https://theapexbots.com (or http://localhost:3000)
```

### 3. Deployment Check
```bash
# Check Vercel deployment status
# Visit: https://vercel.com/your-team/agentos-platform

# Or run locally:
cd agentos-platform
npm run dev
```

---

## Testing Phases

### Phase 1: Phone Number Provisioning (Agent 3)

**Goal:** Test self-service onboarding flow

#### Test Case 1.1: New Subscriber Onboarding
1. Create a test subscriber in Supabase `subscribers` table (or use Stripe webhook)
2. Navigate to: `https://theapexbots.com/onboarding/{subscriber_id}`
3. **Expected:** See "Provisioning your AI assistant..." progress screen
4. **Wait:** 30-60 seconds for VAPI assistant creation
5. **Expected:** Progress bar reaches 100%, transitions to number chooser

#### Test Case 1.2: Number Search
1. Enter ZIP code: `90210` (Los Angeles)
2. Click "Search Numbers"
3. **Expected:** 10 available phone numbers displayed
4. **Verify:** All numbers have correct area code (310, 424, or 323)

#### Test Case 1.3: Number Provisioning
1. Select a phone number from the list
2. Click "Get This Number ($15 setup fee)"
3. **Expected:** Stripe payment modal appears
4. Enter test card: `4242 4242 4242 4242`, exp `12/34`, CVC `123`
5. **Expected:** Payment succeeds, provisioning starts
6. **Wait:** 10-20 seconds
7. **Expected:** Success screen shows your new phone number
8. **Verify:** Check `subscribers` table - `vapi_phone_number` is set

#### Test Case 1.4: Error Handling
1. Try ZIP code: `00000` (invalid)
2. **Expected:** Error message: "No numbers available in this area"
3. Try payment with card: `4000 0000 0000 0002` (decline card)
4. **Expected:** Error message: "Payment failed. Please try another card."

---

### Phase 2: Mobile Email Interface (Agent 1)

**Goal:** Test email inbox and detail viewing

#### Test Case 2.1: Email Summary Generation
1. Ensure subscriber has an active `email_connections` record (OAuth completed)
2. Send SMS to subscriber's control phone: `CHECK EMAIL`
3. **Expected:** SMS reply like:
   ```
   📧 Inbox (last 24hrs):
   🔴 2 urgent
   👤 5 client emails
   📈 3 leads
   📬 12 other

   View all: https://theapexbots.com/m/emails/{subscriber_id}
   ```
4. **Verify:** `email_summaries` table has new row with `emails_data` JSONB populated

#### Test Case 2.2: Mobile Email Inbox
1. Click the link from SMS or navigate directly
2. **Expected:** Mobile-optimized inbox page loads
3. **Verify:**
   - Navy header (#1B3A7D) with "Your Emails"
   - Filter chips: All, Urgent, Client, Lead
   - Email cards showing sender, subject, preview, time
   - Refresh button in top-right

#### Test Case 2.3: Email Filtering
1. Tap "Urgent" filter
2. **Expected:** Only urgent emails displayed
3. Tap "Client" filter
4. **Expected:** Only client emails displayed
5. Tap "All"
6. **Expected:** All emails displayed

#### Test Case 2.4: Email Detail Modal
1. Tap any email card
2. **Expected:** Full-screen modal slides up
3. **Verify:**
   - Full subject line
   - From/To addresses
   - Full email body preview
   - Timestamp
   - Close button (X) works

#### Test Case 2.5: Refresh Functionality
1. Tap refresh button (↻) in top-right
2. **Expected:** Loading spinner appears
3. **Wait:** 5-10 seconds
4. **Expected:** Fresh email data loads
5. **Verify:** New `email_summaries` row created

---

### Phase 3: Mobile Calls & Calendar (Agent 2)

**Goal:** Test call history and calendar views

#### Test Case 3.1: Check Calls via SMS
1. Make a test call to subscriber's VAPI number (or create test `call_logs` entries)
2. Send SMS: `CHECK CALLS`
3. **Expected:** SMS reply like:
   ```
   📞 Calls (last 24hrs):
   🔴 2 missed calls
   ✅ 5 completed

   View all: https://theapexbots.com/m/calls/{subscriber_id}
   ```

#### Test Case 3.2: Mobile Call History
1. Click link or navigate directly
2. **Expected:** Mobile call history page loads
3. **Verify:**
   - Stats bar: "7 calls • 2 missed • 18m avg"
   - Filter buttons: All, Missed, Completed
   - Calls grouped by date: "Today", "Yesterday", "Mar 14"
   - Each call card shows: name/number, duration, status badge

#### Test Case 3.3: Call Detail Modal
1. Tap any call card
2. **Expected:** Full-screen modal with call details
3. **Verify:**
   - Full transcript (if available)
   - AI summary
   - Sentiment badge (😊/😐/😟)
   - Duration, status, timestamp
   - "Call Back" button with `tel:` link
4. Tap "Call Back"
5. **Expected:** Phone dialer opens with number pre-filled

#### Test Case 3.4: Check Calendar via SMS
1. Send SMS: `CHECK CALENDAR`
2. **Expected:** SMS reply like:
   ```
   📅 Today's Calendar:
   9:00 AM - Team Standup
   2:00 PM - Client Demo
   4:30 PM - Strategy Review

   View all: https://theapexbots.com/m/calendar/{subscriber_id}
   ```

#### Test Case 3.5: Mobile Calendar View
1. Click link or navigate directly
2. **Expected:** Mobile calendar page loads
3. **Verify:**
   - View toggle: "Today" / "This Week" / "This Month"
   - Events grouped by date
   - Each event shows: time, title, location, attendees
4. Toggle to "This Week"
5. **Expected:** Shows next 7 days of events

#### Test Case 3.6: No Email Connection State
1. Test with subscriber who hasn't completed OAuth
2. **Expected:** "Connect your email to view calendar" message

---

### Phase 4: SMS Link Integration (Agent 4)

**Goal:** Test progressive disclosure pattern

#### Test Case 4.1: Email Check Link
1. Send SMS: `CHECK EMAIL`
2. **Verify SMS length:** Should be ~114 characters (under 160)
3. **Verify format:**
   ```
   📧 Inbox (last 24hrs):
   [counts]
   View all: [link]
   ```
4. Click link on mobile phone
5. **Expected:** Opens mobile email inbox (not desktop version)

#### Test Case 4.2: Call Check Link
1. Send SMS: `CHECK CALLS`
2. **Verify SMS length:** Should be ~95 characters
3. Click link
4. **Expected:** Opens mobile call history

#### Test Case 4.3: Calendar Check Link
1. Send SMS: `CHECK CALENDAR TODAY`
2. **Verify:** Link includes today's events
3. Send SMS: `CHECK CALENDAR WEEK`
4. **Verify:** Link shows this week's events

#### Test Case 4.4: Refresh from Web
1. On any mobile page (emails/calls/calendar)
2. Tap refresh button
3. **Expected:** Triggers SMS skill execution
4. **Expected:** Page reloads with fresh data
5. **Expected:** New SMS sent to control phone with updated counts

---

### Phase 5: Usage Dashboard (Agent 5)

**Goal:** Test usage tracking and limits

#### Test Case 5.1: Usage Dashboard Access
1. Log into dashboard: `https://theapexbots.com/dashboard`
2. Navigate to "Usage" page
3. **Expected:** Dashboard with 3 sections:
   - Usage Overview (current period)
   - 30-Day Usage Chart
   - Spending Limits

#### Test Case 5.2: Usage Overview Cards
1. **Verify Voice Minutes Card:**
   - Shows: "X / 200 minutes used"
   - Progress bar color: Green (<80%), Yellow (80-100%), Red (>100%)
   - Shows overage if applicable: "+15 minutes ($7.50 overage)"
2. **Verify SMS Messages Card:**
   - Shows: "X / 500 messages used"
   - Same color coding
3. **Verify Estimated Cost:**
   - Base: $97.00
   - Overages: $X.XX
   - Total: $XXX.XX

#### Test Case 5.3: 30-Day Chart
1. **Verify chart displays:**
   - Last 30 days of data
   - Blue bars for voice minutes
   - Green bars for SMS count
   - Date labels on X-axis
2. Hover over bars (desktop) or tap (mobile)
3. **Expected:** Tooltip shows exact numbers

#### Test Case 5.4: Spending Limits
1. Current limit shown (default: $200)
2. Click "Edit Limit"
3. Try setting to `$50`
4. **Expected:** Error: "Spending limit cannot be less than $97"
5. Set to `$150`
6. Click "Save"
7. **Expected:** Success message, limit updates in database
8. **Verify:** `subscriber_usage` table shows new `spending_limit`

#### Test Case 5.5: Overage Alerts
1. Simulate overage (or wait for real usage >100%)
2. **Expected:** Alert card appears:
   ```
   ⚠️ You're approaching your limits
   - Voice: 102% used (+4 minutes overage)
   - SMS: 98% used
   ```

---

### Phase 6: Email Reply & Compose (Agent 6)

**Goal:** Test email productivity features

#### Test Case 6.1: Reply via SMS
1. First, check emails: `CHECK EMAIL`
2. Note the email list (emails are numbered #1-10 internally)
3. Send SMS: `REPLY TO #1 - Thanks for reaching out! Let's schedule a call.`
4. **Expected:** SMS reply:
   ```
   ✅ Reply drafted to John Smith
   Subject: Re: Project Discussion

   Preview & send: https://theapexbots.com/m/email/draft/{draft_id}

   Or text SEND to send immediately
   ```
5. **Verify:** `email_drafts` table has new draft with status='draft'

#### Test Case 6.2: Draft Preview & Edit
1. Click the draft link from SMS
2. **Expected:** Mobile draft editor loads
3. **Verify:**
   - Shows original email context (gray box at top)
   - To: address pre-filled
   - Subject: pre-filled with "Re: ..."
   - Body: editable text area with your message
   - "Send Email" button at bottom
4. Edit the body text
5. **Verify:** Changes save automatically when you send

#### Test Case 6.3: Send Draft from Web
1. On draft editor, click "Send Email"
2. **Expected:** Loading state
3. **Wait:** 2-5 seconds
4. **Expected:** Success message: "✅ Email sent!"
5. **Expected:** Redirects to email inbox
6. **Verify in Outlook/Gmail:** Email actually sent via Microsoft Graph
7. **Verify:** `email_drafts` table shows status='sent', sent_at timestamp

#### Test Case 6.4: Quick Send via SMS
1. Reply to another email: `REPLY TO #2 - Got it, will do!`
2. Receive draft link in SMS
3. Instead of clicking link, send SMS: `SEND`
4. **Expected:** SMS reply: "✅ Email sent to [recipient]"
5. **Verify:** Draft sent without opening web page

#### Test Case 6.5: Compose New Email via SMS
1. Send SMS: `SEND EMAIL TO john@example.com ABOUT Meeting followup - Thanks for the meeting today. Attached are the slides.`
2. **Expected:** Draft created with:
   - To: john@example.com
   - Subject: "Meeting followup"
   - Body: "Thanks for the meeting today. Attached are the slides."
3. Receive preview link
4. Open link, verify fields
5. Send from web or SMS

#### Test Case 6.6: Draft Expiration
1. Create a draft (reply to email)
2. Wait 24 hours (or manually update `expires_at` in database to past time)
3. Try to open draft link
4. **Expected:** "This draft has expired" message

#### Test Case 6.7: Already Sent Check
1. Send a draft
2. Try to open the same draft link again
3. **Expected:** "This email has already been sent" message

---

## Testing Tools & Tips

### 1. SMS Testing Tools
- **Twilio Console:** https://console.twilio.com/us1/develop/sms/logs
  - View all SMS sent/received
  - See delivery status
  - Check for errors

### 2. Database Testing
```sql
-- Check email summaries
SELECT * FROM email_summaries
WHERE subscriber_id = 'your-subscriber-id'
ORDER BY created_at DESC;

-- Check call logs
SELECT * FROM call_logs
WHERE subscriber_id = 'your-subscriber-id'
ORDER BY started_at DESC;

-- Check email drafts
SELECT * FROM email_drafts
WHERE subscriber_id = 'your-subscriber-id'
ORDER BY created_at DESC;

-- Check subscriber usage
SELECT * FROM subscriber_usage
WHERE subscriber_id = 'your-subscriber-id';
```

### 3. Mobile Testing
- **Real Device:** Best - test on actual iPhone/Android
- **Chrome DevTools:** Press F12, toggle device toolbar (Ctrl+Shift+M)
- **Responsive Mode:** Test widths: 375px (iPhone), 390px (iPhone Pro), 360px (Android)

### 4. SMS Link Testing
- **Bitly/Link Shortener:** SMS links are long - consider adding link shortening
- **QR Codes:** Generate QR codes for each mobile link for easy testing

### 5. Error Scenarios to Test

#### Network Errors
1. Turn off WiFi mid-request
2. **Expected:** Graceful error message, not white screen

#### Auth Errors
1. Revoke Microsoft OAuth token
2. Try to check calendar
3. **Expected:** "Please reconnect your email" message

#### Payment Errors
1. Use Stripe test cards:
   - `4000 0000 0000 0002` - Card declined
   - `4000 0000 0000 9995` - Insufficient funds
   - `4000 0000 0000 0069` - Expired card
2. **Expected:** Clear error messages for each scenario

#### Rate Limiting
1. Send 10 SMS commands rapidly
2. **Expected:** System handles gracefully (no crashes)
3. **Verify:** All commands logged in `commands_log`

---

## Success Criteria

### Must Pass
- [ ] Phone provisioning completes end-to-end
- [ ] SMS commands trigger correct skills
- [ ] Mobile links open correct pages
- [ ] Email drafts send successfully
- [ ] Usage tracking shows accurate data
- [ ] All TypeScript compiles with no errors
- [ ] No console errors on mobile pages
- [ ] Payments process correctly

### Should Pass
- [ ] Mobile UI looks good on iPhone and Android
- [ ] SMS messages stay under 160 characters
- [ ] Page load times under 2 seconds
- [ ] Graceful error messages (no raw errors shown)
- [ ] Refresh buttons work reliably

### Nice to Have
- [ ] Smooth animations on modals
- [ ] Progress indicators on all loading states
- [ ] Offline state handled gracefully
- [ ] Works in poor network conditions

---

## Bug Reporting Template

When you find bugs, document them like this:

```markdown
## Bug: [Short Description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Navigate to...
2. Click...
3. Enter...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[Attach if applicable]

**Environment:**
- Device: iPhone 15 / Samsung Galaxy S23 / Desktop
- Browser: Safari 17 / Chrome 120
- URL: https://theapexbots.com/m/emails/...

**Console Errors:**
[Copy/paste any errors from browser console]

**Database State:**
[SQL query results if relevant]
```

---

## Next Steps After Testing

1. **Fix Critical Bugs:** Address any blockers immediately
2. **Update BUILD-STATE.md:** Mark testing phase complete
3. **User Acceptance Testing:** Get real subscriber to test
4. **Performance Optimization:** Check Vercel Analytics
5. **Monitoring Setup:** Configure error tracking (Sentry?)
6. **Go-Live Checklist:**
   - [ ] Switch Stripe to live keys
   - [ ] Update NEXT_PUBLIC_APP_URL to production domain
   - [ ] Run database migrations in production Supabase
   - [ ] Test with real phone number and real emails
   - [ ] Monitor logs for first 24 hours

---

## Quick Start Testing Command

```bash
# Test locally
cd agentos-platform
npm run dev

# Open in browser with mobile emulation
# Chrome: F12 → Toggle Device Toolbar (Ctrl+Shift+M)
# Set to "iPhone 14 Pro" or "Pixel 7"

# Test these URLs:
# http://localhost:3000/onboarding/[test-subscriber-id]
# http://localhost:3000/m/emails/[test-subscriber-id]
# http://localhost:3000/m/calls/[test-subscriber-id]
# http://localhost:3000/m/calendar/[test-subscriber-id]
# http://localhost:3000/dashboard/usage
```

---

**Ready to test! Start with Phase 1 (Phone Provisioning) and work through sequentially.** 🚀
