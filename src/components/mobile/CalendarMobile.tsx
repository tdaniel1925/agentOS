'use client'

/**
 * CalendarMobile Component
 * Main calendar interface for mobile
 */

import React, { useMemo } from 'react'
import { CalendarEventCard } from './CalendarEventCard'

interface CalendarEvent {
  id: string
  subject: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: {
    displayName: string
  }
  attendees?: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  isAllDay: boolean
  bodyPreview?: string
}

interface CalendarMobileProps {
  events: CalendarEvent[]
  subscriberId: string
  view: 'today' | 'week' | 'month'
  connected: boolean
  error: string | null
}

interface EventGroup {
  date: string
  dateLabel: string
  events: CalendarEvent[]
}

function getViewLabel(view: 'today' | 'week' | 'month'): string {
  const labels = {
    today: 'Today',
    week: 'Next 7 Days',
    month: 'Next 30 Days'
  }
  return labels[view]
}

function groupEventsByDate(events: CalendarEvent[]): EventGroup[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const groupsMap = new Map<string, CalendarEvent[]>()
  const groups: EventGroup[] = []

  events.forEach(event => {
    const eventDate = new Date(event.start.dateTime)
    eventDate.setHours(0, 0, 0, 0)

    let label: string
    if (eventDate.getTime() === today.getTime()) {
      label = 'Today'
    } else if (eventDate.getTime() === tomorrow.getTime()) {
      label = 'Tomorrow'
    } else {
      label = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      })
    }

    const key = eventDate.toISOString()
    if (!groupsMap.has(key)) {
      groupsMap.set(key, [])
      groups.push({ date: key, dateLabel: label, events: [] })
    }
    groupsMap.get(key)!.push(event)
  })

  // Fill in events for each group
  groups.forEach(group => {
    group.events = groupsMap.get(group.date) || []
  })

  return groups
}

function ViewToggle({ active, href, label }: { active: boolean; href: string; label: string }) {
  const baseClasses = 'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors'
  const classes = active
    ? `${baseClasses} bg-[#1B3A7D] text-white`
    : `${baseClasses} bg-gray-200 text-gray-700 hover:bg-gray-300`

  return (
    <a href={href} className={classes}>
      {label}
    </a>
  )
}

function EmptyState({ view }: { view: 'today' | 'week' | 'month' }) {
  const message = {
    today: 'No events scheduled for today',
    week: 'No events in the next 7 days',
    month: 'No events in the next 30 days'
  }[view]

  return (
    <div className="p-8 text-center text-gray-500">
      <div className="text-4xl mb-4">📅</div>
      <p className="text-lg font-semibold mb-2">No Events</p>
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function CalendarMobile({ events, subscriberId, view, connected, error }: CalendarMobileProps) {
  const groupedEvents = useMemo(() => groupEventsByDate(events), [events])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">📅 Calendar</h1>
        <p className="text-sm opacity-90">{getViewLabel(view)}</p>
      </div>

      {/* Not Connected State */}
      {!connected && (
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Calendar Not Connected</h2>
          <p className="text-gray-600 mb-4">
            Connect your Outlook or Gmail calendar to see your events
          </p>
          <button className="bg-[#1B3A7D] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#152f65] transition-colors">
            Connect Calendar
          </button>
        </div>
      )}

      {/* Error State */}
      {error && connected && (
        <div className="m-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          ⚠️ {error}
        </div>
      )}

      {/* View Selector */}
      {connected && !error && (
        <>
          <div className="bg-white border-b p-3 flex gap-2 overflow-x-auto">
            <ViewToggle active={view === 'today'} href={`?view=today`} label="Today" />
            <ViewToggle active={view === 'week'} href={`?view=week`} label="Week" />
            <ViewToggle active={view === 'month'} href={`?view=month`} label="Month" />
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto">
            {groupedEvents.length === 0 ? (
              <EmptyState view={view} />
            ) : (
              groupedEvents.map(group => (
                <div key={group.date}>
                  <div className="bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 sticky top-0">
                    {group.dateLabel}
                  </div>
                  {group.events.map(event => (
                    <CalendarEventCard key={event.id} event={event} />
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
