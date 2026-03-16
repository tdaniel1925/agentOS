# AGENT 4: SMS LINK INTEGRATION
**Status**: Ready to Build
**Priority**: P1 (Enables web flow)
**Estimated Time**: 2-3 hours
**Dependencies**: Mobile pages from Agents 1 & 2

---

## MISSION
Modify existing SMS skills to truncate responses and add mobile web links instead of cramming full data into SMS.

---

## SCOPE

### Files to MODIFY
```
src/lib/skills/email-check.ts       # Add link to email inbox
src/lib/skills/call-check.ts        # Add link to call history (CREATE THIS)
src/lib/skills/calendar-check.ts    # Add link to calendar (CREATE THIS)
```

### Files to CREATE
```
src/lib/skills/call-check.ts        # Check missed calls skill
src/lib/skills/calendar-check.ts    # Check calendar skill
src/app/api/skills/email-check/route.ts  # API endpoint for refresh
```

---

## PATTERN: SMS + Web Link

**Before** (cramming into SMS):
```
📧 Inbox (last 24hrs):
🔴 2 urgent:
- John Smith: "URGENT: Need proposal ASAP"
- Jane Doe: "Problem with invoice #1234"
👤 5 client emails:
- Bob Client: "Quick question about..."
- Alice Corp: "Following up on..."
...
```
**Problem**: Hits 1600 char limit, hard to read, no actions possible

**After** (progressive disclosure):
```
📧 Inbox (last 24hrs):
🔴 2 urgent
👤 5 client emails
🎯 1 lead

View all: https://theapexbots.com/m/emails/uuid
```
**Benefit**: Short, actionable, full details on web

---

## 1. EMAIL CHECK MODIFICATION

### File: `src/lib/skills/email-check.ts`

**Current Code** (lines 129-159):
```typescript
function buildEmailSummary(categories: EmailCategory): string {
  const total =
    categories.urgent + categories.client + categories.lead + categories.admin

  if (total === 0) {
    return 'Inbox summary (last 24hrs):\nAll clear! No new emails.'
  }

  let summary = 'Inbox summary (last 24hrs):\n'

  if (categories.urgent > 0) {
    summary += `🔴 ${categories.urgent} urgent (reply URGENT to see)\n`
  }
  if (categories.client > 0) {
    summary += `👤 ${categories.client} client emails\n`
  }
  if (categories.lead > 0) {
    summary += `🎯 ${categories.lead} potential lead${categories.lead > 1 ? 's' : ''}\n`
  }
  if (categories.admin > 0) {
    summary += `📋 ${categories.admin} admin emails\n`
  }

  summary += '\nWant me to draft replies to any?'

  return summary
}
```

**NEW Code**:
```typescript
function buildEmailSummary(
  categories: EmailCategory,
  subscriberId: string
): string {
  const total =
    categories.urgent + categories.client + categories.lead + categories.admin

  if (total === 0) {
    return '📧 Inbox (last 24hrs):\nAll clear! No new emails.'
  }

  let summary = '📧 Inbox (last 24hrs):\n'

  if (categories.urgent > 0) {
    summary += `🔴 ${categories.urgent} urgent\n`
  }
  if (categories.client > 0) {
    summary += `👤 ${categories.client} client emails\n`
  }
  if (categories.lead > 0) {
    summary += `🎯 ${categories.lead} lead${categories.lead > 1 ? 's' : ''}\n`
  }

  // Add mobile web link
  const webUrl = `${process.env.NEXT_PUBLIC_APP_URL}/m/emails/${subscriberId}`
  summary += `\nView all: ${webUrl}`

  return summary
}
```

**Update Function Call** (line 129):
```typescript
// OLD:
const summary = buildEmailSummary(categories)

// NEW:
const summary = buildEmailSummary(categories, params.subscriber.id)
```

**Store Full Email Data** (after line 144):
```typescript
// Step 4: Store summary in database
await (supabase as any).from('email_summaries').insert({
  subscriber_id: params.subscriber.id,
  summary_date: new Date().toISOString().split('T')[0],
  total_unread: categories.urgent + categories.client + categories.lead + categories.admin,
  urgent_count: categories.urgent,
  client_count: categories.client,
  lead_count: categories.lead,
  admin_count: categories.admin,
  summary_text: summary,
  emails_data: emails,  // ADD THIS LINE - Store full email objects
  created_at: new Date().toISOString(),
})
```

---

## 2. CALL CHECK SKILL (NEW)

### File: `src/lib/skills/call-check.ts`

```typescript
/**
 * Call Check Skill
 * Checks missed calls and provides mobile link to full history
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'

interface CheckCallsParams {
  subscriber: any
}

interface CheckResult {
  success: boolean
  message: string
}

/**
 * Check missed calls (async operation)
 */
export async function checkCalls(params: CheckCallsParams): Promise<CheckResult> {
  const { subscriber } = params
  const supabase = createServiceClient()

  try {
    // Send immediate acknowledgment
    await sendSMS({
      to: subscriber.control_phone,
      body: "Checking your call history... I'll text you in a moment.",
    })

    // Process async
    processCallCheck({ subscriber }).catch(console.error)

    return {
      success: true,
      message: 'Processing started',
    }
  } catch (error) {
    console.error('❌ [Call Check] Error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: `I ran into an issue: ${errorMsg}`,
    }
  }
}

/**
 * Process call check (async background task)
 */
async function processCallCheck(params: { subscriber: any }): Promise<void> {
  const supabase = createServiceClient()

  try {
    // Fetch calls from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const { data: calls } = await supabase
      .from('call_logs')
      .select('*')
      .eq('subscriber_id', params.subscriber.id)
      .gte('started_at', yesterday.toISOString())
      .order('started_at', { ascending: false })

    const allCalls = calls || []
    const missedCalls = allCalls.filter(
      (c: any) => c.status === 'no-answer' || c.status === 'busy'
    )
    const completedCalls = allCalls.filter((c: any) => c.status === 'completed')

    // Build SMS summary
    const summary = buildCallSummary(
      allCalls.length,
      missedCalls.length,
      completedCalls.length,
      params.subscriber.id
    )

    // Send SMS
    await sendSMS({
      to: params.subscriber.control_phone,
      body: summary,
    })

    // Log command
    await supabase.from('commands_log').insert({
      subscriber_id: params.subscriber.id,
      channel: 'sms',
      sender_identifier: params.subscriber.control_phone,
      intent: 'CHECK_CALLS',
      raw_message: 'Check calls',
      executed: true,
      response_sent: true,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ [Call Check Process] Error:', error)
    throw error
  }
}

/**
 * Build call summary message
 */
function buildCallSummary(
  total: number,
  missed: number,
  completed: number,
  subscriberId: string
): string {
  if (total === 0) {
    return '📞 Calls (last 24hrs):\nNo calls yet.'
  }

  let summary = '📞 Calls (last 24hrs):\n'

  if (missed > 0) {
    summary += `🔴 ${missed} missed call${missed > 1 ? 's' : ''}\n`
  }

  summary += `✅ ${completed} completed\n`

  // Add mobile web link
  const webUrl = `${process.env.NEXT_PUBLIC_APP_URL}/m/calls/${subscriberId}`
  summary += `\nView all: ${webUrl}`

  return summary
}
```

---

## 3. CALENDAR CHECK SKILL (NEW)

### File: `src/lib/skills/calendar-check.ts`

```typescript
/**
 * Calendar Check Skill
 * Checks upcoming calendar events and provides mobile link
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'
import { getMicrosoftCalendarEvents, getTodayCalendarEvents, decryptToken } from '@/lib/email/microsoft'

interface CheckCalendarParams {
  subscriber: any
  timeframe?: 'today' | 'week'
}

interface CheckResult {
  success: boolean
  message: string
}

/**
 * Check calendar (async operation)
 */
export async function checkCalendar(params: CheckCalendarParams): Promise<CheckResult> {
  const { subscriber } = params
  const supabase = createServiceClient()

  try {
    // Check if calendar connected
    const { data: connection } = await supabase
      .from('email_connections')
      .select('*')
      .eq('subscriber_id', subscriber.id)
      .eq('status', 'active')
      .single()

    if (!connection) {
      return {
        success: false,
        message: "Your calendar isn't connected yet. Reply CONNECT CALENDAR to set it up.",
      }
    }

    // Send acknowledgment
    await sendSMS({
      to: subscriber.control_phone,
      body: "Checking your calendar... I'll text you in a moment.",
    })

    // Process async
    processCalendarCheck({ subscriber, connection, timeframe: params.timeframe || 'today' }).catch(console.error)

    return {
      success: true,
      message: 'Processing started',
    }
  } catch (error) {
    console.error('❌ [Calendar Check] Error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: `I ran into an issue: ${errorMsg}`,
    }
  }
}

/**
 * Process calendar check (async background task)
 */
async function processCalendarCheck(params: {
  subscriber: any
  connection: any
  timeframe: 'today' | 'week'
}): Promise<void> {
  const supabase = createServiceClient()

  try {
    // Decrypt access token
    const accessToken = decryptToken(params.connection.encrypted_access_token)

    // Fetch events
    let events
    if (params.timeframe === 'today') {
      events = await getTodayCalendarEvents(accessToken)
    } else {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)
      events = await getMicrosoftCalendarEvents(accessToken, startDate, endDate)
    }

    // Build summary
    const summary = buildCalendarSummary(
      events,
      params.timeframe,
      params.subscriber.id
    )

    // Send SMS
    await sendSMS({
      to: params.subscriber.control_phone,
      body: summary,
    })

    // Log command
    await supabase.from('commands_log').insert({
      subscriber_id: params.subscriber.id,
      channel: 'sms',
      sender_identifier: params.subscriber.control_phone,
      intent: 'CHECK_CALENDAR',
      raw_message: `Check calendar ${params.timeframe}`,
      executed: true,
      response_sent: true,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ [Calendar Check Process] Error:', error)
    throw error
  }
}

/**
 * Build calendar summary message
 */
function buildCalendarSummary(
  events: any[],
  timeframe: string,
  subscriberId: string
): string {
  if (events.length === 0) {
    return `📅 ${timeframe === 'today' ? 'Today' : 'This week'}:\nNo events scheduled.`
  }

  let summary = `📅 ${timeframe === 'today' ? 'Today' : 'This week'}:\n`
  summary += `${events.length} event${events.length > 1 ? 's' : ''} scheduled\n`

  // Show next 2 events
  const nextTwo = events.slice(0, 2)
  nextTwo.forEach((event: any) => {
    const time = new Date(event.start.dateTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
    summary += `• ${time} - ${event.subject}\n`
  })

  if (events.length > 2) {
    summary += `...and ${events.length - 2} more\n`
  }

  // Add mobile web link
  const webUrl = `${process.env.NEXT_PUBLIC_APP_URL}/m/calendar/${subscriberId}?view=${timeframe === 'today' ? 'today' : 'week'}`
  summary += `\nView all: ${webUrl}`

  return summary
}
```

---

## 4. UPDATE SMS PARSER

### File: `src/lib/skills/sms-parser.ts`

**Add new intent patterns**:
```typescript
async function parseIntent(message: string, subscriber: any) {
  const lower = message.toLowerCase()

  // Email
  if (lower.includes('email') || lower.includes('inbox')) {
    return { name: 'CHECK_EMAIL' }
  }

  // Calls - ADD THIS
  if (lower.includes('call') || lower.includes('missed')) {
    return { name: 'CHECK_CALLS' }
  }

  // Calendar - ADD THIS
  if (lower.includes('calendar') || lower.includes('appointment') || lower.includes('meeting')) {
    return { name: 'CHECK_CALENDAR', params: { timeframe: lower.includes('today') ? 'today' : 'week' } }
  }

  // ... rest of parsing logic
}
```

---

## 5. UPDATE SKILL EXECUTOR

### File: `src/lib/skills/executor.ts`

**Add new skill handlers**:
```typescript
import { checkEmail } from './email-check'
import { checkCalls } from './call-check'  // ADD
import { checkCalendar } from './calendar-check'  // ADD

export async function executeSkill(intent: any, subscriber: any) {
  switch (intent.name) {
    case 'CHECK_EMAIL':
      return await checkEmail({ subscriber })

    case 'CHECK_CALLS':  // ADD
      return await checkCalls({ subscriber })

    case 'CHECK_CALENDAR':  // ADD
      return await checkCalendar({
        subscriber,
        timeframe: intent.params?.timeframe || 'today'
      })

    // ... other skills
  }
}
```

---

## 6. CREATE REFRESH API ENDPOINT

### File: `src/app/api/skills/email-check/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkEmail } from '@/lib/skills/email-check'

export async function POST(req: NextRequest) {
  try {
    const { subscriberId } = await req.json()

    if (!subscriberId) {
      return NextResponse.json(
        { error: 'subscriberId required' },
        { status: 400 }
      )
    }

    // Get subscriber
    const supabase = createServiceClient()
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single()

    if (error || !subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // Trigger email check
    await checkEmail({ subscriber })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email check API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## TESTING CHECKLIST

### Email Check
- [ ] SMS includes mobile link
- [ ] Link format: https://theapexbots.com/m/emails/[id]
- [ ] Link opens in mobile browser
- [ ] Full email data stored in emails_data field
- [ ] Summary is under 160 characters

### Call Check
- [ ] User can text "check calls"
- [ ] Shows missed vs completed counts
- [ ] Includes mobile link
- [ ] Link opens to call history page

### Calendar Check
- [ ] User can text "check calendar"
- [ ] Shows next 2 events
- [ ] Includes mobile link
- [ ] "Today" vs "week" parameter works

### Refresh Buttons
- [ ] Refresh button on mobile pages works
- [ ] Calls /api/skills/email-check
- [ ] Page reloads with new data

---

## SUCCESS CRITERIA

1. SMS responses are short (< 200 chars)
2. Mobile links work on all devices
3. Full data accessible via web
4. Refresh works without SMS

---

## FILES SUMMARY

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/skills/email-check.ts` | +15 | Add link, store full data |
| `src/lib/skills/call-check.ts` | ~150 | NEW - Check calls skill |
| `src/lib/skills/calendar-check.ts` | ~180 | NEW - Check calendar skill |
| `src/lib/skills/sms-parser.ts` | +10 | Add new intents |
| `src/lib/skills/executor.ts` | +10 | Add new handlers |
| `src/app/api/skills/email-check/route.ts` | ~50 | NEW - Refresh API |

**Total**: ~415 lines new/modified
