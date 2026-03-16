'use client'

/**
 * CallCard Component
 * Individual call card for mobile call history
 */

import React from 'react'

interface CallLog {
  id: string
  vapi_call_id: string
  direction: 'inbound' | 'outbound'
  from_number: string
  to_number: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  duration_minutes: number | null
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer'
  transcript: string | null
  summary: string | null
  sentiment: 'positive' | 'neutral' | 'negative' | null
  metadata: any
}

interface CallCardProps {
  call: CallLog
  onClick: () => void
}

function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '')

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  return phoneNumber
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds === 0) return 'No answer'

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (mins === 0) {
    return `${secs}s`
  }

  return `${mins}m ${secs}s`
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    completed: { label: 'Completed', color: 'green' },
    'no-answer': { label: 'Missed', color: 'red' },
    failed: { label: 'Failed', color: 'red' },
    busy: { label: 'Busy', color: 'yellow' },
    'in-progress': { label: 'In Progress', color: 'blue' }
  }

  const { label, color } = config[status] || { label: status, color: 'gray' }

  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${colorClasses[color]}`}>
      {label}
    </span>
  )
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const config: Record<string, { emoji: string; label: string; color: string }> = {
    positive: { emoji: '😊', label: 'Positive', color: 'green' },
    neutral: { emoji: '😐', label: 'Neutral', color: 'gray' },
    negative: { emoji: '😟', label: 'Negative', color: 'red' }
  }

  const { emoji, label, color } = config[sentiment] || config.neutral

  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${colorClasses[color]}`}>
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  )
}

export function CallCard({ call, onClick }: CallCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white border-b p-4 active:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Call direction icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl
          ${call.direction === 'inbound'
            ? 'bg-blue-100 text-blue-600'
            : 'bg-green-100 text-green-600'}
        `}>
          {call.direction === 'inbound' ? '📥' : '📤'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Phone number / name */}
          <div className="text-base font-semibold text-gray-900">
            {formatPhoneNumber(
              call.direction === 'inbound' ? call.from_number : call.to_number
            )}
          </div>

          {/* Status & Duration */}
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={call.status} />
            {call.duration_seconds && call.duration_seconds > 0 && (
              <span className="text-sm text-gray-600">
                {formatDuration(call.duration_seconds)}
              </span>
            )}
          </div>

          {/* Summary (if available) */}
          {call.summary && (
            <div className="text-sm text-gray-600 mt-2 line-clamp-2">
              {call.summary}
            </div>
          )}

          {/* Sentiment indicator */}
          {call.sentiment && (
            <div className="mt-2">
              <SentimentBadge sentiment={call.sentiment} />
            </div>
          )}
        </div>

        {/* Time */}
        <div className="flex-shrink-0 text-right">
          <div className="text-xs text-gray-500">
            {formatTime(call.started_at)}
          </div>
          {call.transcript && (
            <div className="text-xs text-blue-600 mt-1">
              View transcript →
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
