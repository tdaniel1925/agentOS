/**
 * Microsoft OAuth & Graph API Integration
 *
 * Handles:
 * - OAuth 2.0 flow for Microsoft/Outlook accounts
 * - Reading emails via Microsoft Graph API
 * - Sending emails
 * - Reading calendar events
 * - Creating calendar events
 * - Token refresh
 */

import crypto from 'crypto'

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI!

// Encryption key from environment (use a strong secret!)
const ENCRYPTION_KEY = process.env.EMAIL_TOKEN_ENCRYPTION_KEY || 'change-this-to-a-strong-32-char-key!'

// =============================================
// OAUTH FLOW
// =============================================

/**
 * Generate Microsoft OAuth authorization URL
 */
export function getMicrosoftAuthUrl(state: string): string {
  const scopes = [
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/Calendars.Read',
    'https://graph.microsoft.com/Calendars.ReadWrite',
    'https://graph.microsoft.com/User.Read',
    'offline_access' // Required for refresh tokens
  ]

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: MICROSOFT_REDIRECT_URI,
    response_mode: 'query',
    scope: scopes.join(' '),
    state: state
  })

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeMicrosoftCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  email?: string
}> {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    code: code,
    redirect_uri: MICROSOFT_REDIRECT_URI,
    grant_type: 'authorization_code'
  })

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Microsoft token exchange failed: ${error}`)
  }

  const data = await response.json()

  // Get user's email address
  const userInfo = await getMicrosoftUserInfo(data.access_token)

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    email: userInfo.email
  }
}

/**
 * Refresh expired access token
 */
export async function refreshMicrosoftToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  })

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Microsoft token refresh failed: ${error}`)
  }

  return await response.json()
}

// =============================================
// MICROSOFT GRAPH API
// =============================================

/**
 * Get user info from Microsoft Graph
 */
async function getMicrosoftUserInfo(accessToken: string): Promise<{
  email: string
  displayName: string
}> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to get Microsoft user info')
  }

  const data = await response.json()
  return {
    email: data.mail || data.userPrincipalName,
    displayName: data.displayName
  }
}

/**
 * Get unread emails from inbox
 */
export async function getMicrosoftUnreadEmails(accessToken: string, limit: number = 10): Promise<any[]> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$filter=isRead eq false&$top=${limit}&$select=subject,from,receivedDateTime,bodyPreview`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Microsoft emails')
  }

  const data = await response.json()
  return data.value || []
}

/**
 * Send email via Microsoft Graph
 */
export async function sendMicrosoftEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const message = {
    message: {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: body
      },
      toRecipients: [
        {
          emailAddress: {
            address: to
          }
        }
      ]
    }
  }

  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send Microsoft email: ${error}`)
  }
}

// =============================================
// CALENDAR API
// =============================================

export interface CalendarEvent {
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

/**
 * Get calendar events for a date range
 * Default: next 7 days
 */
export async function getMicrosoftCalendarEvents(
  accessToken: string,
  startDate?: Date,
  endDate?: Date
): Promise<CalendarEvent[]> {
  const start = startDate || new Date()
  const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

  const startISO = start.toISOString()
  const endISO = end.toISOString()

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startISO}&endDateTime=${endISO}&$orderby=start/dateTime&$top=50`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'outlook.timezone="UTC"'
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch calendar events: ${error}`)
  }

  const data = await response.json()
  return data.value || []
}

/**
 * Get today's calendar events
 */
export async function getTodayCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return getMicrosoftCalendarEvents(accessToken, today, tomorrow)
}

/**
 * Get this week's calendar events
 */
export async function getWeekCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(today)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  return getMicrosoftCalendarEvents(accessToken, today, endOfWeek)
}

/**
 * Create a new calendar event
 */
export async function createMicrosoftCalendarEvent(
  accessToken: string,
  eventData: {
    subject: string
    start: Date
    end: Date
    location?: string
    attendees?: string[] // Email addresses
    body?: string
    isAllDay?: boolean
  }
): Promise<CalendarEvent> {
  const event = {
    subject: eventData.subject,
    start: {
      dateTime: eventData.start.toISOString(),
      timeZone: 'UTC'
    },
    end: {
      dateTime: eventData.end.toISOString(),
      timeZone: 'UTC'
    },
    isAllDay: eventData.isAllDay || false,
    ...(eventData.location && {
      location: {
        displayName: eventData.location
      }
    }),
    ...(eventData.attendees && {
      attendees: eventData.attendees.map(email => ({
        emailAddress: {
          address: email
        },
        type: 'required'
      }))
    }),
    ...(eventData.body && {
      body: {
        contentType: 'HTML',
        content: eventData.body
      }
    })
  }

  const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create calendar event: ${error}`)
  }

  return await response.json()
}

// =============================================
// TOKEN ENCRYPTION
// =============================================

/**
 * Encrypt token for storage
 */
export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Decrypt token from storage
 */
export function decryptToken(encryptedToken: string): string {
  const [ivHex, encrypted] = encryptedToken.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
