# Google Calendar Integration - Next Steps

## ✅ What's Been Completed

1. **Code Implementation** ✅
   - Google Calendar OAuth flow (initiate + callback)
   - Token storage and auto-refresh
   - Calendar events API (create, list)
   - Dashboard UI with "Connect Google Calendar" button
   - Complete error handling

2. **Files Created** ✅
   - `/lib/google/calendar.ts` - Calendar API helpers
   - `/app/api/auth/google/route.ts` - OAuth initiation
   - `/app/api/auth/google/callback/route.ts` - OAuth callback handler
   - `/app/api/calendar/events/route.ts` - Events CRUD API
   - `GOOGLE-CALENDAR-SETUP.md` - Complete setup guide

3. **Package Installed** ✅
   - `googleapis` package added to dependencies

---

## 🔧 What You Need to Do

### Step 1: Create Google Cloud Project (15 minutes)

Follow the detailed guide in `GOOGLE-CALENDAR-SETUP.md`, but here's the quick version:

1. **Go to:** https://console.cloud.google.com/
2. **Create new project:** "AgentOS Calendar Integration"
3. **Enable API:** Search for "Google Calendar API" and enable it
4. **OAuth Consent Screen:**
   - Type: External
   - App name: AgentOS
   - Scopes: Add `calendar` and `calendar.events`
   - Test users: Add your email
5. **Create Credentials:**
   - Type: OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
     - `https://yourdomain.com/api/auth/google/callback`
6. **Copy Client ID and Secret**

### Step 2: Add Environment Variables

Add to `.env.local`:

```bash
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Step 3: Update Supabase Database

Run this SQL in Supabase SQL Editor:

```sql
-- Add Google Calendar columns to subscribers table
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_calendar_connected
ON subscribers(google_calendar_connected);
```

### Step 4: Test the Integration

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Log in as a subscriber**

3. **Connect Google Calendar:**
   - Look for "Google Calendar" section in Bot Info panel
   - Click "Connect" button
   - Authorize AgentOS
   - Should redirect back with success message

4. **Verify in Supabase:**
   - Check `google_calendar_connected = true`
   - Check tokens are stored

5. **Test API endpoints:**
   ```bash
   # List events
   curl http://localhost:3000/api/calendar/events

   # Create event
   curl -X POST http://localhost:3000/api/calendar/events \
     -H "Content-Type: application/json" \
     -d '{
       "summary": "Test Meeting",
       "description": "Created by AgentOS",
       "startTime": "2024-01-20T14:00:00Z",
       "endTime": "2024-01-20T15:00:00Z",
       "attendees": ["client@example.com"]
     }'
   ```

---

## 🚀 Production Deployment

When ready for production:

1. **Update OAuth Consent Screen:**
   - Change from "Testing" to "Production"
   - Submit for verification (if needed)

2. **Add Production Redirect URI:**
   - Go to Google Cloud Console → Credentials
   - Add your production domain to authorized redirect URIs
   - Example: `https://theapexbots.com/api/auth/google/callback`

3. **Update Environment Variables:**
   - In Vercel (or your host), add:
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `GOOGLE_REDIRECT_URI` (production URL)

4. **Test on Production:**
   - Connect calendar as a real subscriber
   - Create a test event
   - Verify it appears in Google Calendar

---

## 📋 Quick Reference

### OAuth Flow
```
User clicks "Connect"
  → /api/auth/google
  → Google consent screen
  → /api/auth/google/callback
  → Tokens stored in DB
  → Redirect to /app
```

### API Endpoints
- `GET /api/auth/google` - Initiate OAuth
- `GET /api/auth/google/callback` - Handle OAuth callback
- `GET /api/calendar/events` - List upcoming events
- `POST /api/calendar/events` - Create new event

### Database Fields
- `google_access_token` - Short-lived (1 hour)
- `google_refresh_token` - Long-lived (permanent)
- `google_token_expiry` - When access token expires
- `google_calendar_connected` - Connection status

---

## 🐛 Troubleshooting

**"Invalid redirect URI"**
- Make sure redirect URI in Google Console exactly matches `GOOGLE_REDIRECT_URI` env var
- No trailing slashes

**"Token expired"**
- Access tokens expire after 1 hour
- Refresh happens automatically
- Check `google_refresh_token` is stored

**"Calendar not connected"**
- Check `google_calendar_connected = true` in database
- Re-authorize if needed

**"Access denied"**
- User clicked "Cancel" on Google consent screen
- Try connecting again

---

## 📚 Resources

- **Setup Guide:** `GOOGLE-CALENDAR-SETUP.md`
- **Google Cloud Console:** https://console.cloud.google.com/
- **Google Calendar API Docs:** https://developers.google.com/calendar/api/v3/reference
- **OAuth 2.0 Guide:** https://developers.google.com/identity/protocols/oauth2

---

**Ready to test!** Follow steps 1-4 above and you'll have Google Calendar working in about 20 minutes.
