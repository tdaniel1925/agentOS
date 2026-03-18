# Supabase Authentication "Invalid API Key" Error - Complete Solution

## Problem Summary
Users getting "Invalid API key" error when trying to log in at https://jordyn.app/login despite having correct Supabase credentials configured.

## Root Causes Identified

### 1. API Key Format Mismatch (PRIMARY ISSUE)
Supabase has transitioned from legacy JWT-based keys to new publishable/secret keys. Your project may have been migrated to the new format on the Supabase side, but the application is still using legacy keys.

**Legacy Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT)
**New Format**: `sb_publishable_...` (Publishable Key)

### 2. Environment Variables Not Available in Production
Vercel production builds may not have environment variables properly configured, causing authentication to fail.

### 3. Hardcoded Fallback Values
The previous code had hardcoded fallback values that masked the real issue by not throwing errors when environment variables were missing.

## Solution Steps

### Step 1: Check Your Supabase API Keys

1. Log into [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `xxxtbzypheuiniuqynas`
3. Navigate to: **Settings** → **API**
4. Check what format your keys are in:

**If you see NEW FORMAT keys:**
- `Publishable key` starting with `sb_publishable_...`
- `Secret key` starting with `sb_secret_...`

**If you see LEGACY FORMAT keys:**
- `anon` key starting with `eyJ...`
- `service_role` key starting with `eyJ...`

**Screenshot location to look for:**
- Project Settings → API → Project API keys section

### Step 2: Determine Which Keys to Use

#### Option A: Using New Keys (RECOMMENDED)
If your Supabase project has migrated to new keys:

1. Copy the **Publishable key** (looks like: `sb_publishable_xxxxx...`)
2. Copy the **Secret key** (looks like: `sb_secret_xxxxx...`)

#### Option B: Using Legacy Keys
If your project still shows legacy JWT keys:

1. Copy the **anon** key (JWT starting with `eyJ...`)
2. Copy the **service_role** key (JWT starting with `eyJ...`)

**Note:** Legacy keys will eventually be deprecated. Consider migrating to new keys.

### Step 3: Update Environment Variables

#### Local Development (.env.local)

Update your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxtbzypheuiniuqynas.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste_your_key_here>
SUPABASE_SERVICE_ROLE_KEY=<paste_your_service_role_key_here>
```

**IMPORTANT:** Use the keys you copied from Step 2. Don't use the old hardcoded values.

#### Vercel Production Environment

1. Go to your Vercel dashboard
2. Select your project: `agentos-platform`
3. Go to **Settings** → **Environment Variables**
4. Update or add these variables for **Production** environment:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxtbzypheuiniuqynas.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your_actual_key>
SUPABASE_SERVICE_ROLE_KEY = <your_actual_service_role_key>
```

5. Click **Save**
6. **Redeploy** your application for changes to take effect

### Step 4: Test Your Configuration

#### Test Locally First

1. Delete `.next` folder to clear build cache:
   ```bash
   rm -rf .next
   ```

2. Restart your development server:
   ```bash
   npm run dev
   ```

3. Visit: http://localhost:4000/debug/supabase-test
   - This page runs comprehensive diagnostics
   - Check all tests show green (success)
   - Review any errors in the details

4. Visit: http://localhost:4000/api/debug/supabase-config
   - This API endpoint shows your server-side configuration
   - Verify `keyType` shows correct format (NEW_PUBLISHABLE_KEY or LEGACY_JWT_KEY)
   - Check `issues` array is empty

5. Try logging in: http://localhost:4000/login

#### Test in Production

1. After redeploying to Vercel, visit:
   - https://jordyn.app/debug/supabase-test
   - https://jordyn.app/api/debug/supabase-config

2. Verify all tests pass

3. Try logging in: https://jordyn.app/login

### Step 5: Verify Supabase Dashboard Settings

1. In Supabase Dashboard, go to: **Authentication** → **URL Configuration**
2. Verify these settings:

```
Site URL: https://jordyn.app
Redirect URLs:
  - https://jordyn.app/**
  - http://localhost:4000/**
```

3. Go to: **Authentication** → **Providers**
4. Verify **Email** provider is enabled

## Code Changes Made

### 1. Updated Browser Client (`src/lib/supabase/client.ts`)
- Removed hardcoded fallback values
- Added proper error handling for missing environment variables
- Added diagnostic logging to identify key type
- Now throws clear error if environment variables are missing

### 2. Updated Server Client (`src/lib/supabase/server.ts`)
- Added validation for environment variables
- Improved error messages
- Removed non-null assertions that masked issues

### 3. Created Diagnostic Tools
- `/debug/supabase-test` - Comprehensive testing page
- `/api/debug/supabase-config` - Server-side config inspector

## Common Issues and Solutions

### Issue: "Missing Supabase credentials" Error

**Cause:** Environment variables not set properly

**Solution:**
1. Check `.env.local` file exists and has correct values
2. Restart development server after changing `.env.local`
3. In Vercel, check environment variables are set for correct environment
4. Redeploy after updating Vercel environment variables

### Issue: Still Getting "Invalid API key" After Update

**Cause:** Key format mismatch

**Solution:**
1. Run diagnostic: `/api/debug/supabase-config`
2. Check `keyType` field
3. If it says `UNKNOWN`, your key format is wrong
4. Go back to Supabase dashboard and verify you copied the correct key
5. Some projects show BOTH legacy and new keys - make sure you're using the active one

### Issue: Works Locally But Not in Production

**Cause:** Vercel environment variables not configured

**Solution:**
1. Verify environment variables in Vercel dashboard
2. Ensure variables are set for **Production** environment
3. **IMPORTANT:** Redeploy after changing environment variables
4. Use Vercel CLI to verify: `vercel env pull`

### Issue: "JWT has expired" in Diagnostics

**Cause:** Using an old/expired JWT key

**Solution:**
1. Go to Supabase dashboard → Settings → API
2. Click "Reset" on the anon key
3. Copy the new key
4. Update your environment variables
5. Redeploy

## Verification Checklist

- [ ] Copied correct API keys from Supabase dashboard
- [ ] Updated `.env.local` file with new keys
- [ ] Restarted local development server
- [ ] Tested locally at `/debug/supabase-test` - all tests pass
- [ ] Updated Vercel environment variables
- [ ] Redeployed to Vercel
- [ ] Tested production at `https://jordyn.app/debug/supabase-test`
- [ ] Verified Site URL and Redirect URLs in Supabase dashboard
- [ ] Successfully logged in at `https://jordyn.app/login`

## Additional Resources

- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [New API Keys Migration Guide](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

## Support

If the issue persists after following all steps:

1. Check browser console for detailed error messages
2. Check Vercel deployment logs for server-side errors
3. Verify your Supabase project is active and not paused
4. Check Supabase project logs in Dashboard → Logs
5. Ensure you're using compatible versions:
   - `@supabase/supabase-js`: 2.99.1 (current)
   - `@supabase/ssr`: 0.9.0 (current)

## Technical Details

### Why This Error Happens

Supabase introduced new API keys (publishable/secret) to address limitations with JWT-based keys:

1. **Tight Coupling**: JWT keys tied together anon, service_role, and authenticated roles
2. **Rotation Issues**: Couldn't independently rotate keys without downtime
3. **Mobile App Problems**: App store review delays caused extended outages during key rotation

The new system allows independent rotation and better security, but requires updating application code to use the new key format.

### Detection Logic

The updated code now detects key type:
- Starts with `sb_publishable_` = New publishable key
- Starts with `eyJ` = Legacy JWT key
- Neither = Invalid/corrupted key

This helps diagnose configuration issues quickly.
