# AGENT 5: USAGE DASHBOARD & VISUALIZATION
**Status**: Ready to Build
**Priority**: P2
**Estimated Time**: 3-4 hours
**Dependencies**: None (can run parallel)

---

## MISSION
Build dashboard page showing real-time usage (voice minutes, SMS), overage warnings, historical charts, and spending limits.

---

## SCOPE

### Files to CREATE
```
src/app/(dashboard)/usage/page.tsx         # Main usage dashboard page
src/components/dashboard/UsageOverview.tsx # Usage stats cards
src/components/dashboard/UsageChart.tsx    # Historical usage chart
src/components/dashboard/UsageLimits.tsx   # Spending limit settings
src/components/dashboard/UsageAlerts.tsx   # Alert settings
src/app/api/usage/route.ts                 # Usage data API
```

### Files to MODIFY
None - this is net new functionality

---

## DATABASE SCHEMA REFERENCE

### `subscriber_usage` table
```sql
CREATE TABLE subscriber_usage (
  id UUID PRIMARY KEY,
  subscriber_id UUID,

  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,

  -- Voice
  voice_minutes_included INTEGER DEFAULT 200,
  voice_minutes_used DECIMAL(10,2) DEFAULT 0,
  voice_minutes_remaining DECIMAL(10,2) DEFAULT 200,
  voice_overage_minutes DECIMAL(10,2) DEFAULT 0,

  -- SMS
  sms_messages_included INTEGER DEFAULT 500,
  sms_messages_used INTEGER DEFAULT 0,
  sms_messages_remaining INTEGER DEFAULT 500,
  sms_overage_count INTEGER DEFAULT 0,

  -- Charges
  monthly_base_fee DECIMAL(10,2) DEFAULT 97.00,
  voice_overage_charges DECIMAL(10,2) DEFAULT 0.00,
  sms_overage_charges DECIMAL(10,2) DEFAULT 0.00,
  total_charges DECIMAL(10,2) DEFAULT 97.00,

  -- Limits
  spending_limit DECIMAL(10,2) DEFAULT 500.00,
  alert_sent_50_percent BOOLEAN DEFAULT FALSE,
  alert_sent_80_percent BOOLEAN DEFAULT FALSE,
  alert_sent_100_percent BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### `call_logs` table (for historical data)
```sql
SELECT
  DATE(started_at) as call_date,
  COUNT(*) as call_count,
  SUM(duration_minutes) as total_minutes
FROM call_logs
WHERE subscriber_id = $1
  AND started_at >= $2
GROUP BY DATE(started_at)
ORDER BY call_date DESC
```

### `sms_logs` table (for historical data)
```sql
SELECT
  DATE(created_at) as sms_date,
  COUNT(*) as message_count
FROM sms_logs
WHERE subscriber_id = $1
  AND created_at >= $2
  AND direction = 'outbound'
GROUP BY DATE(created_at)
ORDER BY sms_date DESC
```

---

## COMPONENT SPECS

### 1. Main Page: `src/app/(dashboard)/usage/page.tsx`

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsageOverview } from '@/components/dashboard/UsageOverview'
import { UsageChart } from '@/components/dashboard/UsageChart'
import { UsageLimits } from '@/components/dashboard/UsageLimits'
import { UsageAlerts } from '@/components/dashboard/UsageAlerts'

export default async function UsagePage() {
  const supabase = createServiceClient()

  // Get current user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Get subscriber
  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .single()

  if (!subscriber) {
    redirect('/onboarding')
  }

  // Get current billing period usage
  const { data: usage } = await supabase
    .from('subscriber_usage')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .lte('billing_period_start', new Date().toISOString())
    .gte('billing_period_end', new Date().toISOString())
    .single()

  // Get historical data (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: callHistory } = await supabase
    .from('call_logs')
    .select('started_at, duration_minutes')
    .eq('subscriber_id', subscriber.id)
    .gte('started_at', thirtyDaysAgo.toISOString())

  const { data: smsHistory } = await supabase
    .from('sms_logs')
    .select('created_at, direction')
    .eq('subscriber_id', subscriber.id)
    .gte('created_at', thirtyDaysAgo.toISOString())

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usage & Billing</h1>
          <p className="text-gray-600 mt-1">
            Billing Period: {formatDate(usage?.billing_period_start)} - {formatDate(usage?.billing_period_end)}
          </p>
        </div>

        {/* Current Usage Overview */}
        <UsageOverview usage={usage} />

        {/* Historical Chart */}
        <UsageChart
          callHistory={callHistory || []}
          smsHistory={smsHistory || []}
        />

        {/* Spending Limits */}
        <UsageLimits
          currentLimit={usage?.spending_limit || 500}
          subscriberId={subscriber.id}
        />

        {/* Alert Settings */}
        <UsageAlerts subscriberId={subscriber.id} />
      </div>
    </div>
  )
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
```

---

### 2. Usage Overview: `src/components/dashboard/UsageOverview.tsx`

```typescript
'use client'

interface UsageOverviewProps {
  usage: {
    voice_minutes_included: number
    voice_minutes_used: number
    voice_minutes_remaining: number
    voice_overage_minutes: number
    sms_messages_included: number
    sms_messages_used: number
    sms_messages_remaining: number
    sms_overage_count: number
    monthly_base_fee: number
    voice_overage_charges: number
    sms_overage_charges: number
    total_charges: number
  } | null
}

export function UsageOverview({ usage }: UsageOverviewProps) {
  if (!usage) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No usage data available yet.</p>
      </div>
    )
  }

  const voicePercentUsed = (usage.voice_minutes_used / usage.voice_minutes_included) * 100
  const smsPercentUsed = (usage.sms_messages_used / usage.sms_messages_included) * 100

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Voice Minutes Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Voice Minutes</h3>
          <span className="text-3xl">📞</span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Used</span>
              <span className="font-semibold text-gray-900">
                {usage.voice_minutes_used.toFixed(0)} / {usage.voice_minutes_included}
              </span>
            </div>
            <ProgressBar percent={voicePercentUsed} />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining</span>
            <span className="font-semibold text-gray-900">
              {usage.voice_minutes_remaining.toFixed(0)} min
            </span>
          </div>

          {usage.voice_overage_minutes > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <span>⚠️</span>
                <div>
                  <div className="font-semibold">Overage: {usage.voice_overage_minutes.toFixed(0)} min</div>
                  <div className="text-xs">+${usage.voice_overage_charges.toFixed(2)} this month</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SMS Messages Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">SMS Messages</h3>
          <span className="text-3xl">💬</span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Used</span>
              <span className="font-semibold text-gray-900">
                {usage.sms_messages_used} / {usage.sms_messages_included}
              </span>
            </div>
            <ProgressBar percent={smsPercentUsed} />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining</span>
            <span className="font-semibold text-gray-900">
              {usage.sms_messages_remaining} messages
            </span>
          </div>

          {usage.sms_overage_count > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <span>⚠️</span>
                <div>
                  <div className="font-semibold">Overage: {usage.sms_overage_count} msgs</div>
                  <div className="text-xs">+${usage.sms_overage_charges.toFixed(2)} this month</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Total Charges Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Bill</h3>
          <span className="text-3xl">💳</span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Subscription</span>
            <span className="text-gray-900">${usage.monthly_base_fee.toFixed(2)}</span>
          </div>

          {usage.voice_overage_charges > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Voice Overage</span>
              <span className="text-red-600">+${usage.voice_overage_charges.toFixed(2)}</span>
            </div>
          )}

          {usage.sms_overage_charges > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">SMS Overage</span>
              <span className="text-red-600">+${usage.sms_overage_charges.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-[#1B3A7D]">
                ${usage.total_charges.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Charges on next billing date
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  const color =
    percent >= 100 ? 'bg-red-500' :
    percent >= 80 ? 'bg-yellow-500' :
    'bg-green-500'

  return (
    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  )
}
```

---

### 3. Usage Chart: `src/components/dashboard/UsageChart.tsx`

```typescript
'use client'

import { useMemo } from 'react'

interface UsageChartProps {
  callHistory: Array<{ started_at: string; duration_minutes: number }>
  smsHistory: Array<{ created_at: string; direction: string }>
}

export function UsageChart({ callHistory, smsHistory }: UsageChartProps) {
  // Group data by date
  const chartData = useMemo(() => {
    const last30Days = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]

      // Sum call minutes for this date
      const minutesThisDay = callHistory
        .filter(c => c.started_at.startsWith(dateString))
        .reduce((sum, c) => sum + (c.duration_minutes || 0), 0)

      // Count SMS for this date
      const smsThisDay = smsHistory.filter(s =>
        s.created_at.startsWith(dateString) && s.direction === 'outbound'
      ).length

      last30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: Math.round(minutesThisDay),
        sms: smsThisDay
      })
    }
    return last30Days
  }, [callHistory, smsHistory])

  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 10)
  const maxSms = Math.max(...chartData.map(d => d.sms), 10)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Usage History (Last 30 Days)</h2>

      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Voice Minutes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">SMS Sent</span>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-1">
        {chartData.map((day, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-16 text-xs text-gray-600 text-right">{day.date}</div>

            {/* Voice Bar */}
            <div className="flex-1">
              <div
                className="bg-blue-500 h-6 rounded transition-all"
                style={{ width: `${(day.minutes / maxMinutes) * 100}%` }}
                title={`${day.minutes} minutes`}
              >
                {day.minutes > 0 && (
                  <span className="text-xs text-white px-2 leading-6">{day.minutes}m</span>
                )}
              </div>
            </div>

            {/* SMS Bar */}
            <div className="flex-1">
              <div
                className="bg-green-500 h-6 rounded transition-all"
                style={{ width: `${(day.sms / maxSms) * 100}%` }}
                title={`${day.sms} messages`}
              >
                {day.sms > 0 && (
                  <span className="text-xs text-white px-2 leading-6">{day.sms} SMS</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### 4. Spending Limits: `src/components/dashboard/UsageLimits.tsx`

```typescript
'use client'

import { useState } from 'react'

interface UsageLimitsProps {
  currentLimit: number
  subscriberId: string
}

export function UsageLimits({ currentLimit, subscriberId }: UsageLimitsProps) {
  const [limit, setLimit] = useState(currentLimit)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    setIsSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/usage/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriberId, spendingLimit: limit })
      })

      if (!res.ok) {
        throw new Error('Failed to update limit')
      }

      setMessage('✅ Spending limit updated')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to update limit')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Spending Limits</h2>

      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monthly Spending Limit
        </label>

        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                min={97}
                max={10000}
                step={50}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: $97 (base subscription)
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || limit === currentLimit}
            className="px-6 py-2 bg-[#1B3A7D] text-white rounded-lg font-semibold disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {message && (
          <div className="mt-3 text-sm">{message}</div>
        )}

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          💡 Services will pause automatically if you reach this limit to prevent unexpected charges.
        </div>
      </div>
    </div>
  )
}
```

---

## API ENDPOINT

### File: `src/app/api/usage/limits/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { subscriberId, spendingLimit } = await req.json()

    if (!subscriberId || !spendingLimit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (spendingLimit < 97) {
      return NextResponse.json(
        { error: 'Spending limit cannot be less than $97' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Update current billing period
    const { error } = await supabase
      .from('subscriber_usage')
      .update({ spending_limit: spendingLimit })
      .eq('subscriber_id', subscriberId)
      .lte('billing_period_start', new Date().toISOString())
      .gte('billing_period_end', new Date().toISOString())

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update limits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## TESTING CHECKLIST

- [ ] Page loads with current usage data
- [ ] Voice minutes display correctly
- [ ] SMS usage displays correctly
- [ ] Overage warnings show when > 100%
- [ ] Progress bars animate smoothly
- [ ] Chart shows last 30 days
- [ ] Chart handles days with zero usage
- [ ] Spending limit can be updated
- [ ] Limit cannot be set below $97
- [ ] Success/error messages display

---

## SUCCESS CRITERIA

1. Real-time usage is visible
2. Historical trends are clear
3. Overage warnings are prominent
4. Spending limits are adjustable

---

## FILES SUMMARY

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/(dashboard)/usage/page.tsx` | ~100 | Main usage page |
| `src/components/dashboard/UsageOverview.tsx` | ~200 | Usage cards |
| `src/components/dashboard/UsageChart.tsx` | ~120 | Historical chart |
| `src/components/dashboard/UsageLimits.tsx` | ~100 | Limit settings |
| `src/app/api/usage/limits/route.ts` | ~50 | Update API |

**Total**: ~570 lines of code
