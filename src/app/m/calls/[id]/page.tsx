/**
 * Mobile Call History Page
 * Server Component that fetches call logs and renders mobile interface
 */

import { createServiceClient } from '@/lib/supabase/server'
import { CallHistoryMobile } from '@/components/mobile/CallHistoryMobile'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Call History - AgentOS',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

interface PageProps {
  params: {
    id: string
  }
}

export default async function MobileCallsPage({ params }: PageProps) {
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

  if (!subscriber) {
    notFound()
  }

  return (
    <CallHistoryMobile
      calls={calls || []}
      subscriberId={params.id}
      businessName={(subscriber as any)?.business_name || 'Your Business'}
      businessNumber={(subscriber as any)?.vapi_phone_number}
    />
  )
}
