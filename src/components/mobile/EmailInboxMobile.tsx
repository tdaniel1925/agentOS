'use client'

/**
 * EmailInboxMobile Component
 * Main mobile email inbox interface
 * Features: filtering, email selection, refresh
 */

import { useState } from 'react'
import { EmailCard } from './EmailCard'
import { EmailDetailModal } from './EmailDetailModal'
import { FilterChip } from './FilterChip'

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

interface EmailSummary {
  id: string
  subscriber_id: string
  summary_date: string
  total_unread: number
  urgent_count: number
  client_count: number
  lead_count: number
  admin_count: number
  summary_text: string
  created_at: string
}

interface EmailInboxMobileProps {
  emails: Email[]
  summary: EmailSummary
  subscriberId: string
}

type FilterType = 'all' | 'urgent' | 'client' | 'lead'

export function EmailInboxMobile({
  emails,
  summary,
  subscriberId
}: EmailInboxMobileProps) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter emails based on selected category
  const filteredEmails = emails.filter(email => {
    if (filter === 'all') return true
    return email.category === filter
  })

  // Handle refresh inbox
  async function handleRefresh(): Promise<void> {
    setIsRefreshing(true)

    try {
      const response = await fetch('/api/skills/email-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriberId })
      })

      if (response.ok) {
        // Reload page to show new data
        window.location.reload()
      } else {
        alert('Failed to refresh inbox. Please try again.')
      }
    } catch (error) {
      console.error('Refresh error:', error)
      alert('Network error. Please check your connection.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Empty state component
  const EmptyState = ({ currentFilter }: { currentFilter: FilterType }) => (
    <div className="flex items-center justify-center p-8 text-center">
      <div>
        <div className="text-4xl mb-2">📭</div>
        <p className="text-gray-600">
          {currentFilter === 'all'
            ? 'No emails yet'
            : `No ${currentFilter} emails`}
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div
        className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
      >
        <h1 className="text-xl font-bold">📧 Inbox</h1>
        <p className="text-sm opacity-90">Last 24 hours</p>
      </div>

      {/* Summary Bar with Filter Chips */}
      <div className="bg-white border-b p-4 flex gap-2 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <FilterChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          count={emails.length}
          label="All"
          color="gray"
        />

        {summary.urgent_count > 0 && (
          <FilterChip
            active={filter === 'urgent'}
            onClick={() => setFilter('urgent')}
            count={summary.urgent_count}
            label="🔴 Urgent"
            color="red"
          />
        )}

        {summary.client_count > 0 && (
          <FilterChip
            active={filter === 'client'}
            onClick={() => setFilter('client')}
            count={summary.client_count}
            label="👔 Client"
            color="blue"
          />
        )}

        {summary.lead_count > 0 && (
          <FilterChip
            active={filter === 'lead'}
            onClick={() => setFilter('lead')}
            count={summary.lead_count}
            label="💡 Lead"
            color="green"
          />
        )}
      </div>

      {/* Email List - Scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filteredEmails.length === 0 ? (
          <EmptyState currentFilter={filter} />
        ) : (
          filteredEmails.map(email => (
            <EmailCard
              key={email.id}
              email={email}
              onClick={() => setSelectedEmail(email)}
            />
          ))
        )}
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t p-4 sticky bottom-0">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#152d5f] transition-colors"
        >
          {isRefreshing ? 'Refreshing...' : '🔄 Refresh Inbox'}
        </button>
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <EmailDetailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </div>
  )
}
