# AgentOS Internal Pages - Complete Specification

## Brand & Design System

**Colors:**
- Navy: `#1B3A7D`
- Red: `#C7181F`
- White: `#FFFFFF`

**Font:**
- Arial (already set in layout.tsx)

**Style:**
- Professional, trustworthy, clean
- Tailwind CSS with shadcn/ui components
- Responsive mobile-first design

---

## Auth Flow Pages

### 1. `/signup` - Signup Page

**Purpose:** Create new subscriber account

**Layout:**
- Centered card on gradient navy background
- `min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347]`
- White card with shadow-xl

**Fields:**
| Field Name | Type | Validation | Placeholder |
|-----------|------|-----------|-------------|
| name | text | required | "John Doe" |
| email | email | required | "john@example.com" |
| password | password | required, minLength: 8 | "Min. 8 characters" |

**Submit Button:**
- Text: "Create Account" / "Creating Account..." (loading)
- Color: `bg-[#C7181F] hover:bg-[#A01419]`
- Full width, font-bold, py-3, rounded-lg

**Footer Link:**
- "Already have an account? Sign in" → `/login`

**Behavior:**
- Calls `/api/auth/signup` (POST)
- Auto-signs user in after account creation
- Redirects to `/onboard` on success
- Shows error message in red banner if fails

---

### 2. `/login` - Login Page

**Purpose:** Sign in to existing account

**Layout:**
- Same gradient background as signup
- Centered white card

**Fields:**
| Field Name | Type | Validation | Placeholder |
|-----------|------|-----------|-------------|
| email | email | required | "john@example.com" |
| password | password | required | "Enter your password" |
| remember | checkbox | optional | "Remember me" |

**Additional Links:**
- "Forgot password?" → `/forgot-password` (right-aligned, small text)

**Submit Button:**
- Text: "Sign In" / "Signing In..." (loading)
- Same red styling as signup

**Footer Link:**
- "Don't have an account? Sign up" → `/signup`

**Behavior:**
- Calls `supabase.auth.signInWithPassword()`
- Checks subscriber status after login
- Redirects to `/onboard` if status = 'pending'
- Redirects to `/app` if status = 'active'

---

### 3. `/onboard` - Onboarding/Intake Page

**Purpose:** 5-question intake form before payment

**Layout:**
- Gradient navy background
- Wider card (max-w-2xl)
- White background with shadow

**Title:**
- "Tell Us About Your Business"
- Subtitle: "Just 5 quick questions to customize your bot"

**Fields:**

| # | Field Name | Type | Validation | Options/Placeholder |
|---|-----------|------|-----------|---------------------|
| 1 | business_name | text | required | "Acme Insurance Agency" |
| 2 | business_type | select | required | insurance, cpa, law, realestate, other |
| 3 | phone | tel | required | "(555) 123-4567" |
| 4 | pain_point | radio | required | 5 pre-set options (see below) |
| 5 | bot_name | text | optional, default: "Jordan" | "Jordan" |

**Pain Point Options (radio buttons):**
- "Missing calls after hours"
- "Too many leads to follow up"
- "Appointment scheduling takes too long"
- "Need help with customer service"
- "Want to automate social media"

**Pricing Display:**
- Shows "$97/month" in large navy text
- "Cancel anytime" in small gray text below

**Submit Button:**
- Text: "Continue to Payment" / "Processing..." (loading)
- Red background, full width, py-4

**Behavior:**
- Updates `subscribers` table with intake info
- Creates Stripe Checkout session via `/api/create-checkout`
- Redirects to Stripe Checkout URL
- Uses `STRIPE_PRICES.AGENTOS_BASE` price ID

---

### 4. `/welcome` - Welcome/Provisioning Page

**Purpose:** Shows setup progress and success message after payment

**Layout:**
- Gradient navy background
- Centered card (max-w-2xl)

**Two States:**

#### State 1: Loading/Provisioning (progress < 100%)

**Title:** "Setting Up {bot_name}..."

**Progress Steps:**
1. "Creating your profile" (25%)
2. "Training {bot_name} on {business_type}" (50%)
3. "Setting up your phone number" (75%)
4. "Running final checks" (100%)

**Progress Bar:**
- Gray background, red fill
- Smooth transition-all duration-500
- Width: `{progress}%`

**Polling:**
- Checks database every 2 seconds
- Updates progress based on:
  - `stripe_customer_id` exists → 25%
  - `vapi_assistant_id` exists → 50%
  - `vapi_phone_number` exists → 75%
  - `status === 'active'` → 100%

#### State 2: Complete (progress === 100%)

**Title:**
- 🎉 emoji (text-6xl)
- "{bot_name} is Ready!"
- "Your AI employee is now working for you"

**Info Boxes:**

**Box 1: Business Number**
- Title: "Your New Business Number"
- Phone: Large red text (text-3xl)
- Description: Share with clients...

**Box 2: Control via SMS**
- Title: "Control via SMS"
- Number: Twilio control number
- Example commands:
  - "What can you do?"
  - "How many calls today?"
  - "Schedule a social post"

**Alert:**
- Blue background banner
- "📱 Check your phone! {bot_name} just sent you a welcome text..."

**CTA Button:**
- "Go to Dashboard" → `/app`
- Navy background, large (px-12 py-4)

**Footer:**
- "Your first weekly report will arrive Monday morning."

---

## Subscriber Dashboard Pages

### 5. `/app` - Main Dashboard

**Purpose:** Main subscriber interface with stats and activity

**Layout:**
- Full screen with header navigation
- Gray background (`bg-gray-50`)

**Header:**
- White background with shadow
- Left: "AgentOS" (navy, bold)
- Right: User name + "Sign Out" link

**Greeting:**
- Dynamic: "Good morning/afternoon/evening, {firstName}!"
- Current date displayed below

**Stats Cards (3 columns):**

| Card | Data Source | Icon | Value |
|------|------------|------|-------|
| Calls Today | `call_summaries` count for today | 📞 | Number |
| Commands Executed | `commands_log` count for today | ⚡ | Number |
| Bot Status | `subscriber.status` | 🟢/🔴 | Online/Offline |

**Quick Commands (4 buttons grid):**
- Daily Report (📊)
- Schedule Post (📱)
- New Campaign (✉️)
- Activity Log (📋) → links to `/app/activity`

**Recent Activity Widget:**
- Shows last 5 from `commands_log`
- Displays: skill_triggered, raw_message (truncated), timestamp
- "View All" link → `/app/activity`

**Active Skills Widget:**
- Shows enabled features from `feature_flags` table
- Green dot (●) indicator
- "Add More" link → `/app/skills`

**Bot Info Widget:**
- Business Number
- Control SMS number
- Industry Pack
- Current Plan (${current_mrr}/month)

**Database Queries:**
- `subscribers` - for subscriber info
- `call_summaries` - count today's calls
- `commands_log` - count commands + recent activity
- `feature_flags` - active skills

---

### 6. `/app/activity` - Activity Log Page

**Purpose:** Full history of commands and calls

**Layout:**
- Same header as dashboard
- Back button: "← Back to Dashboard" → `/app`

**Stats Cards (3 columns):**

| Card | Query | Icon | Value |
|------|-------|------|-------|
| Total Commands | `commands_log` total count | ⚡ | Number |
| Total Calls | `call_summaries` total count | 📞 | Number |
| Success Rate | `commands_log` WHERE success=true / total * 100 | ✅ | Percentage |

**Success Rate Colors:**
- Green: ≥95%
- Yellow: 80-94%
- Red: <80%

**Tabs:**
- Commands (active by default)
- Calls (hidden by default, can be toggled)

**Commands Table:**

| Column | Field | Display |
|--------|-------|---------|
| Time | created_at | `toLocaleString()` |
| Channel | channel | Badge (blue=sms, purple=email, green=phone, indigo=discord) |
| Command | raw_message | Truncated to 50 chars |
| Skill | skill_triggered | Text or "—" |
| Status | success | Green "Success" / Red "Failed" badge |
| Duration | duration_ms | "Xms" or "—" |

**Empty State:**
- "No commands yet"
- "Commands will appear here when {bot_name} executes actions"

**Pagination:**
- Last 100 records shown
- Could add "Load More" button (future)

**Database Queries:**
- `commands_log` - last 100, ordered by created_at DESC
- `call_summaries` - last 100, ordered by created_at DESC

---

## Rep/Distributor Pages

### 7. `/rep` - Rep Dashboard

**Purpose:** Rep back office showing subscribers, MRR, signup link

**Access Control:**
- Requires `agentos_reps` table record
- WHERE email = current user email
- Checks `active = true`

**Error States:**

**Not Found:**
- "Rep Access Required"
- "Your account is not registered as a rep..."

**Inactive:**
- "Account Inactive" (red heading)
- "Contact your upline or Apex support..."

**Header:**
- Left: Rep name (navy, bold) + "Rep Code: {apex_rep_code}" (small gray)
- Right: "Sign Out" link

**Stats Cards (3 columns):**

| Card | Calculation | Color |
|------|------------|-------|
| Active Subscribers | Count WHERE status='active' AND rep_code=mine | Navy |
| Total MRR | SUM(current_mrr) WHERE status='active' | Navy |
| Commission | "See Apex Portal" + link to reachtheapex.net | Gray (external) |

**Subscribers Table:**

| Column | Data | Display |
|--------|------|---------|
| Business | business_name | Font-medium |
| Plan | Base + feature_flags (if enabled) | Chips/badges |
| MRR | current_mrr | "$X/mo" |
| Status | status | 🟢 Active / 🔴 {status} |

**Action Button:**
- "+ Send Demo" → `/demos/new`

**Empty State:**
- 🤖 emoji
- "No subscribers yet"
- "Send your first demo →" link

**Signup Link Box:**
- Shows: `https://reachtheapex.net/join/{apex_rep_code}`
- "Copy" button (copies to clipboard)
- "QR Code" button → `/demos/share`
- Small gray text explaining attribution

**Database Queries:**
- `agentos_reps` - get rep record
- `subscribers` - WHERE rep_code = my code, with feature_flags

---

### 8. `/demos/new` - Send Demo Page

**Purpose:** Rep form to trigger demo calls

**Layout:**
- White header with "Send Demo" title
- "← Back to Dashboard" link → `/rep`
- Centered form (max-w-2xl)

**Intro Box:**
- Title: "Trigger a Demo Call"
- Description: "Jordan will text your prospect asking for consent, then call..."

**Form Fields:**

| Field | Type | Validation | Placeholder | Notes |
|-------|------|-----------|-------------|-------|
| prospect_name | text | required | "John Doe" | |
| prospect_phone | tel | required | "+1 555-555-5555" | US only note |
| prospect_business_type | select | required | insurance, cpa, law, realestate, other | Custom demo |
| prospect_note | textarea | optional | "e.g., State Farm agent..." | Internal use |

**Business Type Options:**
- Insurance Agent
- CPA / Tax Professional
- Attorney / Law Firm
- Real Estate Agent
- Other

**Submit Button:**
- Text: "Send Demo" / "Sending..." (loading)
- Navy background, full width, py-3

**"How It Works" Section:**
1. Jordan texts prospect asking for consent
2. If they reply YES, Jordan calls within 1 minute
3. After call, Jordan captures email and sends summary
4. Email includes unique signup link with attribution
5. When they sign up, rep earns commission

**Behavior:**
- Calls `/api/demo/send` (POST)
- Redirects to `/demos?success=true` on success
- Shows error in red banner if fails

---

## Missing Pages (Need Implementation)

### 9. `/app/skills` - Skill Marketplace
**Purpose:** Add/remove skills (Social Media, Lead Gen, etc.)
**Not yet implemented**

### 10. `/forgot-password` - Password Reset
**Purpose:** Email-based password reset flow
**Not yet implemented**

### 11. `/demos/share` - QR Code Generator
**Purpose:** Generate QR code for rep signup link
**Not yet implemented**

### 12. `/demos/claim` - Claim Demo Page
**Purpose:** (Purpose unclear from file structure)
**Not yet implemented**

### 13. `/rep/register-phone` - Phone Registration
**Purpose:** (Purpose unclear from file structure)
**Not yet implemented**

---

## Common UI Components Needed

### StatCard Component
```tsx
interface StatCardProps {
  title: string
  value: string | number
  icon: string (emoji)
  valueColor?: string (default: 'text-[#1B3A7D]')
}
```

### QuickButton Component
```tsx
interface QuickButtonProps {
  label: string
  icon: string (emoji)
  href?: string (optional Link)
}
```

### InfoRow Component
```tsx
interface InfoRowProps {
  label: string
  value: string
}
```

### ChannelBadge Component
```tsx
interface ChannelBadgeProps {
  channel: 'sms' | 'email' | 'phone' | 'discord' | 'app' | null
}
// Colors: blue, purple, green, indigo, gray
```

### ProgressStep Component
```tsx
interface ProgressStepProps {
  label: string
  complete: boolean
  active: boolean
}
// Shows checkmark if complete, pulsing dot if active
```

### TabButton Component
```tsx
interface TabButtonProps {
  label: string
  active: boolean
}
// Navy underline if active, gray otherwise
```

---

## Database Tables Referenced

### subscribers
- id, auth_user_id, name, email
- business_name, business_type, phone, bot_name
- vapi_phone_number, vapi_assistant_id
- stripe_customer_id, current_mrr
- status ('pending', 'active', 'cancelled')
- rep_code
- created_at

### commands_log
- id, subscriber_id
- channel ('sms', 'email', 'phone', 'discord', 'app')
- raw_message, command, intent
- skill_triggered
- success (boolean)
- duration_ms
- response_sent
- metadata (jsonb)
- created_at

### call_summaries
- id, subscriber_id
- call_type ('inbound', 'outbound')
- caller_number
- duration_seconds
- summary
- action_required (boolean)
- created_at

### feature_flags
- id, subscriber_id
- feature_name
- enabled (boolean)
- created_at, updated_at

### agentos_reps
- id, apex_rep_code
- name, email, phone
- active (boolean)
- created_at

### email_connections
- id, subscriber_id
- provider ('outlook', 'gmail')
- encrypted_access_token, encrypted_refresh_token
- token_expires_at
- status ('active', 'disconnected')
- connected_email
- last_sync_at

---

## Environment Variables Used

```bash
# Display in UI
TWILIO_PHONE_NUMBER="+1 (651) 728-7626"
NEXT_PUBLIC_TWILIO_PHONE_NUMBER="+1 (651) 728-7626"

# Stripe
STRIPE_PRICES.AGENTOS_BASE="price_xxx"

# Links
Apex Portal: https://reachtheapex.net
Rep Signup Link: https://reachtheapex.net/join/{rep_code}
```

---

## Form Validation Rules

### Phone Numbers
- Format: US phone numbers
- Pattern: `+1 XXX-XXX-XXXX` or `(XXX) XXX-XXXX`
- Required on: signup (business phone), onboard, demo send

### Email
- Standard HTML5 email validation
- Required on: signup, login

### Password
- Minimum length: 8 characters
- Required on: signup, login

### Text Fields
- business_name: Required, any text
- bot_name: Optional, defaults to "Jordan"
- prospect_note: Optional, textarea

### Selects
- business_type: Required, must be one of predefined options
- prospect_business_type: Required, same options

---

## Loading States

**All forms must show:**
- Disabled submit button when loading
- Loading text on button ("Creating Account...", "Signing In...", etc.)
- `disabled:opacity-50` styling
- Prevent double-submission

**All data fetches must show:**
- Loading spinner or skeleton (welcome page uses progress bar)
- Graceful empty states when no data
- Error messages in red banners

---

## Navigation Flow

```
/ (landing page)
  → /signup
    → /onboard
      → Stripe Checkout (external)
        → /welcome (polling)
          → /app (dashboard)
            → /app/activity
            → /app/skills (TBD)

/ (landing page)
  → /login
    → /app (if active)
    → /onboard (if pending)

Rep Flow:
  → /login
    → /rep (if rep account)
      → /demos/new
      → /demos/share (TBD)
```

---

## Responsive Design Requirements

**All pages must:**
- Use mobile-first Tailwind breakpoints (sm, md, lg)
- Stack cards vertically on mobile
- Use `grid-cols-1 md:grid-cols-3` for stat cards
- Show hamburger menu on mobile (future)
- Tables should scroll horizontally on mobile (`overflow-x-auto`)

**Specific breakpoints:**
- Stats: 1 column mobile → 3 columns desktop
- Forms: Full width mobile → max-w-md/2xl centered desktop
- Tables: Horizontal scroll mobile → full table desktop

---

## Error Handling

**Auth Errors:**
- "Invalid email or password"
- "Email already in use"
- "Account created but sign-in failed. Please try logging in."

**Permission Errors:**
- "Rep Access Required" (not in agentos_reps)
- "Account Inactive" (rep.active = false)
- "Not authenticated" (no session)

**Form Errors:**
- Show in red banner above form
- `bg-red-50 border border-red-200 text-red-700`
- Clear error on new submit attempt

**Empty States:**
- "No commands yet" (activity log)
- "No subscribers yet" (rep dashboard)
- "No calls yet" (call history)

---

## Success States

**After Actions:**
- Welcome page: Progress animation → Success card
- Demo sent: Redirect to `/demos?success=true`
- Signup link copied: Browser clipboard API + visual feedback

**Confirmation Messages:**
- "📱 Check your phone! Jordan just sent you a welcome text..."
- Success badges (green background)

---

## Next Steps for Implementation

1. **Missing Pages:** Build `/app/skills`, `/forgot-password`, `/demos/share`
2. **Tab Functionality:** Activate Calls tab on activity page
3. **Search/Filter:** Add search on activity log
4. **Pagination:** Implement "Load More" on activity log
5. **Mobile Menu:** Add hamburger navigation
6. **Settings Page:** User settings, billing management
7. **Notifications:** Toast notifications for actions
8. **Real-time Updates:** WebSocket for live activity feed

---

**This spec provides everything needed to build or redesign all internal pages with complete field definitions, types, validations, database queries, and UI patterns.**
