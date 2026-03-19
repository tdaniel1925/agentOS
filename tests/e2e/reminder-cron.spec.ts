import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Appointment Reminder Cron Job
 * Tests the automated SMS reminder system
 */

test.describe('Appointment Reminder Cron Job', () => {
  const cronSecret = process.env.CRON_SECRET

  test('should allow access in test mode', async ({ request }) => {
    // In test mode (NODE_ENV='test'), auth is skipped
    const response = await request.get('/api/cron/appointment-reminders')

    // Should work without auth in test mode
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.timestamp).toBeDefined()
  })

  test('should work in test mode without auth', async ({ request }) => {
    // In test mode, auth is skipped regardless of CRON_SECRET
    const response = await request.get('/api/cron/appointment-reminders')

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.timestamp).toBeDefined()
    expect(data.processed).toBeGreaterThanOrEqual(0)
    expect(data.sent).toBeGreaterThanOrEqual(0)
    expect(data.errors).toBeGreaterThanOrEqual(0)
  })

  test('should return reminder statistics', async ({ request }) => {
    const response = await request.get('/api/cron/appointment-reminders')

    expect(response.status()).toBe(200)
    const data = await response.json()

    // Verify response structure
    expect(data).toHaveProperty('success')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('duration')
    expect(data).toHaveProperty('processed')
    expect(data).toHaveProperty('sent')
    expect(data).toHaveProperty('errors')

    // Verify types
    expect(typeof data.success).toBe('boolean')
    expect(typeof data.processed).toBe('number')
    expect(typeof data.sent).toBe('number')
    expect(typeof data.errors).toBe('number')
    expect(typeof data.duration).toBe('number')
  })

  test('should support POST method', async ({ request }) => {
    const response = await request.post('/api/cron/appointment-reminders')

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  test('should complete within timeout', async ({ request }) => {
    const startTime = Date.now()
    const response = await request.get('/api/cron/appointment-reminders', {
      timeout: 60000 // 60 second max duration
    })
    const duration = Date.now() - startTime

    expect(response.status()).toBe(200)
    expect(duration).toBeLessThan(60000) // Should complete within max duration
  })
})

test.describe('Reminder Logic', () => {
  test('should return statistics without errors', async ({ request }) => {
    // Basic test: Ensure cron runs and returns valid statistics
    const response = await request.get('/api/cron/appointment-reminders')

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.processed).toBeGreaterThanOrEqual(0)
    expect(data.sent).toBeGreaterThanOrEqual(0)
    expect(data.errors).toBeGreaterThanOrEqual(0)
  })

  test('should complete within reasonable time', async ({ request }) => {
    const startTime = Date.now()
    const response = await request.get('/api/cron/appointment-reminders')
    const duration = Date.now() - startTime

    expect(response.status()).toBe(200)
    expect(duration).toBeLessThan(30000) // Should complete within 30s
  })

  test('should return consistent response structure', async ({ request }) => {
    const response = await request.get('/api/cron/appointment-reminders')
    const data = await response.json()

    // Verify all required fields exist
    expect(data).toHaveProperty('success')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('duration')
    expect(data).toHaveProperty('processed')
    expect(data).toHaveProperty('sent')
    expect(data).toHaveProperty('errors')
  })
})

test.describe('Reminder Time Windows', () => {
  test('should handle multiple cron runs without errors', async ({ request }) => {
    // Run cron multiple times to verify stability
    const runs = []
    for (let i = 0; i < 3; i++) {
      const response = await request.get('/api/cron/appointment-reminders')
      expect(response.status()).toBe(200)
      const data = await response.json()
      runs.push(data)
    }

    // All runs should succeed
    expect(runs.every(r => r.success === true)).toBe(true)
  })

  test('should return valid metrics on empty calendar', async ({ request }) => {
    // Even with no appointments, cron should complete successfully
    const response = await request.get('/api/cron/appointment-reminders')
    const data = await response.json()

    expect(response.status()).toBe(200)
    expect(data.success).toBe(true)
    expect(data.processed).toBeGreaterThanOrEqual(0)
    expect(data.sent).toBeGreaterThanOrEqual(0)
  })
})
