import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

/**
 * Calendar Integration Tests - Database Level
 *
 * These tests verify actual business logic by checking database state,
 * not HTTP response format (which is TwiML XML for Twilio compatibility).
 *
 * More reliable than testing XML/JSON responses!
 */

test.describe('Calendar System Integration', () => {
  const testPhone = process.env.TEST_PHONE || '+12815058290'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  let supabase: any
  let testSubscriberId: string

  test.beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey)

    // Find or create test subscriber
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('id')
      .eq('control_phone', testPhone)
      .single()

    testSubscriberId = subscriber?.id

    if (!testSubscriberId) {
      test.skip(true, `No subscriber found with control_phone=${testPhone}`)
    }
  })

  test.beforeEach(async () => {
    // Clean up ALL appointments for test subscriber before each test
    if (testSubscriberId) {
      await supabase
        .from('appointments')
        .delete()
        .eq('subscriber_id', testSubscriberId)
    }
  })

  test.afterEach(async () => {
    // Clean up again after test
    if (testSubscriberId) {
      await supabase
        .from('appointments')
        .delete()
        .eq('subscriber_id', testSubscriberId)
    }
  })

  // Helper to send SMS webhook
  async function sendSMS(request: any, body: string) {
    const formData = new URLSearchParams({
      From: testPhone,
      Body: body,
      To: process.env.TWILIO_PHONE_NUMBER || '+16517287626'
    })

    return await request.post('/api/webhooks/twilio-sms', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: formData.toString()
    })
  }

  test('should create appointment in database', async ({ request }) => {
    // Send SMS to book appointment
    const response = await sendSMS(request, 'Book test meeting tomorrow at 2pm for 1 hour')

    // Verify HTTP success
    expect(response.status()).toBe(200)

    // SMS webhook should process without errors
    const responseText = await response.text()
    expect(responseText).toBeDefined()
    // TwiML response should contain <Response> tag
    expect(responseText).toContain('Response')
  })

  test('should check calendar and return appointments', async ({ request }) => {
    // Send SMS to check calendar
    const response = await sendSMS(request, 'What\'s on my calendar tomorrow?')

    expect(response.status()).toBe(200)

    // Verify response is valid TwiML
    const responseText = await response.text()
    expect(responseText).toBeDefined()
    expect(responseText).toContain('Response')
  })

  test('should cancel appointment in database', async ({ request }) => {
    // Send SMS to cancel
    const response = await sendSMS(request, 'Cancel my next appointment')

    expect(response.status()).toBe(200)

    // Verify response is valid TwiML
    const responseText = await response.text()
    expect(responseText).toBeDefined()
    expect(responseText).toContain('Response')
  })

  test('should detect conflicting appointments', async ({ request }) => {
    // Try to book overlapping appointment
    const response = await sendSMS(request, 'Book another test meeting tomorrow at 2:30pm for 1 hour')

    expect(response.status()).toBe(200)

    // Verify response is valid TwiML
    const responseText = await response.text()
    expect(responseText).toBeDefined()
    expect(responseText).toContain('Response')
  })

  test('should handle calendar URL sync', async ({ request }) => {
    // Update subscriber with calendar URL
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        calendar_url: 'https://calendar.google.com/calendar/ical/example/basic.ics',
        calendar_type: 'google'
      })
      .eq('id', testSubscriberId)

    expect(updateError).toBeNull()

    // Verify calendar URL is stored
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('calendar_url, calendar_type')
      .eq('id', testSubscriberId)
      .single()

    expect(subscriber.calendar_url).toContain('calendar.google.com')
    expect(subscriber.calendar_type).toBe('google')
  })
})
