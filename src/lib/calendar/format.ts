/**
 * Calendar Formatting Utilities
 *
 * Format calendar events for SMS and voice output
 */

import { CalendarEvent } from '@/lib/email/microsoft'

/**
 * Format a single calendar event for SMS display
 */
export function formatEventForSMS(event: CalendarEvent): string {
  const startTime = new Date(event.start.dateTime)
  const endTime = new Date(event.end.dateTime)

  const timeStr = event.isAllDay
    ? 'All Day'
    : `${formatTime(startTime)} - ${formatTime(endTime)}`

  const location = event.location?.displayName ? `\n📍 ${event.location.displayName}` : ''
  const attendees = event.attendees && event.attendees.length > 0
    ? `\n👥 ${event.attendees.length} attendee${event.attendees.length === 1 ? '' : 's'}`
    : ''

  return `⏰ ${timeStr}\n📅 ${event.subject}${location}${attendees}`
}

/**
 * Format multiple calendar events for SMS
 */
export function formatEventsForSMS(events: CalendarEvent[], title: string = 'Calendar'): string {
  if (events.length === 0) {
    return `📅 ${title}\n\nNo events scheduled.`
  }

  const header = `📅 ${title} (${events.length} event${events.length === 1 ? '' : 's'})\n`
  const eventList = events.map((event, index) => {
    const num = `${index + 1}. `
    return num + formatEventForSMS(event).split('\n').join('\n   ')
  }).join('\n\n')

  return header + '\n' + eventList
}

/**
 * Format today's events for SMS
 */
export function formatTodayEventsForSMS(events: CalendarEvent[]): string {
  return formatEventsForSMS(events, 'Today\'s Schedule')
}

/**
 * Format this week's events for SMS
 */
export function formatWeekEventsForSMS(events: CalendarEvent[]): string {
  if (events.length === 0) {
    return '📅 This Week\'s Schedule\n\nNo events scheduled.'
  }

  // Group events by date
  const eventsByDate = new Map<string, CalendarEvent[]>()

  events.forEach(event => {
    const dateKey = new Date(event.start.dateTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })

    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, [])
    }
    eventsByDate.get(dateKey)!.push(event)
  })

  let result = `📅 This Week (${events.length} event${events.length === 1 ? '' : 's'})\n`

  eventsByDate.forEach((dayEvents, date) => {
    result += `\n${date}:\n`
    dayEvents.forEach((event, index) => {
      const timeStr = event.isAllDay
        ? 'All Day'
        : formatTime(new Date(event.start.dateTime))
      result += `  ${index + 1}. ${timeStr} - ${event.subject}\n`
    })
  })

  return result
}

/**
 * Format calendar events for voice reading
 */
export interface EventForVoice {
  subject: string
  start: string
  end: string
  startTime: string
  endTime: string
  location?: string
  attendees: number
  isAllDay: boolean
  bodyPreview?: string
}

export function formatEventsForVoice(events: CalendarEvent[]): EventForVoice[] {
  return events.map(event => {
    const startDate = new Date(event.start.dateTime)
    const endDate = new Date(event.end.dateTime)

    return {
      subject: event.subject,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      startTime: formatTimeForVoice(startDate),
      endTime: formatTimeForVoice(endDate),
      location: event.location?.displayName,
      attendees: event.attendees?.length || 0,
      isAllDay: event.isAllDay,
      bodyPreview: event.bodyPreview
    }
  })
}

/**
 * Helper: Format time for SMS (e.g., "2:30 PM")
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Helper: Format time for voice (e.g., "two thirty PM")
 */
function formatTimeForVoice(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()

  const hour12 = hours % 12 || 12
  const ampm = hours >= 12 ? 'PM' : 'AM'

  if (minutes === 0) {
    return `${hour12} ${ampm}`
  } else {
    const minuteStr = minutes < 10 ? `oh ${minutes}` : String(minutes)
    return `${hour12} ${minuteStr} ${ampm}`
  }
}

/**
 * Create a summary message for calendar events
 */
export function createCalendarSummary(events: CalendarEvent[], period: 'today' | 'week'): string {
  if (events.length === 0) {
    const periodText = period === 'today' ? 'today' : 'this week'
    return `You have no events scheduled ${periodText}.`
  }

  const periodText = period === 'today' ? 'Today' : 'This week'
  const count = events.length
  const plural = count === 1 ? '' : 's'

  const nextEvent = events[0]
  const nextTime = formatTime(new Date(nextEvent.start.dateTime))

  if (period === 'today' && count === 1) {
    return `You have 1 event today: "${nextEvent.subject}" at ${nextTime}`
  }

  return `${periodText} you have ${count} event${plural}. Your next one is "${nextEvent.subject}" at ${nextTime}`
}
