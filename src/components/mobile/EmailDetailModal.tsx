'use client'

/**
 * EmailDetailModal Component
 * Full-screen modal showing complete email details
 * Includes back button, category badge, sender, subject, timestamp, and message
 */

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

interface EmailDetailModalProps {
  email: Email
  onClose: () => void
}

export function EmailDetailModal({ email, onClose }: EmailDetailModalProps) {
  // Get category badge
  const getCategoryBadge = () => {
    switch (email.category) {
      case 'urgent':
        return (
          <div className="inline-block bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full mb-4">
            🔴 Urgent
          </div>
        )
      case 'client':
        return (
          <div className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mb-4">
            👔 Client
          </div>
        )
      case 'lead':
        return (
          <div className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full mb-4">
            💡 Lead
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div
        className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10 flex items-center justify-between"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
      >
        <button
          onClick={onClose}
          className="text-2xl w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded"
          aria-label="Close"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">Email Details</h2>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Email Content */}
      <div className="p-4">
        {/* Category Badge */}
        {getCategoryBadge()}

        {/* From */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase mb-1">From</div>
          <div className="text-base font-semibold">
            {email.from.emailAddress.name || email.from.emailAddress.address}
          </div>
          {email.from.emailAddress.name && (
            <div className="text-sm text-gray-600">
              {email.from.emailAddress.address}
            </div>
          )}
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
            {email.bodyPreview || '(no message content)'}
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
          className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
