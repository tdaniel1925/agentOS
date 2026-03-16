'use client'

/**
 * CallHistoryMobile Component
 * Main call history interface for mobile
 */

import React, { useState, useMemo } from 'react'
import { CallCard } from './CallCard'
import { CallDetailModal } from './CallDetailModal'

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

interface CallHistoryMobileProps {
  calls: CallLog[]
  subscriberId: string
  businessName: string
  businessNumber?: string
}

interface CallGroup {
  date: string
  dateLabel: string
  calls: CallLog[]
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

function groupCallsByDate(calls: CallLog[]): CallGroup[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groupsMap = new Map<string, CallLog[]>()
  const groups: CallGroup[] = []

  calls.forEach(call => {
    const callDate = new Date(call.started_at)
    callDate.setHours(0, 0, 0, 0)

    let label: string
    if (callDate.getTime() === today.getTime()) {
      label = 'Today'
    } else if (callDate.getTime() === yesterday.getTime()) {
      label = 'Yesterday'
    } else {
      label = callDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      })
    }

    const key = callDate.toISOString()
    if (!groupsMap.has(key)) {
      groupsMap.set(key, [])
      groups.push({ date: key, dateLabel: label, calls: [] })
    }
    groupsMap.get(key)!.push(call)
  })

  // Fill in calls for each group
  groups.forEach(group => {
    group.calls = groupsMap.get(group.date) || []
  })

  return groups
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  const textColor = color === 'red' ? 'text-red-600' : 'text-gray-900'

  return (
    <div className="flex-1 bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-500 uppercase mb-1">{label}</div>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
    </div>
  )
}

function FilterChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  const baseClasses = 'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors'

  let classes = baseClasses
  if (active) {
    if (color === 'red') {
      classes += ' bg-red-600 text-white'
    } else if (color === 'green') {
      classes += ' bg-green-600 text-white'
    } else {
      classes += ' bg-[#1B3A7D] text-white'
    }
  } else {
    classes += ' bg-gray-200 text-gray-700 hover:bg-gray-300'
  }

  return (
    <button onClick={onClick} className={classes}>
      {label}
    </button>
  )
}

export function CallHistoryMobile({ calls, subscriberId, businessName, businessNumber }: CallHistoryMobileProps) {
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)
  const [filter, setFilter] = useState<'all' | 'missed' | 'completed'>('all')

  // Calculate stats
  const stats = useMemo(() => {
    const missedCount = calls.filter(c => c.status === 'no-answer' || c.status === 'failed').length
    const totalDuration = calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0)
    const avgDuration = calls.length > 0 ? Math.round(totalDuration / calls.length) : 0

    return {
      total: calls.length,
      missed: missedCount,
      avgDuration: avgDuration > 0 ? `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s` : '0s'
    }
  }, [calls])

  // Filter calls
  const filteredCalls = useMemo(() => {
    if (filter === 'missed') {
      return calls.filter(c => c.status === 'no-answer' || c.status === 'failed')
    } else if (filter === 'completed') {
      return calls.filter(c => c.status === 'completed')
    }
    return calls
  }, [calls, filter])

  // Group calls by date
  const groupedCalls = useMemo(() => groupCallsByDate(filteredCalls), [filteredCalls])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">📞 Call History</h1>
        <p className="text-sm opacity-90">{businessName}</p>
        {businessNumber && (
          <p className="text-xs opacity-75 mt-1">{formatPhoneNumber(businessNumber)}</p>
        )}
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b p-4">
        <div className="flex gap-4">
          <StatCard label="Total Calls" value={stats.total} />
          <StatCard label="Missed" value={stats.missed} color="red" />
          <StatCard label="Avg Duration" value={stats.avgDuration} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b p-3 flex gap-2 overflow-x-auto">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
        <FilterChip active={filter === 'missed'} onClick={() => setFilter('missed')} label="Missed" color="red" />
        <FilterChip active={filter === 'completed'} onClick={() => setFilter('completed')} label="Completed" color="green" />
      </div>

      {/* Call List */}
      <div className="flex-1 overflow-y-auto">
        {groupedCalls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📞</div>
            <p className="text-lg font-semibold mb-2">No calls found</p>
            <p className="text-sm">
              {filter === 'all'
                ? 'No calls in the last 7 days'
                : filter === 'missed'
                ? 'No missed calls'
                : 'No completed calls'}
            </p>
          </div>
        ) : (
          groupedCalls.map(group => (
            <div key={group.date}>
              <div className="bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 sticky top-0">
                {group.dateLabel}
              </div>
              {group.calls.map(call => (
                <CallCard
                  key={call.id}
                  call={call}
                  onClick={() => setSelectedCall(call)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <CallDetailModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  )
}
