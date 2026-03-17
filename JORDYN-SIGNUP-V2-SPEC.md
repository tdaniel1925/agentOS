# JORDYN SIGNUP V2 - Rosie-Style Onboarding
## Complete Specification Document

---

## 🎯 GOAL
Rebuild Jordyn signup to match Rosie's frictionless experience:
- Google Business Profile lookup (1 input vs 7+ fields)
- AI training animation with progress
- Audio preview of agent before signup
- 7-day FREE trial (no credit card)
- OAuth signup (Google/Microsoft)
- Choose plan after trial period

---

## 📊 FLOW COMPARISON

### Current Jordyn (BAD)
```
1. Landing page → Click "Get Started"
2. Form: Email, password, name, business name, industry, phone, bot name
3. Stripe checkout ($112 upfront)
4. Processing overlay
5. Dashboard
```
**Problems:**
- 7+ form fields = friction
- Payment required immediately = risk
- No preview of AI agent
- Manual data entry (tedious)

### New Jordyn (Rosie-Style)
```
1. Landing page → Click "Start Free Trial"
2. Google Business lookup (1 field: business name)
3. Confirm business match (show address, phone)
4. AI training animation (scrape website, build agent)
5. Audio preview (hear greeting + sample conversation)
6. Create account (Google OAuth or email - NO payment)
7. Dashboard with Quick Start Guide
8. Day 7: Prompt to choose paid plan
```
**Benefits:**
- 1 field vs 7 = 80% less friction
- No payment = no risk = higher conversion
- Audio preview = trust + excitement
- Auto-populated data = instant setup

---

## 🏗️ ARCHITECTURE

### Phase 1: Google Business Profile Integration
**API:** Google Places API
**Flow:**
1. User types business name → Autocomplete suggestions
2. Select business → Fetch full profile
3. Extract: name, address, phone, website, hours, photos

**Data Mapping:**
```
Google Profile → Jordyn
---
displayName → business_name
phoneNumber → business_phone
websiteUri → business_website
regularOpeningHours → business_hours
businessStatus → verification_status
location → business_address
```

### Phase 2: AI Training Simulation
**Duration:** 15-20 seconds (realistic timing)
**Steps:**
1. ✓ Analyzing website for data (5s)
2. ✓ Processing business information (4s)
3. ✓ Optimizing data for AI (4s)
4. ⏳ Generating custom Jordyn agent (5s)

**Behind the scenes:**
- Scrape website content (first 5 pages)
- Extract FAQs, services, contact info
- Generate system prompt for VAPI
- Create assistant (don't provision phone yet)

### Phase 3: Audio Preview Generation
**Tech:** VAPI Text-to-Speech preview
**Samples:**
1. **Greeting:** "Hi, this is Jordan calling from [Business]. How can I help you?"
2. **Message Example:** "I'd be happy to take a message and have someone call you back."
3. **FAQ Example:** Custom based on business type

**Implementation:**
- Use VAPI voice synthesis API
- Cache audio files (S3 or Supabase Storage)
- Return audio URLs to frontend
- Frontend plays with HTML5 `<audio>` element

### Phase 4: 7-Day Free Trial
**Changes Required:**
1. **New subscriber status:** `trialing` (separate from `active`)
2. **Trial tracking:**
   - `trial_started_at` timestamp
   - `trial_ends_at` (7 days from start)
   - `trial_used` boolean
3. **Stripe integration:**
   - Create customer WITHOUT subscription
   - Store customer_id for later
   - Day 7: Send email + dashboard prompt to upgrade
4. **Feature access:**
   - Full access during trial
   - Auto-pause on day 7 if no payment

### Phase 5: OAuth Integration
**Providers:** Google + Microsoft
**Benefits:**
- Faster signup (no password)
- Email verification automatic
- Trusted auth flow

**Implementation:**
- NextAuth.js or Supabase Auth providers
- Link OAuth account to subscriber record
- Fallback to email/password for manual signup

---

## 📋 DATABASE CHANGES

### New Fields in `subscribers` table:
```sql
-- Google Business Profile data
google_place_id TEXT,
business_website TEXT,
business_address TEXT,
business_hours JSONB,
google_rating DECIMAL,
google_review_count INTEGER,

-- Trial management
trial_started_at TIMESTAMPTZ,
trial_ends_at TIMESTAMPTZ,
trial_used BOOLEAN DEFAULT false,
signup_source TEXT, -- 'google_oauth' | 'microsoft_oauth' | 'email'

-- AI training data
website_scraped_at TIMESTAMPTZ,
website_content JSONB, -- Cached for faster agent updates
```

### New Table: `trial_conversions`
```sql
CREATE TABLE trial_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  trial_started_at TIMESTAMPTZ,
  trial_ended_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  plan_selected TEXT,
  days_to_convert INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 UI/UX SPECIFICATION

### Design System (Match Rosie)
**Colors:**
- Primary: Purple gradient (`#8B5CF6` to `#7C3AED`)
- Success: Green (`#10B981`)
- Background: Light gray (`#F9FAFB`)
- Progress: Animated gradient bar

**Layout:**
- Full-screen centered card (max-width: 600px)
- Left sidebar: Benefits checklist (persistent)
- Right content: Current step
- Progress indicator: `1/5` at top
- Bottom: "Start risk-free 7-day trial" badge

### Step-by-Step Screens

#### Screen 1: Google Business Lookup
```tsx
<div className="signup-step">
  <ProgressIndicator current={1} total={5} />

  <h1>Train Jordyn with your <span className="gradient">Google Business Profile</span></h1>

  <Checklist>
    <li>✓ Find your profile by entering business name</li>
    <li>✓ Your AI agent trained on your Google profile</li>
    <li>✓ Takes less than a minute</li>
  </Checklist>

  <GooglePlacesAutocomplete
    placeholder="Type your business name..."
    onSelect={handleBusinessSelect}
  />

  <button>Continue →</button>
  <a href="/signup/manual">Use my website instead</a>
</div>
```

#### Screen 2: Confirm Business
```tsx
<div className="signup-step">
  <ProgressIndicator current={2} total={5} />

  <h2>Is this your business profile?</h2>

  <BusinessCard>
    <Icon>📍</Icon>
    <Name>{business.name}</Name>
    <Address>{business.address}</Address>
    <Phone>{business.phone}</Phone>
  </BusinessCard>

  <button onClick={startTraining}>Yes, Train Jordyn →</button>
  <a onClick={goBack}>Search again</a>
</div>
```

#### Screen 3: AI Training (Loading)
```tsx
<div className="signup-step">
  <ProgressIndicator current={3} total={5} />

  <h1>Building your <span className="gradient">Jordyn Agent</span></h1>

  <AnimatedProgress value={progress} />

  <TaskList>
    <Task complete={progress > 25}>
      ✓ Analyzing your website for data
    </Task>
    <Task complete={progress > 50}>
      ✓ Processing your business information
    </Task>
    <Task complete={progress > 75}>
      ✓ Optimizing your data for AI
    </Task>
    <Task complete={progress === 100}>
      ⏳ Generating your custom Jordyn agent
    </Task>
  </TaskList>
</div>
```

#### Screen 4: Preview Agent
```tsx
<div className="signup-step">
  <ProgressIndicator current={4} total={5} />

  <h1>Preview <span className="gradient">{business.name}'s</span> Custom Jordyn Agent</h1>

  <Checklist>
    <li>✓ Jordyn trained on your data</li>
    <li>✓ Listen to examples to hear your agent</li>
    <li>✓ Claim your agent and get started for free</li>
  </Checklist>

  <AudioSamples>
    <Sample label="Greeting">
      <AudioPlayer src={greetingUrl} />
    </Sample>
    <Sample label="Message">
      <AudioPlayer src={messageUrl} />
    </Sample>
  </AudioSamples>

  <button onClick={claimAgent}>Claim My Agent →</button>
</div>
```

#### Screen 5: Create Account
```tsx
<div className="signup-step">
  <ProgressIndicator current={5} total={5} />

  <h1>Claim <span className="gradient">{business.name}'s</span> Custom Jordyn Agent</h1>

  <h3>Create Your Account</h3>
  <p>Free for 7 days</p>

  <OAuthButtons>
    <button onClick={signInWithGoogle}>
      <GoogleIcon /> Continue with Google
    </button>
    <button onClick={signInWithMicrosoft}>
      <MicrosoftIcon /> Continue with Microsoft
    </button>
  </OAuthButtons>

  <Divider>or</Divider>

  <EmailSignup>
    <input type="email" placeholder="Your email" />
    <input type="password" placeholder="Create password" />
    <button>Continue with Email</button>
  </EmailSignup>

  <TrialBadge>
    Start risk-free. 7-day trial with all features.
  </TrialBadge>
</div>
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### API Routes Needed

#### 1. `/api/signup/google-business-lookup`
```typescript
POST /api/signup/google-business-lookup
Body: { query: string }
Returns: {
  predictions: [{
    place_id: string,
    name: string,
    address: string
  }]
}
```

#### 2. `/api/signup/google-business-details`
```typescript
POST /api/signup/google-business-details
Body: { place_id: string }
Returns: {
  name: string,
  phone: string,
  website: string,
  address: string,
  hours: {...},
  rating: number
}
```

#### 3. `/api/signup/train-agent`
```typescript
POST /api/signup/train-agent
Body: {
  business: {...},
  subscriber_id: string
}
Process:
- Scrape website content
- Generate system prompt
- Create VAPI assistant (no phone yet)
- Generate audio previews
Returns: {
  assistant_id: string,
  audio_samples: {
    greeting: string,
    message: string,
    faq: string
  }
}
```

#### 4. `/api/signup/claim-agent`
```typescript
POST /api/signup/claim-agent
Body: {
  email: string,
  password?: string,
  oauth_provider?: 'google' | 'microsoft',
  oauth_token?: string,
  assistant_id: string,
  business_data: {...}
}
Process:
- Create auth user
- Create subscriber (status: 'trialing')
- Link assistant to subscriber
- Set trial_ends_at = now() + 7 days
- Send welcome email
Returns: {
  subscriber_id: string,
  trial_ends_at: string
}
```

---

## 📦 DEPENDENCIES & LIBRARIES

### New NPM Packages:
```bash
npm install @react-google-maps/api  # Google Places Autocomplete
npm install cheerio                 # Website scraping
npm install puppeteer-core          # Advanced scraping if needed
npm install @supabase/auth-helpers-nextjs  # OAuth providers
```

### Environment Variables:
```env
GOOGLE_PLACES_API_KEY=your_key_here
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_secret
MICROSOFT_OAUTH_CLIENT_ID=your_client_id
MICROSOFT_OAUTH_CLIENT_SECRET=your_secret
```

---

## 🚦 IMPLEMENTATION PHASES

### Phase 1: Database + Backend (Agent 1)
- Add new fields to subscribers table
- Create trial_conversions table
- Write migration SQL

### Phase 2: Google Places Integration (Agent 2)
- Google Places API setup
- `/api/signup/google-business-lookup` route
- `/api/signup/google-business-details` route
- Business data mapping logic

### Phase 3: Website Scraping + AI Training (Agent 3)
- Website scraper service
- Content extraction logic
- System prompt generator
- `/api/signup/train-agent` route

### Phase 4: Audio Preview Generation (Agent 4)
- VAPI text-to-speech integration
- Audio sample generation
- Supabase Storage upload
- Audio player component

### Phase 5: Frontend Signup Flow (Agent 5)
- New signup route `/signup-v2`
- All 5 step components
- Progress indicator
- Animations & transitions

### Phase 6: OAuth Integration (Agent 6)
- Supabase Auth providers setup
- Google OAuth flow
- Microsoft OAuth flow
- `/api/signup/claim-agent` route

### Phase 7: Trial Management (Agent 7)
- Trial expiration cron job
- Email reminders (day 5, day 7)
- Upgrade prompt in dashboard
- Payment flow for trial conversion

---

## ✅ SUCCESS CRITERIA

1. **User can sign up in <2 minutes** (vs 5+ minutes currently)
2. **85%+ of data auto-populated** from Google Business Profile
3. **Audio preview plays** before account creation
4. **No payment required** for 7-day trial
5. **OAuth signup works** for Google + Microsoft
6. **Trial converts to paid** at 30%+ rate (industry standard: 25%)

---

## 🎯 ROLLOUT PLAN

### Step 1: Build in Parallel
- Launch 7 agents simultaneously
- Each agent works on independent phase
- Test integration points carefully

### Step 2: Soft Launch
- Deploy to `/signup-v2` (keep old `/signup` live)
- A/B test with 50% traffic
- Measure conversion rates

### Step 3: Full Rollout
- If conversion improves, make `/signup-v2` default
- Redirect `/signup` to `/signup-v2`
- Archive old signup flow

---

## 📈 METRICS TO TRACK

**Conversion Funnel:**
1. Landing page visits
2. Started signup (clicked "Start Free Trial")
3. Completed Google Business lookup
4. Listened to audio preview
5. Created account
6. Completed onboarding
7. Converted to paid (day 7)

**Success KPIs:**
- Signup completion rate: Target 60%+ (vs current 30-40%)
- Time to first value: Target <3 minutes
- Trial-to-paid conversion: Target 30%+
- Support tickets related to signup: Target 50% reduction

---

*End of JORDYN-SIGNUP-V2-SPEC.md*
