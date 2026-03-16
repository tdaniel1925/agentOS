/**
 * Email Draft Editor Page
 * Mobile-friendly page for reviewing and sending email drafts
 */

import { createServiceClient } from '@/lib/supabase/server'
import { EmailDraftEditor } from '@/components/mobile/EmailDraftEditor'
import { notFound, redirect } from 'next/navigation'

interface DraftPageProps {
  params: {
    id: string
  }
}

export default async function DraftEditorPage({ params }: DraftPageProps) {
  const supabase = createServiceClient()

  try {
    // Get draft
    const { data: draft, error } = await (supabase as any)
      .from('email_drafts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !draft) {
      console.error('[Draft Page] Draft not found:', error)
      return notFound()
    }

    // Check if draft is expired
    const expiresAt = new Date(draft.expires_at)
    const now = new Date()

    if (now > expiresAt) {
      console.warn('[Draft Page] Draft expired:', params.id)
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
            <div className="text-4xl mb-4">⏰</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Draft Expired</h1>
            <p className="text-gray-600 mb-4">
              This draft has expired. Drafts are only kept for 24 hours.
            </p>
            <a
              href={`/m/emails/${draft.subscriber_id}`}
              className="inline-block bg-[#1B3A7D] text-white px-6 py-3 rounded-lg font-semibold"
            >
              Back to Inbox
            </a>
          </div>
        </div>
      )
    }

    // Check if already sent
    if (draft.status === 'sent') {
      console.log('[Draft Page] Draft already sent:', params.id)
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Already Sent</h1>
            <p className="text-gray-600 mb-4">
              This email has already been sent to {draft.to_address}
            </p>
            <a
              href={`/m/emails/${draft.subscriber_id}`}
              className="inline-block bg-[#1B3A7D] text-white px-6 py-3 rounded-lg font-semibold"
            >
              Back to Inbox
            </a>
          </div>
        </div>
      )
    }

    return <EmailDraftEditor draft={draft} />
  } catch (error) {
    console.error('[Draft Page] Error:', error)
    return notFound()
  }
}
