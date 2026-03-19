/**
 * Comprehensive System Test Suite
 * Tests all critical paths end-to-end
 */

const BASE_URL = process.env.TEST_BASE_URL || 'https://jordyn.app'
const TEST_PHONE = '+18148006032'
const TWILIO_PHONE = '+16517287626'

const results = {
  passed: [],
  failed: [],
  warnings: []
}

function log(emoji, message) {
  console.log(`${emoji} ${message}`)
}

async function testSMSWebhook() {
  log('📱', 'Testing SMS Webhook...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/twilio-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        From: TEST_PHONE,
        To: TWILIO_PHONE,
        Body: 'STATUS',
        MessageSid: 'TEST_' + Date.now()
      })
    })
    
    if (response.ok) {
      const text = await response.text()
      if (text.includes('Response') || text.includes('Message')) {
        results.passed.push('SMS Webhook: Responds correctly')
        log('✅', 'SMS webhook is working')
        return true
      }
    }
    
    results.failed.push('SMS Webhook: Invalid response')
    log('❌', 'SMS webhook failed')
    return false
  } catch (error) {
    results.failed.push('SMS Webhook: ' + error.message)
    log('❌', 'SMS webhook error: ' + error.message)
    return false
  }
}

async function testEmailWebhook() {
  log('📧', 'Testing Email Webhook...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/postmark-inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        From: 'test@example.com',
        FromName: 'Test User',
        To: 'u-test1234@mail.jordyn.app',
        Subject: 'Test Email',
        TextBody: 'This is a test email',
        MessageID: 'test-' + Date.now()
      })
    })
    
    if (response.ok) {
      results.passed.push('Email Webhook: Processing emails')
      log('✅', 'Email webhook is working')
      return true
    } else {
      results.warnings.push('Email Webhook: Returned ' + response.status)
      log('⚠️', 'Email webhook returned ' + response.status)
      return false
    }
  } catch (error) {
    results.failed.push('Email Webhook: ' + error.message)
    log('❌', 'Email webhook error: ' + error.message)
    return false
  }
}

async function testVAPIWebhook() {
  log('☎️', 'Testing VAPI Webhook...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/vapi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'end-of-call-report',
        call: {
          id: 'test-call-' + Date.now(),
          type: 'inboundPhoneCall',
          status: 'ended'
        },
        transcript: 'Test call transcript',
        summary: 'Customer called to book appointment'
      })
    })
    
    if (response.ok) {
      results.passed.push('VAPI Webhook: Processing calls')
      log('✅', 'VAPI webhook is working')
      return true
    } else {
      results.warnings.push('VAPI Webhook: Returned ' + response.status)
      log('⚠️', 'VAPI webhook returned ' + response.status)
      return false
    }
  } catch (error) {
    results.failed.push('VAPI Webhook: ' + error.message)
    log('❌', 'VAPI webhook error: ' + error.message)
    return false
  }
}

async function testLandingPage() {
  log('🏠', 'Testing Landing Page...')
  
  try {
    const response = await fetch(BASE_URL)
    const html = await response.text()
    
    const checks = [
      { test: html.includes('Privacy-First'), name: 'Privacy badge visible' },
      { test: html.includes('60-second deletion'), name: 'Email feature shown' },
      { test: html.includes('Read-only'), name: 'Calendar privacy shown' },
      { test: html.includes('$97'), name: 'Pricing displayed' }
    ]
    
    let allPassed = true
    for (const check of checks) {
      if (check.test) {
        results.passed.push('Landing Page: ' + check.name)
      } else {
        results.failed.push('Landing Page: ' + check.name + ' missing')
        allPassed = false
      }
    }
    
    if (allPassed) {
      log('✅', 'Landing page looks good')
      return true
    } else {
      log('⚠️', 'Landing page has issues')
      return false
    }
  } catch (error) {
    results.failed.push('Landing Page: ' + error.message)
    log('❌', 'Landing page error: ' + error.message)
    return false
  }
}

async function testSignupPage() {
  log('📝', 'Testing Signup Page...')
  
  try {
    const response = await fetch(BASE_URL + '/signup-v2')
    
    if (response.ok) {
      results.passed.push('Signup Page: Accessible')
      log('✅', 'Signup page is accessible')
      return true
    } else {
      results.failed.push('Signup Page: Not accessible')
      log('❌', 'Signup page failed')
      return false
    }
  } catch (error) {
    results.failed.push('Signup Page: ' + error.message)
    log('❌', 'Signup page error: ' + error.message)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive System Tests\n')
  console.log('Testing against:', BASE_URL)
  console.log('Test phone:', TEST_PHONE)
  console.log('─'.repeat(50) + '\n')
  
  await testLandingPage()
  await testSignupPage()
  await testSMSWebhook()
  await testEmailWebhook()
  await testVAPIWebhook()
  
  console.log('\n' + '═'.repeat(50))
  console.log('📊 TEST RESULTS')
  console.log('═'.repeat(50) + '\n')
  
  console.log(`✅ PASSED: ${results.passed.length}`)
  results.passed.forEach(r => console.log('  ✓', r))
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS: ${results.warnings.length}`)
    results.warnings.forEach(r => console.log('  !', r))
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED: ${results.failed.length}`)
    results.failed.forEach(r => console.log('  ✗', r))
  }
  
  console.log('\n' + '═'.repeat(50))
  
  const totalTests = results.passed.length + results.failed.length + results.warnings.length
  const successRate = Math.round((results.passed.length / totalTests) * 100)
  
  console.log(`\n🎯 Success Rate: ${successRate}%`)
  console.log(`   ${results.passed.length}/${totalTests} tests passed\n`)
  
  if (results.failed.length === 0) {
    console.log('🎉 All critical tests passed!')
  } else {
    console.log('⚠️  Some tests failed - review above')
  }
}

runAllTests().catch(console.error)
