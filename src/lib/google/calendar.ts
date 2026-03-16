/**
 * Google Calendar Integration
 * Handles OAuth and calendar event creation
 */

import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]

/**
 * Get OAuth2 client
 */
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(subscriberId: string) {
  const oauth2Client = getOAuth2Client()

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: subscriberId, // Pass subscriber ID to retrieve after OAuth
    prompt: 'consent', // Force consent to get refresh token
  })

  return url
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

/**
 * Get authenticated calendar client for subscriber
 */
export async function getCalendarClient(subscriberId: string) {
  const supabase = await createClient()

  // Get subscriber's tokens
  const result: any = await (supabase as any)
    .from('subscribers')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', subscriberId)
    .single()

  const subscriber = result.data

  if (!subscriber?.google_refresh_token) {
    throw new Error('Google Calendar not connected')
  }

  const oauth2Client = getOAuth2Client()

  // Check if token is expired
  const now = new Date()
  const expiry = subscriber.google_token_expiry ? new Date(subscriber.google_token_expiry) : null

  if (!expiry || now >= expiry) {
    // Refresh token
    const newTokens = await refreshAccessToken(subscriber.google_refresh_token)

    // Update tokens in database
    await (supabase as any)
      .from('subscribers')
      .update({
        google_access_token: newTokens.access_token,
        google_token_expiry: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null,
      })
      .eq('id', subscriberId)

    oauth2Client.setCredentials(newTokens)
  } else {
    // Use existing access token
    oauth2Client.setCredentials({
      access_token: subscriber.google_access_token,
      refresh_token: subscriber.google_refresh_token,
    })
  }

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  subscriberId: string,
  event: {
    summary: string
    description?: string
    startTime: Date
    endTime: Date
    attendees?: string[]
    location?: string
  }
) {
  const calendar = await getCalendarClient(subscriberId)

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'America/Chicago', // TODO: Make this configurable per subscriber
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: 'America/Chicago',
      },
      attendees: event.attendees?.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    },
  })

  return response.data
}

/**
 * List upcoming calendar events
 */
export async function listUpcomingEvents(subscriberId: string, maxResults: number = 10) {
  const calendar = await getCalendarClient(subscriberId)

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  })

  return response.data.items || []
}

/**
 * Check if subscriber has Google Calendar connected
 */
export async function isCalendarConnected(subscriberId: string): Promise<boolean> {
  const supabase = await createClient()

  const result: any = await (supabase as any)
    .from('subscribers')
    .select('google_calendar_connected')
    .eq('id', subscriberId)
    .single()

  return result.data?.google_calendar_connected || false
}
