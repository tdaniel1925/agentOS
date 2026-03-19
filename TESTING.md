# Testing Guide

## Test Infrastructure

- **Playwright**: E2E tests for API routes and full flows
- **Vitest**: Unit tests for individual functions

## Test Results Summary

### Current Status: ✅ 4 PASSED, ❌ 9 FAILED, ⏭️ 14 SKIPPED

**Passing Tests (4):**
- ✅ Greeting format validation - business name required
- ✅ Greeting format validation - receptionist prompt format
- ✅ Greeting format validation - includes "ANSWERING" keyword
- ✅ Greeting format validation - end call message format

**Failing Tests (9) - All due to dev server not running:**
- ❌ Calendar booking via SMS
- ❌ Check calendar availability
- ❌ Cancel appointment
- ❌ Detect conflicting appointments
- ❌ Handle invalid date format
- ❌ Cron auth requirement
- ❌ Cron statistics
- ❌ Cron POST method
- ❌ Cron timeout

**Skipped Tests (14) - Require live APIs/database:**
- ⏭️ VAPI assistant creation tests (need VAPI_API_KEY)
- ⏭️ Time-based reminder tests (need test appointments)
- ⏭️ Email invite tests (need Resend mocking)

## Running Tests

### Option 1: Manual Dev Server (Recommended)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run E2E tests
npm run test:e2e
```

### Option 2: Playwright Auto-Start (Not Working on Windows)

The `webServer` config in `playwright.config.ts` doesn't work on Windows due to the `set` command in npm scripts.

```bash
# This will fail on Windows:
npm run test:e2e
```

**Fix needed**: Update `package.json` dev script to use cross-platform env vars or disable `webServer` in playwright config.

## Test Files

### E2E Tests (`tests/e2e/`)

**`calendar-booking.spec.ts`**
- Tests SMS-based appointment booking
- Tests calendar availability checking
- Tests appointment cancellation
- Tests conflict detection

**`reminder-cron.spec.ts`**
- Tests cron job authentication
- Tests reminder statistics
- Tests time windows (24h, 1h, 15m)
- Tests duplicate prevention

**`phone-provisioning.spec.ts`**
- Tests VAPI assistant creation
- Tests greeting message format
- Tests receptionist vs. caller tone

## Environment Variables for Testing

```
# Required for E2E tests
NEXT_PUBLIC_APP_URL=http://localhost:4000
TEST_SUBSCRIBER_ID=test-subscriber-uuid
TEST_EMAIL=test@example.com
TEST_PHONE=+12815058290

# Required for cron tests
CRON_SECRET=your-test-secret

# Required for VAPI tests (currently skipped)
VAPI_API_KEY=your-vapi-key

# Required for Twilio webhook tests
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_ACCOUNT_SID=your-account-sid

# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Known Issues

### Issue 1: Dev Server Not Auto-Starting
**Problem**: Playwright `webServer` doesn't work with Windows `set` command in npm scripts
**Workaround**: Start dev server manually in separate terminal

### Issue 2: API Tests Need Live Database
**Problem**: Tests hit real Supabase database
**Solution**: Add `TEST_SUBSCRIBER_ID` env var pointing to test subscriber

### Issue 3: Time-Sensitive Tests Skipped
**Problem**: Reminder tests need appointments at exact times (24h, 1h, 15m away)
**Solution**: Create test data setup script or mock Date.now()

## Next Steps for Full Test Coverage

1. **Fix webServer on Windows**
   - Use cross-env package
   - Or update playwright config to disable webServer

2. **Add test database**
   - Use Supabase local development
   - Or add test subscriber fixture

3. **Mock external APIs**
   - Mock VAPI responses
   - Mock Twilio webhooks
   - Mock Resend email sending

4. **Add unit tests**
   - Test CalDAV reader
   - Test ICS generator
   - Test reminder time window logic
   - Test date parsing

5. **Add integration tests**
   - Test full SMS → parse → execute → respond flow
   - Test full reminder → check → send → mark flow

## Running Specific Tests

```bash
# Run only calendar tests
npx playwright test calendar-booking

# Run only cron tests
npx playwright test reminder-cron

# Run with UI
npm run test:e2e:ui

# Run specific test
npx playwright test -g "validates business name"
```

## CI/CD Integration

For GitHub Actions or Vercel:

```yaml
- name: Run E2E tests
  run: |
    npm run dev &
    sleep 10
    npm run test:e2e
  env:
    NEXT_PUBLIC_APP_URL: http://localhost:4000
    CRON_SECRET: ${{ secrets.CRON_SECRET }}
    TEST_SUBSCRIBER_ID: ${{ secrets.TEST_SUBSCRIBER_ID }}
```
