/**
 * ICS File Generator
 * Creates .ics calendar invite files that work with any calendar app
 * (Outlook, Google Calendar, Apple Calendar, etc.)
 */

export interface ICSEvent {
  uid: string
  title: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  organizerName?: string
  organizerEmail?: string
  attendeeEmail?: string
  attendeeName?: string
  reminderMinutes?: number
  url?: string
}

/**
 * Format date for ICS file (UTC format: YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

/**
 * Escape special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Fold lines longer than 75 characters (ICS spec requirement)
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line

  const lines: string[] = []
  let remaining = line

  while (remaining.length > 75) {
    lines.push(remaining.substring(0, 75))
    remaining = ' ' + remaining.substring(75) // Continuation lines start with space
  }

  if (remaining.length > 0) {
    lines.push(remaining)
  }

  return lines.join('\r\n')
}

/**
 * Generate ICS file content
 */
export function generateICS(event: ICSEvent): string {
  const lines: string[] = []

  // Header
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//Jordyn AI//Calendar//EN')
  lines.push('METHOD:REQUEST')
  lines.push('CALSCALE:GREGORIAN')

  // Event
  lines.push('BEGIN:VEVENT')
  lines.push(`UID:${event.uid}`)
  lines.push(`DTSTAMP:${formatICSDate(new Date())}`)
  lines.push(`DTSTART:${formatICSDate(event.startTime)}`)
  lines.push(`DTEND:${formatICSDate(event.endTime)}`)
  lines.push(`SUMMARY:${escapeICSText(event.title)}`)

  if (event.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeICSText(event.description)}`))
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`)
  }

  if (event.url) {
    lines.push(`URL:${event.url}`)
  }

  // Organizer
  if (event.organizerEmail) {
    const organizerLine = `ORGANIZER;CN="${escapeICSText(event.organizerName || 'Jordyn AI')}":mailto:${event.organizerEmail}`
    lines.push(foldLine(organizerLine))
  }

  // Attendee
  if (event.attendeeEmail) {
    const attendeeLine = `ATTENDEE;CN="${escapeICSText(event.attendeeName || event.attendeeEmail)}";RSVP=TRUE:mailto:${event.attendeeEmail}`
    lines.push(foldLine(attendeeLine))
  }

  lines.push('STATUS:CONFIRMED')
  lines.push('SEQUENCE:0')
  lines.push('TRANSP:OPAQUE')

  // Reminder/Alarm
  if (event.reminderMinutes && event.reminderMinutes > 0) {
    lines.push('BEGIN:VALARM')
    lines.push(`TRIGGER:-PT${event.reminderMinutes}M`)
    lines.push('ACTION:DISPLAY')
    lines.push(`DESCRIPTION:Reminder: ${escapeICSText(event.title)}`)
    lines.push('END:VALARM')
  }

  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Generate ICS for appointment
 */
export function generateAppointmentICS(params: {
  appointmentId: string
  title: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  businessName: string
  businessEmail: string
  customerEmail?: string
  customerName?: string
  reminderMinutes?: number
}): string {
  return generateICS({
    uid: `jordyn-appt-${params.appointmentId}@jordyn.app`,
    title: params.title,
    description: params.description,
    location: params.location,
    startTime: params.startTime,
    endTime: params.endTime,
    organizerName: params.businessName,
    organizerEmail: params.businessEmail,
    attendeeEmail: params.customerEmail,
    attendeeName: params.customerName,
    reminderMinutes: params.reminderMinutes || 15,
    url: `https://jordyn.app/app/appointments/${params.appointmentId}`
  })
}

/**
 * Generate cancellation ICS
 */
export function generateCancellationICS(params: {
  appointmentId: string
  title: string
  startTime: Date
  endTime: Date
  businessName: string
  businessEmail: string
}): string {
  const lines: string[] = []

  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//Jordyn AI//Calendar//EN')
  lines.push('METHOD:CANCEL')
  lines.push('CALSCALE:GREGORIAN')

  lines.push('BEGIN:VEVENT')
  lines.push(`UID:jordyn-appt-${params.appointmentId}@jordyn.app`)
  lines.push(`DTSTAMP:${formatICSDate(new Date())}`)
  lines.push(`DTSTART:${formatICSDate(params.startTime)}`)
  lines.push(`DTEND:${formatICSDate(params.endTime)}`)
  lines.push(`SUMMARY:${escapeICSText(params.title)}`)
  lines.push('STATUS:CANCELLED')
  lines.push('SEQUENCE:1')

  if (params.businessEmail) {
    const organizerLine = `ORGANIZER;CN="${escapeICSText(params.businessName)}":mailto:${params.businessEmail}`
    lines.push(foldLine(organizerLine))
  }

  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}
