import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsageOverview } from '@/components/dashboard/UsageOverview'
import { UsageChart } from '@/components/dashboard/UsageChart'
import { UsageLimits } from '@/components/dashboard/UsageLimits'
import { UsageAlerts } from '@/components/dashboard/UsageAlerts'
import type { Database } from '@/lib/supabase/types'

type Subscriber = Database['public']['Tables']['subscribers']['Row']
type UsageData = Database['public']['Tables']['subscriber_usage']['Row']
type CallLog = Database['public']['Tables']['call_logs']['Row']
type SmsLog = Database['public']['Tables']['sms_logs']['Row']

export const dynamic = 'force-dynamic'

export default async function UsagePage() {
  const supabase = createServiceClient()

  // Get current user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Get subscriber
  const { data: subscriberData, error: subscriberError } = await supabase
    .from('subscribers')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()

  if (subscriberError || !subscriberData) {
    console.error('Usage page - subscriber error:', subscriberError)
    redirect('/onboard')
  }

  const subscriber = subscriberData as Subscriber

  // Get current billing period usage
  const { data: usageData } = await supabase
    .from('subscriber_usage')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .lte('billing_period_start', new Date().toISOString())
    .gte('billing_period_end', new Date().toISOString())
    .maybeSingle()

  const usage = usageData as UsageData | null

  // Get historical data (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: callHistoryData } = await supabase
    .from('call_logs')
    .select('started_at, duration_minutes')
    .eq('subscriber_id', subscriber.id)
    .gte('started_at', thirtyDaysAgo.toISOString())

  const { data: smsHistoryData } = await supabase
    .from('sms_logs')
    .select('created_at, direction')
    .eq('subscriber_id', subscriber.id)
    .gte('created_at', thirtyDaysAgo.toISOString())

  const callHistory = (callHistoryData || []) as Pick<CallLog, 'started_at' | 'duration_minutes'>[]
  const smsHistory = (smsHistoryData || []) as Pick<SmsLog, 'created_at' | 'direction'>[]

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
          callHistory={callHistory}
          smsHistory={smsHistory}
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

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
