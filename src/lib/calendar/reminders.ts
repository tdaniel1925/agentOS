/**
 * Calendar Reminders System
 * Sends SMS reminders before appointments
 * All times are displayed in subscriber's timezone
 */

import { createClient } from '@supabase/supabase-js'
import { sendSMS } from '@/lib/twilio/client'
import { formatDateTime } from '@/lib/calendar/timezone'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ReminderWindow {
  minutes: number
  label: string
  key: string // For tracking in database
}

// Reminder windows to check
const REMINDER_WINDOWS: ReminderWindow[] = [
  { minutes: 1440, label: '24 hours', key: '24h' }, // 24 hours
  { minutes: 60, label: '1 hour', key: '1h' },
  { minutes: 15, label: '15 minutes', key: '15m' }
]

/**
 * Check and send reminders for upcoming appointments
 */
export async function sendAppointmentReminders(): Promise<{
  processed: number
  sent: number
  errors: number
}> {
  console.log('[Reminders] Checking for appointments needing reminders...')

  let processed = 0
  let sent = 0
  let errors = 0

  try {
    const now = new Date()

    // For each reminder window, find appointments that need reminders
    for (const window of REMINDER_WINDOWS) {
      const windowStart = new Date(now)
      windowStart.setMinutes(windowStart.getMinutes() + window.minutes - 5) // 5 min buffer

      const windowEnd = new Date(now)
      windowEnd.setMinutes(windowEnd.getMinutes() + window.minutes + 5)

      // Find appointments in this time window that haven't received THIS specific reminder
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          subscribers (
            id,
            name,
            business_name,
            control_phone,
            timezone
          )
        `)
        .eq('status', 'scheduled')
        .not('reminders_sent', 'cs', `{${window.key}}`) // Not contains this reminder key
        .gte('start_time', windowStart.toISOString())
        .lte('start_time', windowEnd.toISOString())

      if (error) {
        console.error(`[Reminders] Error fetching appointments for ${window.label}:`, error)
        errors++
        continue
      }

      if (!appointments || appointments.length === 0) {
        console.log(`[Reminders] No appointments needing ${window.label} reminder`)
        continue
      }

      console.log(`[Reminders] Found ${appointments.length} appointment(s) for ${window.label} reminder`)

      // Send reminders
      for (const appointment of appointments) {
        processed++

        try {
          const subscriber = (appointment as any).subscribers

          if (!subscriber?.control_phone) {
            console.log(`[Reminders] No control phone for appointment ${appointment.id}`)
            continue
          }

          // Format appointment details in subscriber's timezone
          const startTime = new Date(appointment.start_time)
          const timezone = subscriber.timezone || 'America/Chicago'
          const dateTimeStr = formatDateTime(startTime, timezone)

          // Build reminder message
          let message = `⏰ Reminder: ${appointment.title}\n`
          message += `${dateTimeStr}\n`

          if (appointment.location) {
            message += `📍 ${appointment.location}\n`
          }

          if (appointment.contact_phone) {
            message += `📞 ${appointment.contact_phone}\n`
          }

          message += `\nStarts in ${window.label}.`

          // Send SMS
          await sendSMS({
            to: subscriber.control_phone,
            body: message
          })

          // Mark this specific reminder as sent by adding to array
          const currentReminders = appointment.reminders_sent || []
          await supabase
            .from('appointments')
            .update({
              reminders_sent: [...currentReminders, window.key],
              reminder_sent: true, // Keep for backwards compatibility
              reminder_sent_at: new Date().toISOString()
            })
            .eq('id', appointment.id)

          console.log(`[Reminders] Sent ${window.label} reminder for appointment ${appointment.id}`)
          sent++

        } catch (error) {
          console.error(`[Reminders] Error sending reminder for appointment ${appointment.id}:`, error)
          errors++
        }
      }
    }

    console.log(`[Reminders] Complete. Processed: ${processed}, Sent: ${sent}, Errors: ${errors}`)

    return { processed, sent, errors }

  } catch (error) {
    console.error('[Reminders] Fatal error:', error)
    return { processed, sent, errors: errors + 1 }
  }
}

/**
 * Send a test reminder for debugging
 */
export async function sendTestReminder(appointmentId: string): Promise<void> {
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      *,
      subscribers (
        id,
        name,
        control_phone
      )
    `)
    .eq('id', appointmentId)
    .single()

  if (error || !appointment) {
    throw new Error('Appointment not found')
  }

  const subscriber = (appointment as any).subscribers

  if (!subscriber?.control_phone) {
    throw new Error('No control phone for subscriber')
  }

  const startTime = new Date(appointment.start_time)
  const message = `🧪 TEST REMINDER\n\n${appointment.title}\n${startTime.toLocaleString()}`

  await sendSMS({
    to: subscriber.control_phone,
    body: message
  })

  console.log(`[Reminders] Test reminder sent for appointment ${appointmentId}`)
}
