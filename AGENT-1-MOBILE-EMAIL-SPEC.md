# AGENT 1: MOBILE EMAIL INTERFACE
**Status**: Ready to Build
**Priority**: P1 (Critical Path)
**Estimated Time**: 3-4 hours
**Dependencies**: None

---

## MISSION
Build a mobile-optimized email inbox interface that displays categorized emails with full details, accessed via SMS links.

---

## SCOPE

### Files to CREATE
```
src/app/m/emails/[id]/page.tsx              # Main email inbox page (Server Component)
src/components/mobile/EmailInboxMobile.tsx   # Email list UI (Client Component)
src/components/mobile/EmailCard.tsx          # Individual email card
src/components/mobile/EmailDetailModal.tsx   # Full email view modal
src/components/mobile/FilterChip.tsx         # Category filter buttons
```

### Files to MODIFY
None - this is net new functionality

---

## DATABASE SCHEMA REFERENCE

### `email_summaries` table (READ from this)
```sql
CREATE TABLE email_summaries (
  id UUID PRIMARY KEY,
  subscriber_id UUID,
  summary_date DATE NOT NULL,
  total_unread INTEGER,
  urgent_count INTEGER,
  client_count INTEGER,
  lead_count INTEGER,
  admin_count INTEGER,
  summary_text TEXT,
  emails_data JSONB,  -- THIS IS KEY: Full email objects stored here
  created_at TIMESTAMPTZ
)
```

### `emails_data` JSONB structure
```typescript
{
  id: string
  from: {
    emailAddress: {
      name: string
      address: string
    }
  }
  subject: string
  bodyPreview: string
  receivedDateTime: string
  category: 'urgent' | 'client' | 'lead' | 'admin' | 'junk'
}
```

---

## API ENDPOINTS

### GET Email Summary (Server-side fetch)
```typescript
const supabase = createServiceClient()
const { data: summary } = await supabase
  .from('email_summaries')
  .select('*')
  .eq('subscriber_id', params.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
```

### POST Refresh Inbox (Client-side action)
```typescript
// Call the check email skill via API
POST /api/skills/email-check
Body: { subscriberId: string }
```

---

## TECHNICAL REQUIREMENTS

### 1. Page Route: `src/app/m/emails/[id]/page.tsx`

**Purpose**: Server Component that fetches email data and renders the mobile interface

**Code Structure**:
```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { EmailInboxMobile } from '@/components/mobile/EmailInboxMobile'
import { notFound } from 'next/navigation'

export default async function MobileEmailsPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = createServiceClient()

  // Fetch latest email summary
  const { data: summary, error } = await supabase
    .from('email_summaries')
    .select('*')
    .eq('subscriber_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">No Emails Yet</h1>
          <p className="text-gray-600">Text Jordan "check email" to get started!</p>
        </div>
      </div>
    )
  }

  // Parse emails from JSONB
  const emails = summary.emails_data || []

  return (
    <EmailInboxMobile
      emails={emails}
      summary={summary}
      subscriberId={params.id}
    />
  )
}

// Add metadata for SEO/mobile optimization
export const metadata = {
  title: 'Email Inbox - AgentOS',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}
```

---

### 2. Main Component: `src/components/mobile/EmailInboxMobile.tsx`

**Purpose**: Client Component that handles filtering, selection, and interactions

**Key Features**:
- Filter emails by category (all, urgent, client, lead)
- Click email to view full details
- Refresh inbox button
- Draft reply button (future)
- Mobile-optimized scrolling

**Props Interface**:
```typescript
interface EmailInboxMobileProps {
  emails: Email[]
  summary: EmailSummary
  subscriberId: string
}

interface Email {
  id: string
  from: {
    emailAddress: {
      name: string
      address: string
    }
  }
  subject: string
  bodyPreview: string
  receivedDateTime: string
  category: 'urgent' | 'client' | 'lead' | 'admin' | 'junk'
}

interface EmailSummary {
  id: string
  subscriber_id: string
  summary_date: string
  total_unread: number
  urgent_count: number
  client_count: number
  lead_count: number
  admin_count: number
  summary_text: string
  created_at: string
}
```

**State Management**:
```typescript
const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
const [filter, setFilter] = useState<'all' | 'urgent' | 'client' | 'lead'>('all')
const [isRefreshing, setIsRefreshing] = useState(false)
```

**Layout Structure**:
```tsx
<div className="flex flex-col h-screen bg-gray-50">
  {/* Header */}
  <div className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10">
    <h1 className="text-xl font-bold">📧 Inbox</h1>
    <p className="text-sm opacity-90">Last 24 hours</p>
  </div>

  {/* Summary Bar with Filter Chips */}
  <div className="bg-white border-b p-4 flex gap-2 overflow-x-auto">
    <FilterChip
      active={filter === 'all'}
      onClick={() => setFilter('all')}
      count={emails.length}
      label="All"
    />
    {summary.urgent_count > 0 && (
      <FilterChip
        active={filter === 'urgent'}
        onClick={() => setFilter('urgent')}
        count={summary.urgent_count}
        label="🔴 Urgent"
        color="red"
      />
    )}
    {/* ... more filters */}
  </div>

  {/* Email List - Scrollable */}
  <div className="flex-1 overflow-y-auto">
    {filteredEmails.length === 0 ? (
      <EmptyState filter={filter} />
    ) : (
      filteredEmails.map(email => (
        <EmailCard
          key={email.id}
          email={email}
          onClick={() => setSelectedEmail(email)}
        />
      ))
    )}
  </div>

  {/* Bottom Actions */}
  <div className="bg-white border-t p-4 sticky bottom-0">
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold disabled:opacity-50"
    >
      {isRefreshing ? 'Refreshing...' : '🔄 Refresh Inbox'}
    </button>
  </div>

  {/* Email Detail Modal */}
  {selectedEmail && (
    <EmailDetailModal
      email={selectedEmail}
      onClose={() => setSelectedEmail(null)}
    />
  )}
</div>
```

**Refresh Handler**:
```typescript
async function handleRefresh() {
  setIsRefreshing(true)

  try {
    const response = await fetch('/api/skills/email-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriberId })
    })

    if (response.ok) {
      // Reload page to show new data
      window.location.reload()
    } else {
      alert('Failed to refresh inbox')
    }
  } catch (error) {
    console.error('Refresh error:', error)
    alert('Network error')
  } finally {
    setIsRefreshing(false)
  }
}
```

---

### 3. Email Card: `src/components/mobile/EmailCard.tsx`

**Purpose**: Display individual email in list

**Props**:
```typescript
interface EmailCardProps {
  email: Email
  onClick: () => void
}
```

**Design**:
```tsx
<div
  onClick={onClick}
  className="bg-white border-b p-4 active:bg-gray-50 cursor-pointer"
>
  {/* Category badge */}
  {email.category === 'urgent' && (
    <div className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mb-2">
      🔴 Urgent
    </div>
  )}

  {/* From */}
  <div className="text-sm font-semibold text-gray-900 mb-1">
    {email.from.emailAddress.name || email.from.emailAddress.address}
  </div>

  {/* Subject */}
  <div className="text-base font-medium text-gray-800 mb-2">
    {email.subject || '(no subject)'}
  </div>

  {/* Preview */}
  <div className="text-sm text-gray-600 line-clamp-2">
    {email.bodyPreview}
  </div>

  {/* Timestamp */}
  <div className="text-xs text-gray-500 mt-2">
    {formatTimestamp(email.receivedDateTime)}
  </div>
</div>
```

**Timestamp Formatter**:
```typescript
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}
```

---

### 4. Email Detail Modal: `src/components/mobile/EmailDetailModal.tsx`

**Purpose**: Full-screen modal showing complete email

**Props**:
```typescript
interface EmailDetailModalProps {
  email: Email
  onClose: () => void
}
```

**Design**:
```tsx
<div className="fixed inset-0 bg-white z-50 overflow-y-auto">
  {/* Header */}
  <div className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10 flex items-center justify-between">
    <button onClick={onClose} className="text-2xl">←</button>
    <h2 className="text-lg font-semibold">Email Details</h2>
    <div className="w-8" /> {/* Spacer for centering */}
  </div>

  {/* Email Content */}
  <div className="p-4">
    {/* Category Badge */}
    {email.category === 'urgent' && (
      <div className="inline-block bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full mb-4">
        🔴 Urgent
      </div>
    )}

    {/* From */}
    <div className="mb-4">
      <div className="text-xs text-gray-500 uppercase mb-1">From</div>
      <div className="text-base font-semibold">
        {email.from.emailAddress.name || email.from.emailAddress.address}
      </div>
      <div className="text-sm text-gray-600">
        {email.from.emailAddress.address}
      </div>
    </div>

    {/* Subject */}
    <div className="mb-4">
      <div className="text-xs text-gray-500 uppercase mb-1">Subject</div>
      <div className="text-lg font-semibold">
        {email.subject || '(no subject)'}
      </div>
    </div>

    {/* Timestamp */}
    <div className="mb-6">
      <div className="text-xs text-gray-500 uppercase mb-1">Received</div>
      <div className="text-sm">
        {new Date(email.receivedDateTime).toLocaleString()}
      </div>
    </div>

    {/* Body Preview */}
    <div className="mb-6">
      <div className="text-xs text-gray-500 uppercase mb-2">Message</div>
      <div className="text-base text-gray-800 whitespace-pre-wrap">
        {email.bodyPreview}
      </div>
    </div>

    {/* Note about full email */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
      💡 This is a preview. Text Jordan "reply to this email" to draft a response.
    </div>
  </div>

  {/* Actions */}
  <div className="sticky bottom-0 bg-white border-t p-4">
    <button
      onClick={onClose}
      className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold"
    >
      Close
    </button>
  </div>
</div>
```

---

### 5. Filter Chip: `src/components/mobile/FilterChip.tsx`

**Purpose**: Category filter button

**Props**:
```typescript
interface FilterChipProps {
  active: boolean
  onClick: () => void
  count: number
  label: string
  color?: 'red' | 'blue' | 'green' | 'gray'
}
```

**Design**:
```tsx
<button
  onClick={onClick}
  className={`
    flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap
    ${active
      ? `bg-${color || 'gray'}-600 text-white`
      : `bg-${color || 'gray'}-100 text-${color || 'gray'}-800`
    }
  `}
>
  <span>{label}</span>
  <span className={`text-xs ${active ? 'opacity-90' : 'opacity-70'}`}>
    ({count})
  </span>
</button>
```

---

## STYLING REQUIREMENTS

### Color Palette
```css
/* Brand Colors */
--brand-navy: #1B3A7D
--brand-red: #C7181F
--brand-white: #FFFFFF

/* Category Colors */
--urgent-red: rgb(239, 68, 68)
--urgent-red-light: rgb(254, 226, 226)
--client-blue: rgb(59, 130, 246)
--client-blue-light: rgb(219, 234, 254)
--lead-green: rgb(34, 197, 94)
--lead-green-light: rgb(220, 252, 231)
```

### Mobile Optimizations
```css
/* Prevent text selection on tap */
.email-card {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

/* Smooth scrolling */
.email-list {
  -webkit-overflow-scrolling: touch;
}

/* Safe area for iPhone notch */
.header {
  padding-top: max(env(safe-area-inset-top), 1rem);
}
```

---

## TESTING CHECKLIST

### Functional Tests
- [ ] Page loads with subscriber ID in URL
- [ ] Displays "No emails yet" when email_summaries is empty
- [ ] Shows all emails when filter = "all"
- [ ] Urgent filter only shows urgent emails
- [ ] Client filter only shows client emails
- [ ] Lead filter only shows lead emails
- [ ] Click email card opens detail modal
- [ ] Click back arrow closes modal
- [ ] Refresh button triggers API call
- [ ] Page reloads after successful refresh
- [ ] Timestamp formatting works correctly
- [ ] Category badges display correctly

### Mobile Tests
- [ ] Responsive on iPhone SE (375px width)
- [ ] Responsive on iPhone 14 Pro (393px width)
- [ ] Responsive on iPhone 14 Pro Max (430px width)
- [ ] Responsive on Android (360px width)
- [ ] No horizontal scrolling except filter chips
- [ ] Bottom buttons don't overlap with content
- [ ] Modal scrolls correctly with long emails
- [ ] Touch targets are at least 44x44px
- [ ] No zoom on input focus (font-size >= 16px)

### Edge Cases
- [ ] Handles missing email.subject gracefully
- [ ] Handles missing from.emailAddress.name gracefully
- [ ] Handles empty bodyPreview
- [ ] Handles invalid receivedDateTime
- [ ] Handles category = undefined
- [ ] Handles 0 emails in filtered view
- [ ] Handles network error on refresh

---

## SUCCESS CRITERIA

1. **User can view emails from SMS link**
   - URL: `https://theapexbots.com/m/emails/[subscriber_id]`
   - Loads in < 2 seconds
   - Works offline (shows last loaded data)

2. **User can filter emails**
   - All, Urgent, Client, Lead filters work
   - Badge counts match summary data

3. **User can view email details**
   - Modal opens smoothly
   - All email fields display correctly
   - Close button returns to list

4. **User can refresh inbox**
   - Button shows loading state
   - API call completes successfully
   - Page reloads with new data

---

## DEBUGGING GUIDE

### Issue: Page shows "No Emails Yet"
**Check**:
1. Does `email_summaries` table have data for this subscriber_id?
   ```sql
   SELECT * FROM email_summaries WHERE subscriber_id = '[id]';
   ```
2. Is `emails_data` JSONB field populated?
3. Is the subscriber_id in URL correct?

### Issue: Emails not filtering correctly
**Check**:
1. Does each email have a `category` field?
2. Is category one of: 'urgent' | 'client' | 'lead' | 'admin' | 'junk'?
3. Console log `filteredEmails` array

### Issue: Refresh button doesn't work
**Check**:
1. Does `/api/skills/email-check` endpoint exist?
2. Check Network tab for 404/500 errors
3. Check subscriberId is being passed correctly
4. Check CORS if calling from different domain

### Issue: Modal doesn't close
**Check**:
1. Is `onClose` handler being called?
2. Is `selectedEmail` being set to null?
3. Check for JavaScript errors in console

---

## FILES SUMMARY

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/m/emails/[id]/page.tsx` | ~80 | Server Component - Data fetching |
| `src/components/mobile/EmailInboxMobile.tsx` | ~150 | Main UI - Filtering & state |
| `src/components/mobile/EmailCard.tsx` | ~60 | Email list item |
| `src/components/mobile/EmailDetailModal.tsx` | ~100 | Full email view |
| `src/components/mobile/FilterChip.tsx` | ~30 | Filter button |

**Total**: ~420 lines of code

---

## DEPENDENCIES TO INSTALL

```bash
# Already in project:
- next
- react
- typescript
- tailwindcss
- @supabase/supabase-js

# May need to add:
npm install clsx  # For conditional classnames
```

---

## NEXT STEPS AFTER COMPLETION

1. Test URL: `http://localhost:3000/m/emails/[real-subscriber-id]`
2. Modify `email-check.ts` to add link in SMS (Agent 4 handles this)
3. Deploy to Vercel
4. Test on real iPhone/Android device
5. Monitor Sentry for errors

---

## NOTES

- This is a **read-only interface** - no email actions (reply/delete) in v1
- Email body is preview only (first 500 chars from Microsoft Graph)
- Full email viewing requires Microsoft Graph API call (future feature)
- Draft reply feature = future enhancement
- This page requires NO authentication (uses subscriber_id in URL)
  - Consider adding a security token in production
