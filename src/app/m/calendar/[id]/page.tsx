/**
 * Mobile Calendar Page
 * Server Component that fetches calendar events and renders mobile interface
 */

import { createServiceClient } from '@/lib/supabase/server'
import { CalendarMobile } from '@/components/mobile/CalendarMobile'
import { getMicrosoftCalendarEvents, decryptToken } from '@/lib/email/microsoft'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calendar - AgentOS',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

interface PageProps {
  params: {
    id: string
  }
  searchParams: {
    view?: 'today' | 'week' | 'month'
  }
}

export default async function MobileCalendarPage({ params, searchParams }: PageProps) {
  const supabase = createServiceClient()
  const view = searchParams.view || 'week'

  // Get email connection
  const { data: connection } = await supabase
    .from('email_connections')
    .select('*')
    .eq('subscriber_id', params.id)
    .eq('status', 'active')
    .single()

  let events: any[] = []
  let error: string | null = null

  if (connection && (connection as any).provider === 'outlook') {
    try {
      // Decrypt access token
      const accessToken = decryptToken((connection as any).encrypted_access_token)

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
