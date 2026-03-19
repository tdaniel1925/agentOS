/**
 * Calendar Skill
 * Handles calendar operations: booking, checking, canceling appointments
 * Uses hybrid approach: CalDAV read + .ics email write
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendCalendarInvite, sendCancellationEmail } from '@/lib/calendar/email-sender'
import { getEventsForDate, getEventsForRange, formatEventsForSMS, isTimeSlotAvailable } from '@/lib/calendar/caldav-reader'
import { SMSIntent } from './sms-parser'

export interface ExecutionResult {
  success: boolean
  message: string
  data?: any
}

/**
 * Parse date from natural language
 */
function parseDate(dateStr: string, timeStr?: string): Date | null {
  const now = new Date()
  const lower = dateStr.toLowerCase()

  let targetDate: Date

  if (lower === 'today') {
    targetDate = new Date(now)
  } else if (lower === 'tomorrow') {
    targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() + 1)
  } else if (lower.match(/^next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)) {
    const dayName = lower.split(' ')[1]
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const targetDay = days.indexOf(dayName)
    const currentDay = now.getDay()
    const daysUntil = (targetDay - currentDay + 7) % 7 || 7
    targetDate = new Date(now)
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

  return targetDate
}

/**
 * Book an appointment
 */
export async function bookAppointment(
  intent: SMSIntent,
  subscriber: any,
  supabase?: any
): Promise<ExecutionResult> {
  const db = supabase || createServiceClient()

  try {
    const entities = intent.entities || {}

    // Parse date and time
    const startTime = parseDate(entities.date || 'today', entities.time)
    if (!startTime) {
      return {
        success: false,
        message: "I couldn't understand the date/time. Try: 'Book John tomorrow at 2pm'"
      }
    }

    // Calculate end time
    const durationMinutes = entities.duration_minutes || 60
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + durationMinutes)

    // Check if calendar URL is configured
    if (subscriber.calendar_url) {
      // Check availability in external calendar
      const isAvailable = await isTimeSlotAvailable(subscriber.calendar_url, startTime, endTime)
      if (!isAvailable) {
        return {
          success: false,
          message: `You already have something scheduled at that time. Check your calendar.`
        }
      }
    }

    // Create appointment in database
    const appointment = await (db as any)
      .from('appointments')
      .insert({
        subscriber_id: subscriber.id,
        title: entities.title || `Meeting with ${entities.contact_name || 'Contact'}`,
        description: entities.description,
        location: entities.location || 'Phone Call',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        contact_name: entities.contact_name,
        contact_phone: entities.contact_phone,
        contact_email: entities.contact_email,
        status: 'scheduled',
        created_via: 'sms',
        reminder_minutes: 15
      })
      .select()
      .single()

    if (appointment.error) {
      throw appointment.error
    }

    const appt = appointment.data

    // Send calendar invite via email
    if (subscriber.email) {
      await sendCalendarInvite({
        appointmentId: appt.id,
        to: subscriber.email,
        toName: subscriber.name,
        title: appt.title,
        description: appt.description,
        location: appt.location,
        startTime: new Date(appt.start_time),
        endTime: new Date(appt.end_time),
        businessName: subscriber.business_name || subscriber.name,
        businessEmail: subscriber.email,
        reminderMinutes: 15
      })

      // Mark as sent
      await (db as any)
        .from('appointments')
        .update({
          ics_sent: true,
          ics_sent_at: new Date().toISOString()
        })
        .eq('id', appt.id)
    }

    // Format confirmation message
    const dateStr = startTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
    const timeStr = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })

    return {
      success: true,
      message: `✓ Booked: ${appt.title}\n${dateStr} at ${timeStr}\nCalendar invite sent to your email.`,
      data: appt
    }

  } catch (error) {
    console.error('Book appointment error:', error)
    return {
      success: false,
      message: 'Failed to book appointment. Please try again.'
    }
  }
}

/**
 * Check calendar for a specific timeframe
 */
export async function checkCalendar(
  intent: SMSIntent,
  subscriber: any,
  supabase?: any
): Promise<ExecutionResult> {
  const db = supabase || createServiceClient()

  try {
    const entities = intent.entities || {}
    const timeframe = entities.timeframe || 'today'

    // Check if calendar URL is configured
    if (!subscriber.calendar_url) {
      // Fall back to Jordyn-managed appointments only
      const now = new Date()
      let startDate: Date
      let endDate: Date

      if (timeframe === 'today' || timeframe === 'tomorrow') {
        startDate = parseDate(timeframe) || now
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
      } else if (timeframe === 'week') {
        startDate = now
        endDate = new Date(now)
        endDate.setDate(endDate.getDate() + 7)
      } else {
        startDate = now
        endDate = new Date(now)
        endDate.setDate(endDate.getDate() + 1)
      }

      // Get Jordyn appointments
      const result = await (db as any)
        .from('appointments')
        .select('*')
        .eq('subscriber_id', subscriber.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true })

      if (result.error) throw result.error

      const appointments = result.data || []

      if (appointments.length === 0) {
        return {
          success: true,
          message: `No appointments scheduled for ${timeframe}.`
        }
      }

      let message = `Your appointments ${timeframe}:\n\n`
      for (const appt of appointments) {
        const start = new Date(appt.start_time)
        const timeStr = start.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        })
        message += `• ${timeStr} - ${appt.title}\n`
        if (appt.location) message += `  📍 ${appt.location}\n`
      }

      return {
        success: true,
        message: message.trim()
      }
    }

    // Fetch from external calendar
    let events
    const now = new Date()

    if (timeframe === 'today') {
      events = await getEventsForDate(subscriber.calendar_url, now)
    } else if (timeframe === 'tomorrow') {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      events = await getEventsForDate(subscriber.calendar_url, tomorrow)
    } else if (timeframe === 'week') {
      const endOfWeek = new Date(now)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      events = await getEventsForRange(subscriber.calendar_url, now, endOfWeek)
    } else {
      events = await getEventsForDate(subscriber.calendar_url, now)
    }

    const message = formatEventsForSMS(events)

    return {
      success: true,
      message
    }

  } catch (error) {
    console.error('Check calendar error:', error)
    return {
      success: false,
      message: 'Could not access your calendar. Make sure your calendar URL is configured.'
    }
  }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
  intent: SMSIntent,
  subscriber: any,
  supabase?: any
): Promise<ExecutionResult> {
  const db = supabase || createServiceClient()

  try {
    const entities = intent.entities || {}
    const identifier = entities.identifier

    if (!identifier) {
      return {
        success: false,
        message: "Which appointment? Try: 'Cancel my 2pm appointment' or 'Cancel appointment with John'"
      }
    }

    // Get upcoming appointments
    const result = await (db as any)
      .from('appointments')
      .select('*')
      .eq('subscriber_id', subscriber.id)
      .eq('status', 'scheduled')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10)

    if (result.error) throw result.error

    const appointments = result.data || []

    if (appointments.length === 0) {
      return {
        success: true,
        message: 'You have no upcoming appointments to cancel.'
      }
    }

    // Find matching appointment
    let toCancel = null

    if (identifier.toLowerCase().includes('next')) {
      toCancel = appointments[0]
    } else {
      // Search by name or time
      toCancel = appointments.find((appt: any) =>
        appt.title.toLowerCase().includes(identifier.toLowerCase()) ||
        appt.contact_name?.toLowerCase().includes(identifier.toLowerCase()) ||
        new Date(appt.start_time).toLocaleTimeString().includes(identifier)
      )
    }

    if (!toCancel) {
      return {
        success: false,
        message: `Couldn't find appointment matching "${identifier}". Try: 'What's on my calendar?' to see your appointments.`
      }
    }

    // Cancel appointment
    await (db as any)
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', toCancel.id)

    // Send cancellation email
    if (subscriber.email) {
      await sendCancellationEmail({
        appointmentId: toCancel.id,
        to: subscriber.email,
        title: toCancel.title,
        startTime: new Date(toCancel.start_time),
        endTime: new Date(toCancel.end_time),
        businessName: subscriber.business_name || subscriber.name,
        businessEmail: subscriber.email,
        reason: 'Cancelled via SMS'
      })
    }

    return {
      success: true,
      message: `✓ Cancelled: ${toCancel.title}\nCancellation sent to your calendar.`
    }

  } catch (error) {
    console.error('Cancel appointment error:', error)
    return {
      success: false,
      message: 'Failed to cancel appointment. Please try again.'
    }
  }
}
