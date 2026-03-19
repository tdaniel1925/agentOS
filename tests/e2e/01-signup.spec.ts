import { test, expect } from '@playwright/test'
import { getTestEnvironment } from '../config/test-env'

/**
 * Test: User Signup and Onboarding
 * Verifies complete signup flow and initial dashboard access
 */

test.describe('User Signup Flow', () => {
  const env = getTestEnvironment()
  const timestamp = Date.now()
  const testUser = {
    email: `e2e-test-${timestamp}@test.com`,
    password: 'TestPassword123!',
    businessName: `TEST Business ${timestamp}`,
    phone: '+15555551111',
  }

  test('should complete signup and reach dashboard', async ({ page }) => {
    // Navigate to signup
    await page.goto(`${env.baseUrl}/signup-v2`)
    
    // Fill signup form
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.fill('input[name="businessName"]', testUser.businessName)
    await page.fill('input[name="phone"]', testUser.phone)
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await page.waitForURL(/\/app/)
    
    // Verify dashboard loaded
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Verify Email Forwarding Card is visible
    await expect(page.locator('text=Your Jordyn Email')).toBeVisible()
    
    // Verify unique email address was assigned
    const emailAddress = await page.locator('text=u-').textContent()
    expect(emailAddress).toMatch(/u-[a-z0-9]{8}@mail\.jordyn\.app/)
  })

  test('should display privacy features', async ({ page }) => {
    await page.goto(`${env.baseUrl}/`)
    
    // Verify privacy badges
    await expect(page.locator('text=Privacy-First AI Assistant')).toBeVisible()
    await expect(page.locator('text=60-second deletion')).toBeVisible()
    await expect(page.locator('text=Read-only access')).toBeVisible()
  })

  test('should show 9 feature cards in grid', async ({ page }) => {
    await page.goto(`${env.baseUrl}/`)
    
    // Verify feature section
    const featureCards = page.locator('.card-gradient')
    await expect(featureCards).toHaveCount(9) // 3x3 grid
  })
})
