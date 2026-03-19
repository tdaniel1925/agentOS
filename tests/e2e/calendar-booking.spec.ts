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

  test('should create appointment via SMS command', async ({ request }) => {
    // Simulate SMS webhook from Twilio
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    const response = await request.post('/api/webhooks/sms', {
      data: {
        From: testPhone,
        Body: `Book meeting with John Doe tomorrow at 2pm for 1 hour`,
        To: process.env.TWILIO_PHONE_NUMBER
      }
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.message).toContain('Booked')
    expect(data.message).toContain('John Doe')
  })

  test('should check calendar availability', async ({ request }) => {
    const response = await request.post('/api/webhooks/sms', {
      data: {
        From: testPhone,
        Body: 'What\'s on my calendar today?',
        To: process.env.TWILIO_PHONE_NUMBER
      }
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.message).toBeDefined()
  })

  test('should cancel appointment', async ({ request }) => {
    // First create an appointment
    const createResponse = await request.post('/api/webhooks/sms', {
      data: {
        From: testPhone,
        Body: 'Book test appointment tomorrow at 3pm',
        To: process.env.TWILIO_PHONE_NUMBER
      }
    })

    expect(createResponse.status()).toBe(200)

    // Then cancel it
    const cancelResponse = await request.post('/api/webhooks/sms', {
      data: {
        From: testPhone,
        Body: 'Cancel my next appointment',
        To: process.env.TWILIO_PHONE_NUMBER
      }
    })

    expect(cancelResponse.status()).toBe(200)
    const cancelData = await cancelResponse.json()
    expect(cancelData.success).toBe(true)
    expect(cancelData.message).toContain('Cancelled')
  })

  test('should detect conflicting appointments', async ({ request }) => {
    // Create first appointment
    await request.post('/api/webhooks/sms', {
      data: {
        From: testPhone,
        Body: 'Book meeting tomorrow at 2pm for 1 hour',
        To: process.env.TWILIO_PHONE_NUMBER
      }
    })

    // Try to create overlapping appointment
    const conflictResponse = await request.post('/api/webhooks/sms', {
      data: {
        From: testPhone,
        Body: 'Book another meeting tomorrow at 2:30pm for 1 hour',
        To: process.env.TWILIO_PHONE_NUMBER
      }
    })

    expect(conflictResponse.status()).toBe(200)
    const data = await conflictResponse.json()
    expect(data.message).toContain('already have something scheduled')
  })

  test('should handle invalid date format gracefully', async ({ request }) => {
    const response = await request.post('/api/webhooks/sms', {
      data: {
        From: testPhone,
        Body: 'Book meeting on invalid-date at 2pm',
        To: process.env.TWILIO_PHONE_NUMBER
      }
    })

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
