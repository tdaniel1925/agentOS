'use client'

/**
 * EmailCard Component
 * Display individual email in the inbox list
 * Shows sender, subject, preview, and timestamp
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

interface EmailCardProps {
  email: Email
  onClick: () => void
}

/**
 * Format timestamp to human-readable format
 * Shows "Xm ago" or "Xh ago" for recent emails, otherwise date
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

export function EmailCard({ email, onClick }: EmailCardProps) {
  // Determine category badge
  const getCategoryBadge = () => {
    switch (email.category) {
      case 'urgent':
        return (
          <div className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mb-2">
            🔴 Urgent
          </div>
        )
      case 'client':
        return (
          <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
            👔 Client
          </div>
        )
      case 'lead':
        return (
          <div className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-2">
            💡 Lead
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      onClick={onClick}
      className="bg-white border-b p-4 active:bg-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
      style={{
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none'
      }}
    >
      {/* Category badge */}
      {getCategoryBadge()}

      {/* From */}
      <div className="text-sm font-semibold text-gray-900 mb-1">
        {email.from.emailAddress.name || email.from.emailAddress.address}
      </div>

      {/* Subject */}
      <div className="text-base font-medium text-gray-800 mb-2">
        {email.subject || '(no subject)'}
      </div>

      {/* Preview */}
      <div className="text-sm text-gray-600 line-clamp-2">
        {email.bodyPreview || '(no preview available)'}
      </div>

      {/* Timestamp */}
      <div className="text-xs text-gray-500 mt-2">
        {formatTimestamp(email.receivedDateTime)}
      </div>
    </div>
  )
}
