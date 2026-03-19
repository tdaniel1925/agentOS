/**
 * Timezone Utilities
 * Handles timezone conversions for calendar operations
 */

import { toZonedTime, fromZonedTime, format } from 'date-fns-tz'
import { parse } from 'date-fns'

/**
 * Common timezones for calendar setup
 */
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST - no DST)' },
  { value: 'America/Toronto', label: 'Toronto (ET)' },
  { value: 'America/Vancouver', label: 'Vancouver (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT/NZST)' },
]

/**
 * Parse date from natural language in subscriber's timezone
 * Returns UTC date for storage
 */
export function parseDate(dateStr: string, timeStr: string | undefined, timezone: string): Date | null {
  try {
    // Get current time in subscriber's timezone
    const now = new Date()
    const zonedNow = toZonedTime(now, timezone)

    const lower = dateStr.toLowerCase()
    let targetDate: Date

    if (lower === 'today') {
      targetDate = new Date(zonedNow)
    } else if (lower === 'tomorrow') {
      targetDate = new Date(zonedNow)
      targetDate.setDate(targetDate.getDate() + 1)
    } else if (lower.match(/^next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)) {
      const dayName = lower.split(' ')[1]
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = days.indexOf(dayName)
      const currentDay = zonedNow.getDay()
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7
      targetDate = new Date(zonedNow)
      targetDate.setDate(targetDate.getDate() + daysUntil)
    } else {
      // Try ISO format or Date.parse
      targetDate = new Date(dateStr)
      if (isNaN(targetDate.getTime())) {
        return null
      }
    }

    // Set time if provided
    if (timeStr) {
      const timeMatch = timeStr.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i)
      if (timeMatch) {
        let hours = parseInt(timeMatch[1])
        const minutes = parseInt(timeMatch[2] || '0')
        const meridiem = timeMatch[3]?.toLowerCase()

        if (meridiem === 'pm' && hours < 12) hours += 12
        if (meridiem === 'am' && hours === 12) hours = 0

        targetDate.setHours(hours, minutes, 0, 0)
      }
    } else {
      targetDate.setHours(0, 0, 0, 0)
    }

    // Convert from subscriber's timezone to UTC for storage
    return fromZonedTime(targetDate, timezone)
  } catch (error) {
    console.error('Date parsing error:', error)
    return null
  }
}

/**
 * Format date in subscriber's timezone for display
 */
export function formatDate(utcDate: Date, timezone: string): string {
  try {
    const zonedDate = toZonedTime(utcDate, timezone)
    return format(zonedDate, 'EEE, MMM d', { timeZone: timezone })
  } catch (error) {
    console.error('Date formatting error:', error)
    return utcDate.toLocaleDateString()
  }
}

/**
 * Format time in subscriber's timezone for display
 */
export function formatTime(utcDate: Date, timezone: string): string {
  try {
    const zonedDate = toZonedTime(utcDate, timezone)
    return format(zonedDate, 'h:mm a', { timeZone: timezone })
  } catch (error) {
    console.error('Time formatting error:', error)
    return utcDate.toLocaleTimeString()
  }
}

/**
 * Format full date and time in subscriber's timezone
 */
export function formatDateTime(utcDate: Date, timezone: string): string {
  try {
    const zonedDate = toZonedTime(utcDate, timezone)
    return format(zonedDate, 'EEE, MMM d \'at\' h:mm a', { timeZone: timezone })
  } catch (error) {
    console.error('DateTime formatting error:', error)
    return utcDate.toLocaleString()
  }
}

/**
 * Get current time in subscriber's timezone
 */
export function getNowInTimezone(timezone: string): Date {
  return toZonedTime(new Date(), timezone)
}
