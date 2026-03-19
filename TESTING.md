# Jordyn Testing Guide

## Overview
Comprehensive testing suite for the Jordyn platform covering E2E flows, API endpoints, SMS, calls, email, and calendar.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Test Environment
Create `.env.test` file:
```bash
# Test Environment
TEST_ENV=development  # or 'production' for prod testing
TEST_BASE_URL=http://localhost:4000  # or https://jordyn.app

# Test Credentials
TEST_PHONE_NUMBER=+15555551234
TEST_EMAIL=test@jordyn.app
PROD_TEST_PHONE_NUMBER=+15555559999  # Dedicated prod test number

# Twilio Test Credentials (for webhook testing)
TEST_TWILIO_NUMBER=+16517287626
```

## Running Tests

### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/01-signup.spec.ts

# Run against production (use with caution!)
TEST_ENV=production npm run test:e2e
```

### API Tests (Vitest)
```bash
# Run all unit/API tests
npm test

# Run in watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Run specific test
npm test tests/api/twilio-sms.test.ts
```

## Test Structure

```
tests/
├── e2e/                    # End-to-end Playwright tests
│   ├── 01-signup.spec.ts          # User signup flow
│   ├── 02-sms-commands.spec.ts    # SMS command testing
│   ├── 03-email-forwarding.spec.ts # Email ephemeral processing
│   ├── 04-calendar.spec.ts         # Calendar integration
│   └── 05-vapi-calls.spec.ts      # Voice call testing
├── api/                    # API endpoint tests
│   ├── twilio-sms.test.ts         # Twilio SMS webhook
│   ├── postmark-email.test.ts     # Postmark inbound email
│   └── vapi-webhook.test.ts       # VAPI call webhook
├── helpers/                # Test utilities
│   ├── twilio-helper.ts           # Twilio test helpers
│   ├── email-helper.ts            # Email testing utilities
│   └── cleanup.ts                 # Test data cleanup
├── fixtures/               # Test data
│   ├── test-users.json
│   └── sample-emails.json
└── config/                 # Test configuration
    └── test-env.ts                # Environment setup
```

## Test Scenarios

### 1. User Signup & Onboarding
- ✅ Complete signup flow
- ✅ Dashboard loads with unique email address
- ✅ Privacy features displayed
- ✅ 9 feature cards in 3x3 grid

### 2. SMS Commands
- ✅ STATUS command
- ✅ CALL command (outbound)
- ✅ HELP command
- ✅ Unknown command handling
- ✅ Command logging

### 3. Email Forwarding
- ✅ Receive forwarded email
- ✅ Claude analysis triggers
- ✅ SMS summary sent
- ✅ Email deleted after 60 seconds
- ✅ Only metadata stored

### 4. Calendar Integration
- ✅ iCal feed parsing
- ✅ Availability checking
- ✅ Read-only access (no OAuth)
- ✅ Timezone handling

### 5. Voice Calls (VAPI)
- ✅ Inbound call answered
- ✅ Appointment booking conversation
- ✅ Call summary generated
- ✅ SMS notification sent

## Production Testing Safety

### Safe Testing Practices
1. **Use Dedicated Test Numbers**: Never use real customer numbers
2. **Test User Prefix**: All test users start with `e2e-test-` or `prod-test-`
3. **Auto-Cleanup**: Test data auto-deleted after 1 hour
4. **Read-Only When Possible**: Most prod tests are read-only
5. **Isolated Test Data**: Tests never touch real user data

### Production Test Checklist
- [ ] Created dedicated test phone number in Twilio
- [ ] Set up test user account with `prod-test-` prefix
- [ ] Verified test data cleanup is working
- [ ] Confirmed tests only use test identifiers
- [ ] Reviewed test logs for any real user interaction

## Manual Testing Checklist

### SMS Testing
```bash
# Send test SMS to Jordyn's number
# From your test phone: +15555551234
# To: +16517287626
# Message: STATUS

# Expected response: Current system status
```

### Email Testing
```bash
# Forward an email to your unique Jordyn address
# To: u-abc12345@mail.jordyn.app
# Subject: Test Email
# Body: This is a test

# Expected: SMS summary within 5 seconds
# Expected: Email deleted from DB within 60 seconds
```

### Call Testing
```bash
# Call Jordyn's number from test phone
# Number: +16517287626

# Expected: AI answers within 2 rings
# Expected: Natural conversation flow
# Expected: SMS summary after call ends
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          TEST_ENV: production
          TEST_PHONE_NUMBER: ${{ secrets.TEST_PHONE_NUMBER }}
```

## Debugging Tests

### View Test Reports
```bash
# After running E2E tests
npx playwright show-report

# View screenshots of failures
ls -la test-results/
```

### Enable Debug Mode
```bash
# Playwright debug mode
DEBUG=pw:api npm run test:e2e

# Vitest debug mode
npm test -- --reporter=verbose
```

## Troubleshooting

### Common Issues

**Test fails: "Phone number not found"**
- Ensure TEST_PHONE_NUMBER is set in .env.test
- Verify phone number exists in subscribers table

**Email test fails: "Email not received"**
- Check Postmark webhook is configured
- Verify MX record points to inbound.postmarkapp.com
- Confirm POSTMARK_API_KEY is valid

**Call test fails: "VAPI webhook not responding"**
- Verify VAPI_WEBHOOK_SECRET is correct
- Check VAPI assistant is configured
- Ensure webhook URL is accessible

## Coverage Goals

- [ ] E2E Coverage: >80%
- [ ] API Coverage: >90%
- [ ] Critical Paths: 100%

## Next Steps

1. **Set up CI/CD**: Automate tests on every PR
2. **Add Performance Tests**: Load testing for webhooks
3. **Expand Email Tests**: Test different email providers
4. **Calendar Edge Cases**: Test various calendar formats
5. **Security Tests**: Test authentication and authorization
