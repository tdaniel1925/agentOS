import '@testing-library/jest-dom'
import { beforeAll, afterAll } from 'vitest'

/**
 * Global Test Setup
 * Runs before all tests
 */

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_APP_URL = process.env.TEST_BASE_URL || 'http://localhost:4000'
})

afterAll(async () => {
  // Cleanup test data
  console.log('✓ Tests completed')
})
