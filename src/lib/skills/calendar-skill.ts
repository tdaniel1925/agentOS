/**
 * Calendar Skill
 * Handles calendar operations: booking, checking, canceling appointments
 * Uses hybrid approach: CalDAV read + .ics email write
 * All dates are timezone-aware using subscriber's timezone
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendCalendarInvite, sendCancellationEmail } from '@/lib/calendar/email-sender'
import { getEventsForDate, getEventsForRange, formatEventsForSMS, isTimeSlotAvailable } from '@/lib/calendar/caldav-reader'
import { parseDate, formatDate, formatTime, formatDateTime } from '@/lib/calendar/timezone'
import { SMSIntent } from './sms-parser'

export interface ExecutionResult {
  success: boolean
  message: string
  data?: any
}

// parseDate function moved to @/lib/calendar/timezone
// All date parsing now uses subscriber's timezone

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

    // Get subscriber timezone (default to Central if not set)
    const timezone = subscriber.timezone || 'America/Chicago'

    // Parse date and time in subscriber's timezone
    const startTime = parseDate(entities.date || 'today', entities.time, timezone)
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
        reminderMinutes: 15,
        timezone: timezone
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

    // Format confirmation message in subscriber's timezone
    const dateStr = formatDate(new Date(appt.start_time), timezone)
    const timeStr = formatTime(new Date(appt.start_time), timezone)

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

    // Get subscriber timezone (default to Central if not set)
    const timezone = subscriber.timezone || 'America/Chicago'

    // Check if calendar URL is configured
    if (!subscriber.calendar_url) {
      // Fall back to Jordyn-managed appointments only
      let startDate: Date
      let endDate: Date

      if (timeframe === 'today' || timeframe === 'tomorrow') {
        startDate = parseDate(timeframe, undefined, timezone) || new Date()
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
      } else if (timeframe === 'week') {
        startDate = parseDate('today', undefined, timezone) || new Date()
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 7)
      } else {
        startDate = parseDate('today', undefined, timezone) || new Date()
        endDate = new Date(startDate)
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
        const timeStr = formatTime(start, timezone)
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

    const message = formatEventsForSMS(events, timezone)

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

    // Get subscriber timezone (default to Central if not set)
    const timezone = subscriber.timezone || 'America/Chicago'

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
        reason: 'Cancelled via SMS',
        timezone: timezone
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
