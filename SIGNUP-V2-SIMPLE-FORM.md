# Signup V2 - Simple Form Version

## What Changed

We've simplified the signup flow by:
1. Removing the Google Business Profile lookup and replacing it with a clean form
2. Removing OAuth (Google/Microsoft) - using only email/password signup

### Flow Changes

**Before (5 steps):**
1. Google Business lookup
2. Confirm business details
3. AI training
4. Audio preview
5. Create account

**After (4 steps):**
1. **Tell us about your business** (simple form)
2. AI training animation
3. Audio preview
4. Create account

### New Form Fields

Users now enter:
- Business Name *
- Business Phone Number *
- Website (optional - we'll scrape it if provided)
- Business Address *
- Business Description * (What does your business do?)

The description field is used to train the AI agent when no website is provided or when website scraping fails.

## Files Modified

### New Files
1. **src/components/signup-v2/Step1BusinessInfo.tsx**
   - Beautiful form with validation
   - Icons for each field
   - Clear error messages
   - "7-day free trial • No credit card required" badge

### Modified Files
1. **src/types/signup-v2.ts**
   - Added `description?: string` to BusinessDetails interface

2. **src/app/(public)/signup-v2/page.tsx**
   - Updated to use new Step1BusinessInfo component
   - Changed from 5 steps to 4 steps
   - Removed Step2ConfirmBusiness (no longer needed)

3. **src/lib/ai/prompt-generator.ts**
   - Now accepts `null` for WebsiteContent (when no website)
   - Uses business.description as fallback for ABOUT section
   - Priority: Scraped website content → User description → Default message

### Removed Dependencies
- Google Places API routes (no longer needed)
- Google Business lookup component
- OAuth integration (Google/Microsoft sign-in removed)

## Environment Variables

Add these to your Vercel deployment:

```env
# ElevenLabs for audio preview
ELEVENLABS_API_KEY=sk_073ed23321e0920c482969df382d59113b324617bb8c0a88

# Cron job authentication
CRON_SECRET=fddc4e57768ab8bfffc7ceb27b469b1dbd31c57a75caba748c74da86b827b007

# VAPI for AI voice (you already have this)
VAPI_API_KEY=your_existing_key

# Supabase (you already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Deployment Checklist

### 1. Database Migration
Run this in Supabase SQL Editor:
```sql
-- Located at: supabase/migrations/014_signup_v2_schema.sql
-- Adds trial management fields, Google Business fields, etc.
```

### 2. Supabase Storage
Create storage bucket:
- Name: `audio-previews`
- Make it **public** (for audio playback)

### 3. Add Environment Variables to Vercel
Add the env vars listed above to your Vercel project settings.

### 4. Set Up Cron Job

✅ **Already configured!** The `vercel.json` file has been created with the cron job.

The cron job will run daily at 9:00 AM UTC to:
- Send Day 5 trial reminder emails (2 days left)
- Pause features for expired trials (Day 7+)
- Send expiration emails

**What's configured:**
```json
{
  "crons": [{
    "path": "/api/cron/check-trial-expirations",
    "schedule": "0 9 * * *"
  }]
}
```

This will automatically activate when you deploy to Vercel. No manual setup needed!

### 5. Test the Flow
1. Navigate to `https://jordyn.app/signup-v2`
2. Fill out the business info form
3. Watch the AI training animation
4. Listen to the audio previews (should say the business name)
5. Create an account with email/password
6. Verify trial period starts correctly

## How It Works

### Step 1: Business Info Form
- User fills out simple form
- Frontend validation ensures all required fields are complete
- Description field provides context for AI training

### Step 2: AI Training
- If website is provided → scrapes it for FAQs, services, etc.
- Uses business description from Step 1 in the AI prompt
- Creates VAPI assistant with personalized system prompt
- Shows animated progress (15-20 seconds)

### Step 3: Audio Preview
- Generates 3 audio samples using ElevenLabs:
  - **Greeting:** "Hi, this is Jordyn calling from [Business Name]..."
  - **Message:** "I'd be happy to take a message and have someone from [Business Name] call you back..."
  - **FAQ:** Personalized response with business context
- User can play each sample before claiming agent

### Step 4: Create Account
- Simple email/password signup
- Creates auth user + subscriber record
- Starts 7-day free trial (no credit card)
- Links VAPI assistant to subscriber
- Sends welcome email

## AI Agent Training Logic

The AI agent is trained using this priority:

1. **Scraped Website Content** (if website provided and scraping succeeds)
   - FAQs from website
   - Services listed
   - About section
   - Contact info

2. **User Description** (from signup form)
   - Used in ABOUT section
   - Helps AI understand what the business does

3. **Default Fallback**
   - Generic helpful assistant
   - Takes messages and schedules callbacks

This ensures we always create a useful AI agent, even without a website.

## What Users See

**Step 1:**
```
Tell us about your business
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We'll use this information to train your custom AI receptionist

[Form with business name, phone, website, address, description]

[Continue to Training]

✅ 7-day free trial • No credit card required
```

**Step 2:**
```
Training Jordyn on your business...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Reading your website
✅ Learning about your services
✅ Creating voice personality
⏳ Generating audio previews

[Progress bar: 75%]
```

**Step 3:**
```
Preview Your AI Receptionist
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎵 Greeting
[Audio player: "Hi, this is Jordyn calling from Joe's Pizza..."]

🎵 Taking Messages
[Audio player: "I'd be happy to take a message..."]

🎵 Answering Questions
[Audio player: "Thanks for your question about Joe's Pizza..."]

[Claim My Agent]
```

## Benefits of This Approach

✅ **Faster signup** - No searching for Google Business Profile
✅ **More control** - Users provide exactly what they want
✅ **Better descriptions** - Users can explain their business in their own words
✅ **Simpler auth** - Just email/password, no OAuth complexity
✅ **No API dependencies** - Don't need Google Places or OAuth APIs
✅ **Clearer pricing** - "7-day free trial" is prominent
✅ **Builds trust** - Audio preview before any commitment

## Quick Start Checklist

Here's what you need to do to deploy:

- [ ] **1. Run database migration**
  - Open Supabase SQL Editor
  - Run: `supabase/migrations/014_signup_v2_schema.sql`

- [ ] **2. Create storage bucket**
  - In Supabase Dashboard → Storage
  - Create bucket: `audio-previews`
  - Make it **public**

- [ ] **3. Add environment variables to Vercel**
  ```
  ELEVENLABS_API_KEY=sk_073ed23321e0920c482969df382d59113b324617bb8c0a88
  CRON_SECRET=fddc4e57768ab8bfffc7ceb27b469b1dbd31c57a75caba748c74da86b827b007
  ```

- [x] **4. Cron job** ✅ Already configured in `vercel.json`

- [ ] **5. Deploy to Vercel**
  - Push to your git repository
  - Vercel will auto-deploy

- [ ] **6. Test the flow**
  - Visit: `https://jordyn.app/signup-v2`
  - Complete all 4 steps
  - Verify audio samples play
  - Confirm trial period starts

---

**Ready to deploy!** The signup flow is now simpler, faster, and more user-friendly. 🚀
