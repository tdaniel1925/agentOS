'use client'

/**
 * EmailDraftEditor Component
 * Mobile-friendly email draft editor for reviewing and sending email drafts
 * Used for both replies and new emails
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EmailDraft {
  id: string
  subscriber_id: string
  to_address: string
  subject: string
  body_text: string
  original_email_data?: {
    from?: {
      emailAddress?: {
        name?: string
        address?: string
      }
    }
    subject?: string
    bodyPreview?: string
    receivedDateTime?: string
  }
  status: string
  created_at: string
}

interface EmailDraftEditorProps {
  draft: EmailDraft
}

export function EmailDraftEditor({ draft }: EmailDraftEditorProps) {
  const router = useRouter()
  const [body, setBody] = useState(draft.body_text)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    setIsSending(true)
    setError('')

    try {
      // Update draft body if changed
      if (body !== draft.body_text) {
        const updateRes = await fetch(`/api/email/draft/${draft.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body_text: body }),
        })

        if (!updateRes.ok) {
          const updateError = await updateRes.json()
          throw new Error(updateError.message || 'Failed to update draft')
        }
      }

      // Send email
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: draft.id,
          subscriberId: draft.subscriber_id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send email')
      }

      // Success! Show confirmation and redirect
      alert('✅ Email sent!')
      router.push(`/m/emails/${draft.subscriber_id}`)
    } catch (err) {
      console.error('[Draft Editor] Send error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  function handleCancel() {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
      >
        <button
          onClick={handleCancel}
          className="text-2xl mb-2 hover:opacity-80"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Draft Email</h1>
      </div>

      {/* Draft Form */}
      <div className="p-4 space-y-4">
        {/* To */}
        <div>
          <label className="block text-xs text-gray-500 uppercase font-semibold mb-1">
            To
          </label>
          <div className="text-base font-semibold text-gray-900 bg-gray-100 px-4 py-3 rounded-lg">
            {draft.to_address}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs text-gray-500 uppercase font-semibold mb-1">
            Subject
          </label>
          <div className="text-base font-semibold text-gray-900 bg-gray-100 px-4 py-3 rounded-lg">
            {draft.subject}
          </div>
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs text-gray-500 uppercase font-semibold mb-1">
            Your Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#1B3A7D] focus:border-transparent"
            placeholder="Type your message..."
          />
        </div>

        {/* Original Email (if reply) */}
        {draft.original_email_data && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase font-semibold mb-2">
              Original Message:
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900 mb-1">
                From: {draft.original_email_data.from?.emailAddress?.name || draft.original_email_data.from?.emailAddress?.address || 'Unknown'}
              </div>
              {draft.original_email_data.subject && (
                <div className="text-xs text-gray-600 mb-2">
                  Subject: {draft.original_email_data.subject}
                </div>
              )}
              {draft.original_email_data.receivedDateTime && (
                <div className="text-xs text-gray-500 mb-2">
                  {new Date(draft.original_email_data.receivedDateTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              )}
              <div className="text-sm text-gray-700 whitespace-pre-wrap mt-2 pt-2 border-t border-gray-300">
                {draft.original_email_data.bodyPreview || '(No preview available)'}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-red-500 mr-2 text-lg">⚠️</div>
              <div className="text-sm text-red-800">{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Send Button (Sticky Footer) */}
      <div
        className="sticky bottom-0 bg-white border-t border-gray-200 p-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
      >
        <button
          onClick={handleSend}
          disabled={isSending || !body.trim()}
          className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#152d61] transition-colors"
        >
          {isSending ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : (
            '📤 Send Email'
          )}
        </button>
      </div>
    </div>
  )
}
