import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Calendar Booking System
 * Tests the full flow of booking, checking, and canceling appointments
 */

test.describe('Calendar Booking Flow', () => {
  const testSubscriberId = process.env.TEST_SUBSCRIBER_ID || 'test-subscriber'
  const testEmail = process.env.TEST_EMAIL || 'test@example.com'
  const testPhone = process.env.TEST_PHONE || '+12815058290'

  test.skip(!testSubscriberId || !testEmail, 'Requires TEST_SUBSCRIBER_ID and TEST_EMAIL env vars')

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

  test('should create appointment via SMS command', async ({ request }) => {
    // Simulate SMS webhook from Twilio
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    const response = await sendSMS(request, 'Book meeting with John Doe tomorrow at 2pm for 1 hour')

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.message).toContain('Booked')
    expect(data.message).toContain('John Doe')
  })

  test('should check calendar availability', async ({ request }) => {
    const response = await sendSMS(request, 'What\'s on my calendar today?')

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.message).toBeDefined()
  })

  test('should cancel appointment', async ({ request }) => {
    // First create an appointment
    const createResponse = await sendSMS(request, 'Book test appointment tomorrow at 3pm')

    expect(createResponse.status()).toBe(200)

    // Then cancel it
    const cancelResponse = await sendSMS(request, 'Cancel my next appointment')

    expect(cancelResponse.status()).toBe(200)
    const cancelData = await cancelResponse.json()
    expect(cancelData.success).toBe(true)
    expect(cancelData.message).toContain('Cancelled')
  })

  test('should detect conflicting appointments', async ({ request }) => {
    // Create first appointment
    await sendSMS(request, 'Book meeting tomorrow at 2pm for 1 hour')

    // Try to create overlapping appointment
    const conflictResponse = await sendSMS(request, 'Book another meeting tomorrow at 2:30pm for 1 hour')

    expect(conflictResponse.status()).toBe(200)
    const data = await conflictResponse.json()
    expect(data.message).toContain('already have something scheduled')
  })

  test('should handle invalid date format gracefully', async ({ request }) => {
    const response = await sendSMS(request, 'Book meeting on invalid-date at 2pm')

    expect(response.status()).toBe(200)
    const data = await response.json()
    // Should still respond gracefully, not crash
    expect(data).toBeDefined()
  })
})

test.describe('Calendar Email Invites', () => {
  test('should send .ics file attachment', async ({ request }) => {
    // This would require mocking Resend or checking actual email
    // For now, verify the appointment creation includes ics_sent flag
    test.skip(true, 'Requires email service mocking')
  })
})
