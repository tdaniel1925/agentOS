# AGENT 2: MOBILE CALLS & CALENDAR INTERFACE
**Status**: Ready to Build
**Priority**: P2
**Estimated Time**: 3-4 hours
**Dependencies**: None (can run parallel with Agent 1)

---

## MISSION
Build mobile-optimized interfaces for viewing call history with transcripts and calendar events, accessed via SMS links.

---

## SCOPE

### Files to CREATE
```
src/app/m/calls/[id]/page.tsx               # Call history page (Server Component)
src/app/m/calendar/[id]/page.tsx            # Calendar page (Server Component)
src/components/mobile/CallHistoryMobile.tsx # Call list UI (Client Component)
src/components/mobile/CalendarMobile.tsx    # Calendar UI (Client Component)
src/components/mobile/CallCard.tsx          # Individual call card
src/components/mobile/CallDetailModal.tsx   # Call transcript modal
src/components/mobile/CalendarEventCard.tsx # Calendar event card
```

### Files to MODIFY
None - this is net new functionality

---

## DATABASE SCHEMA REFERENCE

### `call_logs` table
```sql
CREATE TABLE call_logs (
  id UUID PRIMARY KEY,
  subscriber_id UUID,
  phone_number_id UUID,

  vapi_call_id TEXT NOT NULL UNIQUE,
  twilio_call_sid TEXT,

  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,

  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  duration_minutes DECIMAL(10,2),

  status TEXT CHECK (status IN ('queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer')),
  end_reason TEXT,

  transcript TEXT,
  summary TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  metadata JSONB,
  created_at TIMESTAMPTZ
)
```

### Email Connections (for calendar OAuth)
```sql
CREATE TABLE email_connections (
  id UUID PRIMARY KEY,
  subscriber_id UUID,
  provider TEXT CHECK (provider IN ('gmail', 'outlook')),
  email_address TEXT NOT NULL,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
)
```

---

## PART A: CALL HISTORY INTERFACE

### 1. Page Route: `src/app/m/calls/[id]/page.tsx`

**Purpose**: Server Component that fetches call logs and renders mobile interface

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { CallHistoryMobile } from '@/components/mobile/CallHistoryMobile'
import { notFound } from 'next/navigation'

export default async function MobileCallsPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = createServiceClient()

  // Fetch calls from last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: calls, error } = await supabase
    .from('call_logs')
    .select('*')
    .eq('subscriber_id', params.id)
    .gte('started_at', sevenDaysAgo.toISOString())
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching calls:', error)
  }

  // Get subscriber info
  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('name, business_name, vapi_phone_number')
    .eq('id', params.id)
    .single()

  return (
    <CallHistoryMobile
      calls={calls || []}
      subscriberId={params.id}
      businessName={subscriber?.business_name || 'Your Business'}
      businessNumber={subscriber?.vapi_phone_number}
    />
  )
}

export const metadata = {
  title: 'Call History - AgentOS',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}
```

---

### 2. Main Component: `src/components/mobile/CallHistoryMobile.tsx`

**Props Interface**:
```typescript
interface CallHistoryMobileProps {
  calls: CallLog[]
  subscriberId: string
  businessName: string
  businessNumber?: string
}

interface CallLog {
  id: string
  vapi_call_id: string
  direction: 'inbound' | 'outbound'
  from_number: string
  to_number: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  duration_minutes: number | null
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer'
  transcript: string | null
  summary: string | null
  sentiment: 'positive' | 'neutral' | 'negative' | null
  metadata: any
}
```

**State Management**:
```typescript
const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)
const [filter, setFilter] = useState<'all' | 'missed' | 'completed'>('all')
const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('week')
```

**Layout Structure**:
```tsx
<div className="flex flex-col h-screen bg-gray-50">
  {/* Header */}
  <div className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10">
    <h1 className="text-xl font-bold">📞 Call History</h1>
    <p className="text-sm opacity-90">{businessName}</p>
    {businessNumber && (
      <p className="text-xs opacity-75 mt-1">{formatPhoneNumber(businessNumber)}</p>
    )}
  </div>

  {/* Stats Bar */}
  <div className="bg-white border-b p-4">
    <div className="flex gap-4">
      <StatCard label="Total Calls" value={calls.length} />
      <StatCard label="Missed" value={missedCount} color="red" />
      <StatCard label="Avg Duration" value={avgDuration} />
    </div>
  </div>

  {/* Filters */}
  <div className="bg-white border-b p-3 flex gap-2 overflow-x-auto">
    <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
    <FilterChip active={filter === 'missed'} onClick={() => setFilter('missed')} label="Missed" color="red" />
    <FilterChip active={filter === 'completed'} onClick={() => setFilter('completed')} label="Completed" color="green" />
  </div>

  {/* Call List */}
  <div className="flex-1 overflow-y-auto">
    {groupedCalls.map(group => (
      <div key={group.date}>
        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 sticky top-0">
          {group.dateLabel}
        </div>
        {group.calls.map(call => (
          <CallCard
            key={call.id}
            call={call}
            onClick={() => setSelectedCall(call)}
          />
        ))}
      </div>
    ))}
  </div>

  {/* Call Detail Modal */}
  {selectedCall && (
    <CallDetailModal
      call={selectedCall}
      onClose={() => setSelectedCall(null)}
    />
  )}
</div>
```

**Call Grouping Logic**:
```typescript
function groupCallsByDate(calls: CallLog[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groups: { date: string; dateLabel: string; calls: CallLog[] }[] = []
  const grouped = new Map<string, CallLog[]>()

  calls.forEach(call => {
    const callDate = new Date(call.started_at)
    callDate.setHours(0, 0, 0, 0)

    let label: string
    if (callDate.getTime() === today.getTime()) {
      label = 'Today'
    } else if (callDate.getTime() === yesterday.getTime()) {
      label = 'Yesterday'
    } else {
      label = callDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      })
    }

    const key = callDate.toISOString()
    if (!grouped.has(key)) {
      grouped.set(key, [])
      groups.push({ date: key, dateLabel: label, calls: [] })
    }
    grouped.get(key)!.push(call)
  })

  // Fill in calls
  groups.forEach(group => {
    group.calls = grouped.get(group.date) || []
  })

  return groups
}
```

---

### 3. Call Card: `src/components/mobile/CallCard.tsx`

**Props**:
```typescript
interface CallCardProps {
  call: CallLog
  onClick: () => void
}
```

**Design**:
```tsx
<div
  onClick={onClick}
  className="bg-white border-b p-4 active:bg-gray-50 cursor-pointer"
>
  <div className="flex items-start gap-3">
    {/* Call direction icon */}
    <div className={`
      flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
      ${call.direction === 'inbound'
        ? 'bg-blue-100 text-blue-600'
        : 'bg-green-100 text-green-600'}
    `}>
      {call.direction === 'inbound' ? '📥' : '📤'}
    </div>

    <div className="flex-1 min-w-0">
      {/* Phone number / name */}
      <div className="text-base font-semibold text-gray-900">
        {formatPhoneNumber(
          call.direction === 'inbound' ? call.from_number : call.to_number
        )}
      </div>

      {/* Status & Duration */}
      <div className="flex items-center gap-2 mt-1">
        <StatusBadge status={call.status} />
        {call.duration_seconds && call.duration_seconds > 0 && (
          <span className="text-sm text-gray-600">
            {formatDuration(call.duration_seconds)}
          </span>
        )}
      </div>

      {/* Summary (if available) */}
      {call.summary && (
        <div className="text-sm text-gray-600 mt-2 line-clamp-2">
          {call.summary}
        </div>
      )}

      {/* Sentiment indicator */}
      {call.sentiment && (
        <div className="mt-2">
          <SentimentBadge sentiment={call.sentiment} />
        </div>
      )}
    </div>

    {/* Time */}
    <div className="flex-shrink-0 text-right">
      <div className="text-xs text-gray-500">
        {formatTime(call.started_at)}
      </div>
      {call.transcript && (
        <div className="text-xs text-blue-600 mt-1">
          View transcript →
        </div>
      )}
    </div>
  </div>
</div>
```

**Helper Components**:
```tsx
function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { label: 'Completed', color: 'green' },
    'no-answer': { label: 'Missed', color: 'red' },
    failed: { label: 'Failed', color: 'red' },
    busy: { label: 'Busy', color: 'yellow' },
    'in-progress': { label: 'In Progress', color: 'blue' }
  }

  const { label, color } = config[status] || { label: status, color: 'gray' }

  return (
    <span className={`
      inline-block px-2 py-0.5 text-xs rounded-full
      bg-${color}-100 text-${color}-800
    `}>
      {label}
    </span>
  )
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const config = {
    positive: { emoji: '😊', label: 'Positive', color: 'green' },
    neutral: { emoji: '😐', label: 'Neutral', color: 'gray' },
    negative: { emoji: '😟', label: 'Negative', color: 'red' }
  }

  const { emoji, label, color } = config[sentiment] || config.neutral

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full
      bg-${color}-100 text-${color}-800
    `}>
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  )
}
```

---

### 4. Call Detail Modal: `src/components/mobile/CallDetailModal.tsx`

**Purpose**: Full-screen modal showing transcript and call details

```tsx
<div className="fixed inset-0 bg-white z-50 overflow-y-auto">
  {/* Header */}
  <div className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10 flex items-center justify-between">
    <button onClick={onClose} className="text-2xl">←</button>
    <h2 className="text-lg font-semibold">Call Details</h2>
    <div className="w-8" />
  </div>

  {/* Call Info */}
  <div className="p-4">
    {/* Direction & Number */}
    <div className="flex items-center gap-3 mb-4">
      <div className={`
        w-12 h-12 rounded-full flex items-center justify-center text-2xl
        ${call.direction === 'inbound'
          ? 'bg-blue-100 text-blue-600'
          : 'bg-green-100 text-green-600'}
      `}>
        {call.direction === 'inbound' ? '📥' : '📤'}
      </div>
      <div>
        <div className="text-sm text-gray-500">
          {call.direction === 'inbound' ? 'Inbound Call' : 'Outbound Call'}
        </div>
        <div className="text-xl font-semibold">
          {formatPhoneNumber(
            call.direction === 'inbound' ? call.from_number : call.to_number
          )}
        </div>
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 gap-3 mb-6">
      <InfoCard label="Duration" value={formatDuration(call.duration_seconds)} />
      <InfoCard label="Status" value={<StatusBadge status={call.status} />} />
      <InfoCard label="Started" value={formatDateTime(call.started_at)} />
      <InfoCard label="Ended" value={call.ended_at ? formatDateTime(call.ended_at) : 'N/A'} />
    </div>

    {/* Sentiment */}
    {call.sentiment && (
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase mb-2">Call Sentiment</div>
        <SentimentBadge sentiment={call.sentiment} />
      </div>
    )}

    {/* Summary */}
    {call.summary && (
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase mb-2">AI Summary</div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          {call.summary}
        </div>
      </div>
    )}

    {/* Transcript */}
    {call.transcript ? (
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase mb-2">Full Transcript</div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {call.transcript}
        </div>
      </div>
    ) : (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        ⚠️ Transcript not available for this call
      </div>
    )}
  </div>

  {/* Actions */}
  <div className="sticky bottom-0 bg-white border-t p-4 space-y-2">
    <button
      onClick={() => window.location.href = `tel:${call.direction === 'inbound' ? call.from_number : call.to_number}`}
      className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold"
    >
      📞 Call Back
    </button>
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

## PART B: CALENDAR INTERFACE

### 1. Page Route: `src/app/m/calendar/[id]/page.tsx`

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { CalendarMobile } from '@/components/mobile/CalendarMobile'
import { getMicrosoftCalendarEvents, decryptToken } from '@/lib/email/microsoft'

export default async function MobileCalendarPage({
  params,
  searchParams
}: {
  params: { id: string }
  searchParams: { view?: 'today' | 'week' | 'month' }
}) {
  const supabase = createServiceClient()
  const view = searchParams.view || 'week'

  // Get email connection
  const { data: connection } = await supabase
    .from('email_connections')
    .select('*')
    .eq('subscriber_id', params.id)
    .eq('status', 'active')
    .single()

  let events = []
  let error = null

  if (connection && connection.provider === 'outlook') {
    try {
      // Decrypt access token
      const accessToken = decryptToken(connection.encrypted_access_token)

      // Fetch events based on view
      const startDate = new Date()
      const endDate = new Date()

      if (view === 'today') {
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
      } else if (view === 'week') {
        endDate.setDate(endDate.getDate() + 7)
      } else {
        endDate.setMonth(endDate.getMonth() + 1)
      }

      events = await getMicrosoftCalendarEvents(accessToken, startDate, endDate)
    } catch (err) {
      console.error('Error fetching calendar:', err)
      error = 'Failed to load calendar events'
    }
  }

  return (
    <CalendarMobile
      events={events}
      subscriberId={params.id}
      view={view}
      connected={!!connection}
      error={error}
    />
  )
}
```

---

### 2. Main Component: `src/components/mobile/CalendarMobile.tsx`

**Props**:
```typescript
interface CalendarMobileProps {
  events: CalendarEvent[]
  subscriberId: string
  view: 'today' | 'week' | 'month'
  connected: boolean
  error: string | null
}

interface CalendarEvent {
  id: string
  subject: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: {
    displayName: string
  }
  attendees?: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  isAllDay: boolean
  bodyPreview?: string
}
```

**Layout**:
```tsx
<div className="flex flex-col h-screen bg-gray-50">
  {/* Header */}
  <div className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10">
    <h1 className="text-xl font-bold">📅 Calendar</h1>
    <p className="text-sm opacity-90">{getViewLabel(view)}</p>
  </div>

  {/* Not Connected State */}
  {!connected && (
    <div className="p-6 text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-xl font-bold mb-2">Calendar Not Connected</h2>
      <p className="text-gray-600 mb-4">
        Connect your Outlook or Gmail calendar to see your events
      </p>
      <button className="bg-[#1B3A7D] text-white px-6 py-3 rounded-lg font-semibold">
        Connect Calendar
      </button>
    </div>
  )}

  {/* View Selector */}
  {connected && (
    <>
      <div className="bg-white border-b p-3 flex gap-2">
        <ViewToggle active={view === 'today'} href={`?view=today`} label="Today" />
        <ViewToggle active={view === 'week'} href={`?view=week`} label="Week" />
        <ViewToggle active={view === 'month'} href={`?view=month`} label="Month" />
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <EmptyState view={view} />
        ) : (
          groupEventsByDate(events).map(group => (
            <div key={group.date}>
              <div className="bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 sticky top-0">
                {group.dateLabel}
              </div>
              {group.events.map(event => (
                <CalendarEventCard key={event.id} event={event} />
              ))}
            </div>
          ))
        )}
      </div>
    </>
  )}
</div>
```

---

### 3. Calendar Event Card: `src/components/mobile/CalendarEventCard.tsx`

```tsx
<div className="bg-white border-b p-4">
  <div className="flex gap-3">
    {/* Time column */}
    <div className="flex-shrink-0 w-16 text-right">
      {event.isAllDay ? (
        <div className="text-xs text-gray-500">All Day</div>
      ) : (
        <>
          <div className="text-lg font-bold text-gray-900">
            {formatTime(event.start.dateTime)}
          </div>
          <div className="text-xs text-gray-500">
            {formatTime(event.end.dateTime)}
          </div>
        </>
      )}
    </div>

    {/* Event details */}
    <div className="flex-1 min-w-0">
      <div className="text-base font-semibold text-gray-900 mb-1">
        {event.subject}
      </div>

      {event.location?.displayName && (
        <div className="text-sm text-gray-600 flex items-center gap-1 mb-1">
          📍 {event.location.displayName}
        </div>
      )}

      {event.attendees && event.attendees.length > 0 && (
        <div className="text-sm text-gray-600">
          👥 {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
        </div>
      )}

      {event.bodyPreview && (
        <div className="text-sm text-gray-500 mt-2 line-clamp-2">
          {event.bodyPreview}
        </div>
      )}
    </div>
  </div>
</div>
```

---

## TESTING CHECKLIST

### Call History Tests
- [ ] Page loads with subscriber ID
- [ ] Shows all calls from last 7 days
- [ ] Groups calls by date correctly
- [ ] Missed calls filter works
- [ ] Completed calls filter works
- [ ] Click call opens detail modal
- [ ] Transcript displays correctly
- [ ] Call back button works
- [ ] Handles missing transcript gracefully
- [ ] Sentiment badges display correctly

### Calendar Tests
- [ ] Page loads with subscriber ID
- [ ] Shows "Not Connected" when no email connection
- [ ] Today view shows today's events
- [ ] Week view shows next 7 days
- [ ] Month view shows next 30 days
- [ ] All-day events display correctly
- [ ] Time formatting is correct
- [ ] Location displays when available
- [ ] Attendee count displays correctly
- [ ] Empty state shows when no events

---

## SUCCESS CRITERIA

1. **Call history is viewable and useful**
   - Shows last 7 days of calls
   - Transcripts are readable
   - Can call back with one tap

2. **Calendar is viewable and useful**
   - Shows upcoming events clearly
   - Time formatting is clear
   - Location and attendees visible

3. **Mobile experience is smooth**
   - Fast loading (< 2s)
   - Smooth scrolling
   - Large touch targets

---

## FILES SUMMARY

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/m/calls/[id]/page.tsx` | ~60 | Server Component - Fetch calls |
| `src/app/m/calendar/[id]/page.tsx` | ~80 | Server Component - Fetch events |
| `src/components/mobile/CallHistoryMobile.tsx` | ~180 | Call list UI |
| `src/components/mobile/CalendarMobile.tsx` | ~120 | Calendar UI |
| `src/components/mobile/CallCard.tsx` | ~80 | Call card |
| `src/components/mobile/CallDetailModal.tsx` | ~120 | Call details |
| `src/components/mobile/CalendarEventCard.tsx` | ~60 | Event card |

**Total**: ~700 lines of code
