/**
 * CalDAV/iCal Reader
 * Fetches calendar events from external calendars via iCal feed URLs
 * Supports: Google Calendar, Microsoft Outlook, Apple iCloud
 */

import ICAL from 'ical.js'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  location?: string
  allDay: boolean
  status: 'confirmed' | 'tentative' | 'cancelled'
}

/**
 * Fetch and parse calendar events from iCal/CalDAV URL
 */
export async function fetchCalendarEvents(
  calendarUrl: string,
  startDate?: Date,
  endDate?: Date
): Promise<CalendarEvent[]> {
  try {
    console.log('[CalDAV] Fetching calendar from:', calendarUrl.substring(0, 50) + '...')

    // Fetch the iCal feed
    const response = await fetch(calendarUrl, {
      headers: {
        'User-Agent': 'Jordyn-AI-Calendar/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.statusText}`)
    }

    const icalData = await response.text()

    // Parse with ical.js
    const jcalData = ICAL.parse(icalData)
    const comp = new ICAL.Component(jcalData)
    const vevents = comp.getAllSubcomponents('vevent')

    const events: CalendarEvent[] = []

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent)

      // Get start and end times
      const start = event.startDate?.toJSDate()
      const end = event.endDate?.toJSDate()

      if (!start || !end) continue

      // Filter by date range if provided
      if (startDate && end < startDate) continue
      if (endDate && start > endDate) continue

      // Get status from vevent component
      const statusProp = vevent.getFirstPropertyValue('status')
      const status = statusProp ? String(statusProp).toLowerCase() : 'confirmed'

      events.push({
        id: event.uid || `event-${Date.now()}`,
        title: event.summary || 'Untitled Event',
        description: event.description || undefined,
        start,
        end,
        location: event.location || undefined,
        allDay: event.startDate?.isDate || false,
        status: (status as 'confirmed' | 'tentative' | 'cancelled') || 'confirmed'
      })
    }

    console.log(`[CalDAV] Fetched ${events.length} events`)
    return events

  } catch (error) {
    console.error('[CalDAV] Error fetching calendar:', error)
    throw new Error(`Failed to read calendar: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if a specific time slot is available
 */
export async function isTimeSlotAvailable(
  calendarUrl: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const events = await fetchCalendarEvents(calendarUrl, startTime, endTime)

    // Check for any overlapping events
    for (const event of events) {
      // Skip cancelled events
      if (event.status === 'cancelled') continue

      // Check for overlap
      const hasOverlap =
        (startTime >= event.start && startTime < event.end) || // Start time is during event
        (endTime > event.start && endTime <= event.end) || // End time is during event
        (startTime <= event.start && endTime >= event.end) // Event is entirely within time slot

      if (hasOverlap) {
        console.log(`[CalDAV] Time slot conflicts with: ${event.title}`)
        return false
      }
    }

    return true

  } catch (error) {
    console.error('[CalDAV] Error checking availability:', error)
    // If we can't check, assume not available to be safe
    return false
  }
}

/**
 * Get events for a specific date
 */
export async function getEventsForDate(
  calendarUrl: string,
  date: Date
): Promise<CalendarEvent[]> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return fetchCalendarEvents(calendarUrl, startOfDay, endOfDay)
}

/**
 * Get events for a date range
 */
export async function getEventsForRange(
  calendarUrl: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  return fetchCalendarEvents(calendarUrl, startDate, endDate)
}

/**
 * Get upcoming events (next N days)
 */
export async function getUpcomingEvents(
  calendarUrl: string,
  days: number = 7
): Promise<CalendarEvent[]> {
  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  return fetchCalendarEvents(calendarUrl, now, future)
}

/**
 * Format events for display
 */
export function formatEventsForSMS(events: CalendarEvent[]): string {
  if (events.length === 0) {
    return 'No events found.'
  }

  let message = `Found ${events.length} event${events.length === 1 ? '' : 's'}:\n\n`

  for (const event of events) {
    const date = event.start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
    const time = event.allDay ? 'All day' : event.start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })

    message += `• ${date} at ${time}\n  ${event.title}\n`
    if (event.location) {
      message += `  📍 ${event.location}\n`
    }
    message += '\n'
  }

  return message.trim()
}
