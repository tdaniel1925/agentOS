# Google Calendar Integration Setup Guide

## Step 1: Create Google Cloud Project & OAuth Credentials

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 1.2 Create a New Project
1. Click "Select a project" at the top
2. Click "New Project"
3. Name: `AgentOS Calendar Integration`
4. Click "Create"

### 1.3 Enable Google Calendar API
1. In the search bar, type "Google Calendar API"
2. Click on "Google Calendar API"
3. Click "Enable"

### 1.4 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace)
3. Click "Create"
4. Fill in required fields:
   - **App name:** AgentOS
   - **User support email:** Your email
   - **Developer contact:** Your email
5. Click "Save and Continue"
6. **Scopes:** Click "Add or Remove Scopes"
   - Add: `https://www.googleapis.com/auth/calendar`
   - Add: `https://www.googleapis.com/auth/calendar.events`
7. Click "Save and Continue"
8. **Test users:** Add your email for testing
9. Click "Save and Continue"

### 1.5 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: **Web application**
4. Name: `AgentOS Web Client`
5. **Authorized redirect URIs:**
   - For local dev: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
6. Click "Create"
7. **COPY THE CLIENT ID AND CLIENT SECRET** (you'll need these)

---

## Step 2: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

For production, update `GOOGLE_REDIRECT_URI` to your production domain.

---

## Step 3: Database Setup

We need to store Google Calendar tokens in the `subscribers` table.

The following columns should already exist (check with Supabase):
- `google_access_token` (text, nullable)
- `google_refresh_token` (text, nullable)
- `google_token_expiry` (timestamptz, nullable)
- `google_calendar_connected` (boolean, default false)

If not, run this SQL in Supabase:

```sql
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;
```

---

## Step 4: Implementation Files Created

The following files have been created:

1. **`/lib/google/calendar.ts`** - Google Calendar API helper
2. **`/app/api/auth/google/route.ts`** - OAuth initiation endpoint
3. **`/app/api/auth/google/callback/route.ts`** - OAuth callback handler
4. **`/app/api/calendar/events/route.ts`** - Create calendar events

---

## Step 5: Usage in Dashboard

Subscribers can connect their Google Calendar from the dashboard:

1. Click "Connect Google Calendar" button
2. Authorize AgentOS to access their calendar
3. Once connected, the bot can create appointments automatically

---

## Testing

1. Start your dev server: `npm run dev`
2. Log in as a subscriber
3. Click "Connect Google Calendar"
4. Authorize the app
5. Check that `google_calendar_connected = true` in Supabase

---

## Production Checklist

- [ ] Update OAuth redirect URI to production domain
- [ ] Publish OAuth consent screen (move from Testing to Production)
- [ ] Add production domain to Authorized redirect URIs
- [ ] Update `GOOGLE_REDIRECT_URI` env var in production
- [ ] Test OAuth flow on production domain

---

## Security Notes

- OAuth tokens are encrypted in transit (HTTPS)
- Refresh tokens are stored securely in Supabase
- Access tokens expire after 1 hour (automatically refreshed)
- Never expose `GOOGLE_CLIENT_SECRET` to the client
- Use Supabase RLS to protect subscriber data
