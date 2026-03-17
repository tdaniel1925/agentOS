# AGENT EXECUTION PLAN - Jordyn Signup V2
## 7 Agents Working in Parallel Without Conflicts

---

## 🎯 STRATEGY: Divide by Isolation Boundaries

**Key Principle:** Each agent works on files/features that DON'T overlap with others.

**Dependency Management:**
- Agents 1-3: Backend (no frontend dependencies)
- Agents 4-6: Frontend (no backend dependencies beyond API contracts)
- Agent 7: Configuration only (no code conflicts)

**Communication:** Each agent creates **interface contracts** that others can reference.

---

## 👥 AGENT ASSIGNMENTS

### 🤖 AGENT 1: Database Schema & Migrations
**Scope:** Database structure only
**Files:**
- `supabase/migrations/014_signup_v2_schema.sql`
- No conflicts with other agents

**Tasks:**
1. Add new fields to `subscribers` table:
   - `google_place_id`, `business_website`, `business_address`, `business_hours`
   - `trial_started_at`, `trial_ends_at`, `trial_used`, `signup_source`
   - `website_scraped_at`, `website_content`
2. Create `trial_conversions` table
3. Create indexes for performance
4. Add RLS policies

**Deliverable:** SQL migration file ready to run

---

### 🤖 AGENT 2: Google Places API Integration
**Scope:** Google Business Profile lookup
**Files:**
- `src/lib/google/places.ts` (NEW - no conflicts)
- `src/app/api/signup/google-business-lookup/route.ts` (NEW)
- `src/app/api/signup/google-business-details/route.ts` (NEW)

**Tasks:**
1. Create Google Places client wrapper
2. Implement business name autocomplete
3. Implement place details fetch
4. Map Google data to Jordyn schema
5. Error handling & rate limiting

**API Contract (for other agents):**
```typescript
// src/lib/google/places.ts
export async function searchBusinesses(query: string): Promise<BusinessPrediction[]>
export async function getBusinessDetails(placeId: string): Promise<BusinessDetails>

interface BusinessDetails {
  name: string
  phone: string
  website: string
  address: string
  hours: object
  rating: number
}
```

**No Dependencies:** Works standalone

---

### 🤖 AGENT 3: Website Scraping & AI Training
**Scope:** Content extraction + VAPI assistant creation
**Files:**
- `src/lib/scraping/website-scraper.ts` (NEW)
- `src/lib/ai/prompt-generator.ts` (NEW)
- `src/app/api/signup/train-agent/route.ts` (NEW)

**Tasks:**
1. Website content scraper (Cheerio)
2. FAQ extractor
3. System prompt generator from business data
4. VAPI assistant creation (without phone provisioning)
5. Training simulation timing logic

**API Contract:**
```typescript
// src/lib/scraping/website-scraper.ts
export async function scrapeWebsite(url: string): Promise<WebsiteContent>

// src/lib/ai/prompt-generator.ts
export function generateSystemPrompt(business: BusinessDetails, content: WebsiteContent): string

// API route returns:
{
  assistant_id: string,
  training_complete: boolean
}
```

**No Dependencies:** Uses Agent 2's interface contract but doesn't modify its code

---

### 🤖 AGENT 4: Audio Preview Generation
**Scope:** VAPI text-to-speech + storage
**Files:**
- `src/lib/vapi/audio-preview.ts` (NEW)
- `src/lib/storage/audio-storage.ts` (NEW)
- `src/app/api/signup/generate-audio-previews/route.ts` (NEW)

**Tasks:**
1. VAPI TTS API integration
2. Generate 3 audio samples (greeting, message, FAQ)
3. Upload to Supabase Storage
4. Return public URLs

**API Contract:**
```typescript
// src/lib/vapi/audio-preview.ts
export async function generateAudioPreviews(business: BusinessDetails): Promise<AudioSamples>

interface AudioSamples {
  greeting: string,  // URL
  message: string,   // URL
  faq: string        // URL
}
```

**No Dependencies:** Works standalone

---

### 🤖 AGENT 5: Frontend - Signup Flow Pages
**Scope:** UI components and pages
**Files:**
- `src/app/(public)/signup-v2/page.tsx` (NEW)
- `src/components/signup-v2/Step1GoogleLookup.tsx` (NEW)
- `src/components/signup-v2/Step2ConfirmBusiness.tsx` (NEW)
- `src/components/signup-v2/Step3Training.tsx` (NEW)
- `src/components/signup-v2/Step4Preview.tsx` (NEW)
- `src/components/signup-v2/Step5CreateAccount.tsx` (NEW)
- `src/components/signup-v2/ProgressIndicator.tsx` (NEW)

**Tasks:**
1. All 5 step components matching Rosie design
2. Progress indicator
3. Animations & transitions
4. State management (useState for flow)
5. Call backend APIs (using contracts from Agents 2-4)

**No Dependencies on code:** Only uses API contracts

---

### 🤖 AGENT 6: OAuth Integration
**Scope:** Google + Microsoft OAuth
**Files:**
- `src/app/api/auth/google/callback/route.ts` (NEW)
- `src/app/api/auth/microsoft/callback/route.ts` (NEW)
- `src/app/api/signup/claim-agent/route.ts` (NEW)
- `src/lib/auth/oauth-providers.ts` (NEW)

**Tasks:**
1. Supabase Auth provider setup
2. Google OAuth flow
3. Microsoft OAuth flow
4. `/api/signup/claim-agent` endpoint (creates subscriber + links assistant)
5. Trial period initialization

**API Contract:**
```typescript
// POST /api/signup/claim-agent
Body: {
  email: string,
  oauth_provider?: 'google' | 'microsoft',
  assistant_id: string,
  business_data: BusinessDetails
}
Returns: {
  subscriber_id: string,
  trial_ends_at: string
}
```

**No Dependencies:** Uses Agent 1's schema but doesn't modify migration files

---

### 🤖 AGENT 7: Trial Management System
**Scope:** Trial expiration + conversion
**Files:**
- `src/lib/cron/trial-expiration.ts` (NEW)
- `src/app/api/cron/check-trial-expirations/route.ts` (NEW)
- `src/components/dashboard/TrialBanner.tsx` (NEW)
- Email templates for trial reminders

**Tasks:**
1. Cron job to check trial expirations
2. Email reminders (day 5, day 7)
3. Dashboard trial banner ("X days left")
4. Upgrade prompt + payment flow
5. Auto-pause features on trial end

**No Dependencies:** Uses Agent 1's schema, doesn't conflict with others

---

## 📋 EXECUTION ORDER

### Round 1: Foundation (Run in Parallel)
```bash
Agent 1: Database schema
Agent 2: Google Places API
Agent 3: Website scraping
Agent 4: Audio previews
```
**Why parallel?** Zero code overlap. Each works on separate files.

### Round 2: Integration (Run in Parallel)
```bash
Agent 5: Frontend components (uses APIs from Round 1)
Agent 6: OAuth + claim agent (uses schema from Agent 1)
Agent 7: Trial management (uses schema from Agent 1)
```
**Why parallel?** They reference Round 1 outputs but don't modify them.

---

## 🔒 CONFLICT PREVENTION

### File Naming Convention
```
Agent 1: supabase/migrations/014_*.sql
Agent 2: src/lib/google/* + src/app/api/signup/google-*
Agent 3: src/lib/scraping/* + src/lib/ai/* + src/app/api/signup/train-*
Agent 4: src/lib/vapi/audio-* + src/lib/storage/*
Agent 5: src/app/(public)/signup-v2/* + src/components/signup-v2/*
Agent 6: src/app/api/auth/* + src/app/api/signup/claim-*
Agent 7: src/lib/cron/* + src/app/api/cron/*
```
**Result:** ZERO file overlaps = ZERO merge conflicts

### Shared Interfaces (Created First)
Before launching agents, create interface files:

```typescript
// src/types/signup-v2.ts (create manually first)
export interface BusinessDetails {
  name: string
  phone: string
  website: string
  address: string
  hours: object
  rating: number
  place_id: string
}

export interface AudioSamples {
  greeting: string
  message: string
  faq: string
}

export interface TrainingProgress {
  step: number
  message: string
  complete: boolean
}
```

All agents reference this file but DON'T modify it.

---

## ✅ VALIDATION CHECKLIST

After all agents complete:

**Backend Integration Test:**
```bash
1. Run database migration (Agent 1)
2. Test Google lookup API (Agent 2)
3. Test training API (Agent 3)
4. Test audio preview API (Agent 4)
5. Test claim agent API (Agent 6)
```

**Frontend Integration Test:**
```bash
1. Load /signup-v2 page (Agent 5)
2. Type business name → See autocomplete
3. Select business → See confirmation
4. Watch training animation
5. Play audio previews
6. Click OAuth button → Auth flow works
7. Complete signup → Dashboard loads
```

**Trial Management Test:**
```bash
1. Sign up with trial
2. Check trial_ends_at is set
3. Wait (or manually trigger cron)
4. Verify expiration logic works
5. Check upgrade prompt appears
```

---

## 🚀 LAUNCH COMMAND

```bash
# Create shared types first
touch src/types/signup-v2.ts
# (populate with interfaces)

# Launch Round 1 (4 agents in parallel)
# Use Task tool with 4 separate invocations in one message

# After Round 1 completes, launch Round 2 (3 agents)
# Use Task tool with 3 separate invocations

# Total time: ~45-60 minutes for all 7 agents
# vs 4-5 hours doing sequentially
```

---

*End of Agent Execution Plan*
