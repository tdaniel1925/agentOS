# Jordyn Interface Pages - Complete Documentation

## 📱 PUBLIC PAGES (Unauthenticated)

### 1. Landing Page
**Path:** `/` (src/app/(public)/page.tsx)
**Purpose:** Marketing homepage
**Status:** ✅ WORKING
**Features:**
- Hero section with phone mockup
- 9 feature cards (3x3 grid)
- Privacy-first messaging
- Pricing section
- Testimonials
- CTA sections
**Design:** Purple/pink gradient, professional

### 2. Signup V2
**Path:** `/signup-v2` (src/app/(public)/signup-v2/page.tsx)
**Purpose:** New user signup with Stripe
**Status:** ✅ WORKING
**Features:**
- Business info collection
- Stripe payment integration
- 7-day trial
- Redirect to onboarding

---

## 🔐 AUTH PAGES

### 3. Login
**Path:** `/login` (src/app/(auth)/login/page.tsx)
**Purpose:** User authentication
**Status:** ✅ WORKING
**Features:**
- Email/password login
- Redirect to dashboard

### 4. Signup (Old)
**Path:** `/signup` (src/app/(auth)/signup/page.tsx)
**Purpose:** Original signup flow
**Status:** ⚠️ DEPRECATED (use /signup-v2)

### 5. Onboard
**Path:** `/onboard` (src/app/(auth)/onboard/page.tsx)
**Purpose:** Post-signup setup
**Status:** ✅ WORKING
**Features:**
- Business details
- Phone setup
- Calendar connection

### 6. Phone Selection
**Path:** `/select-phone` (src/app/(auth)/select-phone/page.tsx)
**Purpose:** Choose phone number
**Status:** ✅ WORKING

### 7. Welcome
**Path:** `/welcome` (src/app/(auth)/welcome/page.tsx)
**Purpose:** First-time user welcome
**Status:** ✅ WORKING

---

## 🏠 DASHBOARD PAGES

### 8. Main Dashboard
**Path:** `/app` (src/app/(dashboard)/app/page.tsx)
**Purpose:** Primary subscriber dashboard
**Status:** ✅ FIXED
**Features:**
- Activity stats
- Email forwarding card
- Calendar setup alert
- Recent commands
- Quick actions

### 9. Calendar Setup
**Path:** `/app/calendar` (src/app/(dashboard)/app/calendar/page.tsx)
**Purpose:** Connect Google/Outlook calendar
**Status:** ✅ FIXED
**Features:**
- iCal URL input
- Calendar type selection (Google/Outlook/Other)
- Timezone picker
- Test connection
- Instructions

### 10. Activity Log
**Path:** `/app/activity` (src/app/(dashboard)/app/activity/page.tsx)
**Purpose:** Full command and call history
**Status:** ✅ FIXED
**Features:**
- Commands table
- Calls table
- Success rate stats
- Filterable tabs

### 11. Agent Settings
**Path:** `/app/agent` (src/app/(dashboard)/app/agent/page.tsx)
**Purpose:** AI personality configuration
**Status:** ✅ FIXED (Error handling corrected)

### 12. Call Logs
**Path:** `/app/calls` (src/app/(dashboard)/app/calls/page.tsx)
**Purpose:** View all calls
**Status:** ✅ FIXED
**Features:**
- Call list
- Duration
- Transcripts
- Summaries

### 13. Call Detail
**Path:** `/app/calls/[id]` (src/app/(dashboard)/app/calls/[id]/page.tsx)
**Purpose:** Single call detailed view
**Status:** ✅ WORKING
**Features:**
- Full transcript
- AI analysis
- Recording playback

### 14. Usage Stats
**Path:** `/app/usage` (src/app/(dashboard)/usage/page.tsx)
**Purpose:** API usage metrics
**Status:** ✅ FIXED
**Features:**
- Call counts
- SMS counts
- Billing period usage
- Cost tracking

---

## 🎪 DEMO PAGES (Rep Features)

### 15. Rep Dashboard
**Path:** `/rep` (src/app/(dashboard)/rep/page.tsx)
**Purpose:** Sales rep interface
**Status:** ✅ FIXED (Error handling corrected)
**Features:**
- Rep stats (subscribers, MRR, commission)
- Subscriber list with plans
- Signup link with copy button
- Link to send demos

### 16. Register Phone
**Path:** `/rep/register-phone` (src/app/(dashboard)/rep/register-phone/page.tsx)
**Purpose:** Rep phone registration
**Status:** ✅ WORKING (Client-side component)
**Features:**
- Register mobile phone for SMS triggers
- View current registered phone
- Instructions for SMS demo workflow

### 17. New Demo
**Path:** `/demos/new` (src/app/(dashboard)/demos/new/page.tsx)
**Purpose:** Schedule demo calls
**Status:** ✅ WORKING (Client-side component)
**Features:**
- Prospect name/phone/business type form
- Industry-specific demo customization
- Automated consent + call flow
- How it works guide

### 18. Claim Demo
**Path:** `/demos/claim` (src/app/(dashboard)/demos/claim/page.tsx)
**Purpose:** Claim scheduled demo
**Status:** ✅ WORKING (Client-side component)
**Features:**
- Manual prospect claiming (offline attribution)
- 90-day claim window
- Phone/email tracking

### 19. Share Demo
**Path:** `/demos/share` (src/app/(dashboard)/demos/share/page.tsx)
**Purpose:** Share demo link
**Status:** ✅ WORKING (Client-side component)
**Features:**
- QR code generation
- Signup link display
- Download/print QR code
- Copy link button
- Sharing suggestions

---

## 📱 MOBILE PAGES

### 20. Mobile Calendar
**Path:** `/m/calendar/[id]` (src/app/m/calendar/[id]/page.tsx)
**Purpose:** Mobile calendar view
**Status:** ✅ WORKING

### 21. Mobile Call Detail
**Path:** `/m/calls/[id]` (src/app/m/calls/[id]/page.tsx)
**Purpose:** Mobile call view
**Status:** ✅ WORKING

### 22. Mobile Email
**Path:** `/m/emails/[id]` (src/app/m/emails/[id]/page.tsx)
**Purpose:** Mobile email view
**Status:** ✅ WORKING

### 23. Mobile Email Draft
**Path:** `/m/email/draft/[id]` (src/app/m/email/draft/[id]/page.tsx)
**Purpose:** Mobile email draft
**Status:** ✅ WORKING

---

## 🛠️ UTILITY PAGES

### 24. Diagnostics
**Path:** `/diagnostics` (src/app/diagnostics/page.tsx)
**Purpose:** System health check
**Status:** ✅ WORKING (Client-side + API endpoint verified)
**API:** `/api/diagnostics/env` - Shows env var status

### 25. Supabase Debug
**Path:** `/debug/supabase-test` (src/app/debug/supabase-test/page.tsx)
**Purpose:** Database connection test
**Status:** ⚠️ NEEDS REVIEW

### 26. Onboarding Link
**Path:** `/onboarding/[id]` (src/app/onboarding/[id]/page.tsx)
**Purpose:** External onboarding link
**Status:** ⚠️ NEEDS REVIEW

---

## 📊 SUMMARY

**Total Pages:** 26

**Status Breakdown:**
- ✅ WORKING: 19 pages
- ✅ FIXED: 7 pages (calendar, dashboard, activity, calls, usage, agent, rep)
- ⚠️ NEEDS REVIEW: 2 pages (debug/supabase-test, onboarding/[id])

**By Category:**
- Public: 2 pages
- Auth: 5 pages
- Dashboard: 8 pages
- Demos/Rep: 5 pages
- Mobile: 4 pages
- Utility: 3 pages

---

## 🎨 DESIGN SYSTEM

**Colors:**
- Primary: Purple (#9333ea) → Pink (#ec4899) gradient
- Navy: #1B3A7D
- Red: #C7181F
- Green (Privacy): #22c55e
- White: #FFFFFF

**Typography:**
- Headings: Sora (Google Font)
- Body: Inter (Google Font)
- Monospace: For code/emails

**Components:**
- shadcn/ui base
- Tailwind CSS
- Custom gradients
- Responsive design

---

## 🔧 PAGES THAT STILL NEED ATTENTION

### REMAINING (Low Priority - Debug Only)
1. `/debug/supabase-test` - Debug connection test (likely working, just untested)
2. `/onboarding/[id]` - External onboarding link (need to verify flow)

**All core features are now working!** 🎉
