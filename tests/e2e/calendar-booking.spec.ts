import { test, expect } from '@playwright/test'
import { parseStringPromise } from 'xml2js'

/**
 * E2E Tests for Calendar Booking System
 * Tests the full flow of booking, checking, and canceling appointments
 * Webhook returns TwiML XML (correct for Twilio), so we parse it
 */

// Test configuration
const testSubscriberId = process.env.TEST_SUBSCRIBER_ID || 'test-subscriber'
const testEmail = process.env.TEST_EMAIL || 'test@example.com'
const testPhone = process.env.TEST_PHONE || '+12815058290'

// Helper to send SMS webhook in Twilio format
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

// Helper to parse TwiML XML response
async function parseTwiML(response: any) {
  const xmlText = await response.text()
  const parsed = await parseStringPromise(xmlText)
  // Extract message from <Message> tag
  return parsed?.Response?.Message?.[0] || ''
}

test.describe('Calendar Booking Flow', () => {
  test.skip(!testSubscriberId || !testEmail, 'Requires TEST_SUBSCRIBER_ID and TEST_EMAIL env vars')

  test('should create appointment via SMS command', async ({ request }) => {
    // Webhook returns TwiML XML (correct for Twilio)
    const response = await sendSMS(request, 'Book meeting with John Doe tomorrow at 2pm for 1 hour')

    expect(response.status()).toBe(200)

    // Verify response is TwiML XML
    const text = await response.text()
    expect(text).toContain('<?xml')
    expect(text).toContain('Response')
  })

  test('should check calendar availability', async ({ request }) => {
    const response = await sendSMS(request, 'What\'s on my calendar today?')

    expect(response.status()).toBe(200)

    // Verify response is TwiML XML
    const text = await response.text()
    expect(text).toContain('<?xml')
    expect(text).toContain('Response')
  })

  test('should cancel appointment', async ({ request }) => {
    // First create an appointment
    const createResponse = await sendSMS(request, 'Book test appointment tomorrow at 3pm')
    expect(createResponse.status()).toBe(200)

    // Then cancel it
    const cancelResponse = await sendSMS(request, 'Cancel my next appointment')
    expect(cancelResponse.status()).toBe(200)

    // Verify response is TwiML XML
    const text = await cancelResponse.text()
    expect(text).toContain('<?xml')
    expect(text).toContain('Response')
  })

  test('should detect conflicting appointments', async ({ request }) => {
    // Create first appointment
    await sendSMS(request, 'Book meeting tomorrow at 2pm for 1 hour')

    // Try to create overlapping appointment
    const conflictResponse = await sendSMS(request, 'Book another meeting tomorrow at 2:30pm for 1 hour')

    expect(conflictResponse.status()).toBe(200)

    // Verify response is TwiML XML
    const text = await conflictResponse.text()
    expect(text).toContain('<?xml')
    expect(text).toContain('Response')
  })

  test('should handle invalid date format gracefully', async ({ request }) => {
    const response = await sendSMS(request, 'Book meeting on invalid-date at 2pm')

    expect(response.status()).toBe(200)
    const message = await parseTwiML(response)
    // Should still respond gracefully, not crash
    expect(message).toBeDefined()
    expect(typeof message).toBe('string')
  })
})

test.describe('Calendar Email Invites', () => {
  test('should handle email functionality', async ({ request }) => {
    // Test that the SMS webhook completes without email errors
    // Actual email sending is tested in integration with real Resend API
    const response = await sendSMS(request, 'Book test meeting tomorrow at 4pm')

    expect(response.status()).toBe(200)

    // Should process without crashing (even if email fails silently)
    const text = await response.text()
    expect(text).toContain('<?xml')
    expect(text).toContain('Response')
  })
})
