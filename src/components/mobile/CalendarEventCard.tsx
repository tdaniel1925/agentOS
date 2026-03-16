'use client'

/**
 * CalendarEventCard Component
 * Individual calendar event card for mobile
 */

import React from 'react'

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

interface CalendarEventCardProps {
  event: CalendarEvent
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function CalendarEventCard({ event }: CalendarEventCardProps) {
  return (
    <div className="bg-white border-b p-4">
      <div className="flex gap-3">
        {/* Time column */}
        <div className="flex-shrink-0 w-16 text-right">
          {event.isAllDay ? (
            <div className="text-xs text-gray-500">All Day</div>
          ) : (
            <>
              <div className="text-lg font-bold text-gray-900">
                {formatTime(event.start.dateTime)}
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(event.end.dateTime)}
              </div>
            </>
          )}
        </div>

        {/* Event details */}
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-gray-900 mb-1">
            {event.subject}
          </div>

          {event.location?.displayName && (
            <div className="text-sm text-gray-600 flex items-center gap-1 mb-1">
              📍 {event.location.displayName}
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="text-sm text-gray-600">
              👥 {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
            </div>
          )}

          {event.bodyPreview && (
            <div className="text-sm text-gray-500 mt-2 line-clamp-2">
              {event.bodyPreview}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
