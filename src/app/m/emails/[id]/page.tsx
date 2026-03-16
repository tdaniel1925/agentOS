/**
 * Mobile Email Inbox Page
 * Server Component that fetches email data and renders mobile interface
 * Route: /m/emails/[id] where id = subscriber_id
 */

import { createServiceClient } from '@/lib/supabase/server'
import { EmailInboxMobile } from '@/components/mobile/EmailInboxMobile'
import type { Metadata } from 'next'

// Add metadata for SEO and mobile optimization
export const metadata: Metadata = {
  title: 'Email Inbox - AgentOS',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MobileEmailsPage({
  params
}: PageProps) {
  const { id } = await params
  const supabase = createServiceClient()

  // Fetch latest email summary for this subscriber
  const { data: summary, error } = await supabase
    .from('email_summaries')
    .select('*')
    .eq('subscriber_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Handle no emails case
  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">No Emails Yet</h1>
          <p className="text-gray-600">Text Jordan "check email" to get started!</p>
        </div>
      </div>
    )
  }

  // Parse emails from JSONB - it's already an array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emails = Array.isArray((summary as any).emails_data) ? (summary as any).emails_data : []

  return (
    <EmailInboxMobile
      emails={emails}
      summary={summary}
      subscriberId={id}
    />
  )
}
