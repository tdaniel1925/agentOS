/**
 * Calendar Email Sender
 * Sends calendar invites via email with .ics attachments
 */

import { Resend } from 'resend'
import { generateAppointmentICS, generateCancellationICS } from './ics-generator'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'jordyn@jordyn.app'

export interface SendCalendarInviteParams {
  appointmentId: string
  to: string
  toName?: string
  title: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  businessName: string
  businessEmail: string
  reminderMinutes?: number
}

/**
 * Send calendar invite email with .ics attachment
 */
export async function sendCalendarInvite(params: SendCalendarInviteParams): Promise<void> {
  try {
    console.log(`[Calendar Email] Sending invite to ${params.to}`)

    // Generate .ics file
    const icsContent = generateAppointmentICS({
      appointmentId: params.appointmentId,
      title: params.title,
      description: params.description,
      location: params.location,
      startTime: params.startTime,
      endTime: params.endTime,
      businessName: params.businessName,
      businessEmail: params.businessEmail,
      customerEmail: params.to,
      customerName: params.toName,
      reminderMinutes: params.reminderMinutes
    })

    // Format date/time for email body
    const dateStr = params.startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const timeStr = params.startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    // Email HTML body
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1B3A7D;">Appointment Scheduled</h2>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">${params.title}</h3>
          <p style="margin: 10px 0;"><strong>When:</strong> ${dateStr} at ${timeStr}</p>
          ${params.location ? `<p style="margin: 10px 0;"><strong>Where:</strong> ${params.location}</p>` : ''}
          ${params.description ? `<p style="margin: 10px 0;"><strong>Details:</strong> ${params.description}</p>` : ''}
        </div>

        <p>This appointment has been added to your calendar automatically.</p>

        <p style="font-size: 12px; color: #666; margin-top: 30px;">
          Scheduled by ${params.businessName} via Jordyn AI
        </p>
      </div>
    `

    // Send email with .ics attachment
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Appointment: ${params.title}`,
      html: htmlBody,
      attachments: [{
        filename: 'invite.ics',
        content: Buffer.from(icsContent).toString('base64')
      }]
    })

    console.log(`[Calendar Email] Sent successfully:`, result.data?.id || 'success')

  } catch (error) {
    console.error('[Calendar Email] Error sending invite:', error)
    throw new Error(`Failed to send calendar invite: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Send cancellation email with .ics cancellation
 */
export async function sendCancellationEmail(params: {
  appointmentId: string
  to: string
  title: string
  startTime: Date
  endTime: Date
  businessName: string
  businessEmail: string
  reason?: string
}): Promise<void> {
  try {
    console.log(`[Calendar Email] Sending cancellation to ${params.to}`)

    // Generate cancellation .ics
    const icsContent = generateCancellationICS({
      appointmentId: params.appointmentId,
      title: params.title,
      startTime: params.startTime,
      endTime: params.endTime,
      businessName: params.businessName,
      businessEmail: params.businessEmail
    })

    const dateStr = params.startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })

    const timeStr = params.startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C7181F;">Appointment Cancelled</h2>

        <div style="background-color: #fff3f3; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #C7181F;">
          <h3 style="margin-top: 0; color: #333;">${params.title}</h3>
          <p style="margin: 10px 0;"><strong>Was scheduled for:</strong> ${dateStr} at ${timeStr}</p>
          ${params.reason ? `<p style="margin: 10px 0;"><strong>Reason:</strong> ${params.reason}</p>` : ''}
        </div>

        <p>This appointment has been removed from your calendar.</p>

        <p style="font-size: 12px; color: #666; margin-top: 30px;">
          ${params.businessName} via Jordyn AI
        </p>
      </div>
    `

    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Cancelled: ${params.title}`,
      html: htmlBody,
      attachments: [{
        filename: 'cancellation.ics',
        content: Buffer.from(icsContent).toString('base64')
      }]
    })

    console.log('[Calendar Email] Cancellation sent successfully')

  } catch (error) {
    console.error('[Calendar Email] Error sending cancellation:', error)
    throw new Error(`Failed to send cancellation: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
