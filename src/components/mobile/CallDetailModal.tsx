'use client'

/**
 * CallDetailModal Component
 * Full-screen modal showing transcript and call details
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

interface CallDetailModalProps {
  call: CallLog
  onClose: () => void
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

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
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

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="text-xs text-gray-500 uppercase mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  )
}

export function CallDetailModal({ call, onClose }: CallDetailModalProps) {
  const phoneNumber = call.direction === 'inbound' ? call.from_number : call.to_number

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-2xl hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">Call Details</h2>
        <div className="w-8" />
      </div>

      {/* Call Info */}
      <div className="p-4">
        {/* Direction & Number */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center text-2xl
            ${call.direction === 'inbound'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-green-100 text-green-600'}
          `}>
            {call.direction === 'inbound' ? '📥' : '📤'}
          </div>
          <div>
            <div className="text-sm text-gray-500">
              {call.direction === 'inbound' ? 'Inbound Call' : 'Outbound Call'}
            </div>
            <div className="text-xl font-semibold">
              {formatPhoneNumber(phoneNumber)}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <InfoCard label="Duration" value={formatDuration(call.duration_seconds)} />
          <InfoCard label="Status" value={<StatusBadge status={call.status} />} />
          <InfoCard label="Started" value={formatDateTime(call.started_at)} />
          <InfoCard label="Ended" value={call.ended_at ? formatDateTime(call.ended_at) : 'N/A'} />
        </div>

        {/* Sentiment */}
        {call.sentiment && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Call Sentiment</div>
            <SentimentBadge sentiment={call.sentiment} />
          </div>
        )}

        {/* Summary */}
        {call.summary && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 uppercase mb-2">AI Summary</div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              {call.summary}
            </div>
          </div>
        )}

        {/* Transcript */}
        {call.transcript ? (
          <div className="mb-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Full Transcript</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {call.transcript}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            ⚠️ Transcript not available for this call
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 bg-white border-t p-4 space-y-2">
        <button
          onClick={() => window.location.href = `tel:${phoneNumber}`}
          className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold hover:bg-[#152f65] transition-colors"
        >
          📞 Call Back
        </button>
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
