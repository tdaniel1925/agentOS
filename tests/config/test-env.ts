/**
 * Test Environment Configuration
 * Supports testing against development, staging, and production
 */

export const TEST_ENVIRONMENTS = {
  development: {
    baseUrl: 'http://localhost:4000',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Use dedicated test phone number
    testPhoneNumber: process.env.TEST_PHONE_NUMBER || '+15555551234',
    testEmail: 'test@jordyn.app',
    // Test user credentials
    testUser: {
      email: 'e2e-test@test.com',
      password: 'TestPassword123!',
      businessName: 'E2E Test Business',
    },
  },
  production: {
    baseUrl: 'https://jordyn.app',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Dedicated production test number
    testPhoneNumber: process.env.PROD_TEST_PHONE_NUMBER || '+15555559999',
    testEmail: 'prod-test@jordyn.app',
    // Production test user
    testUser: {
      email: 'prod-e2e-test@test.com',
      password: 'ProdTestPassword123!',
      businessName: 'Production Test Business',
    },
  },
}

export const getTestEnvironment = () => {
  const env = process.env.TEST_ENV || 'development'
  return TEST_ENVIRONMENTS[env as keyof typeof TEST_ENVIRONMENTS]
}

// Test data identifiers (for cleanup)
export const TEST_IDENTIFIERS = {
  userPrefix: 'e2e-test-',
  businessPrefix: 'TEST-',
  emailPrefix: 'test-',
}

// Safe production testing rules
export const PRODUCTION_SAFETY_CHECKS = {
  // Never delete real users
  requireTestPrefix: true,
  // Only test with dedicated test numbers
  restrictedPhoneNumbers: ['+15555559999'],
  // Auto-cleanup test data after 1 hour
  autoCleanupMinutes: 60,
}
