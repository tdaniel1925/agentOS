/**
 * Test VAPI phone call creation
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY
const VAPI_ASSISTANT_ID = process.env.VAPI_DEMO_ASSISTANT_ID
const VAPI_PHONE_ID = process.env.VAPI_PHONE_NUMBER_ID
const TEST_PHONE = process.env.TEST_PHONE_NUMBER || '+18148006032'

if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID || !VAPI_PHONE_ID) {
  console.log('❌ Error: Missing VAPI credentials in environment')
  process.exit(1)
}

async function createTestCall() {
  console.log('☎️  Creating test phone call via VAPI...')
  console.log('Calling:', TEST_PHONE)
  console.log('')
  
  try {
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + VAPI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: VAPI_ASSISTANT_ID,
        phoneNumberId: VAPI_PHONE_ID,
        customer: {
          number: TEST_PHONE,
          name: 'Test User'
        }
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Call initiated successfully!')
      console.log('   Call ID:', result.id)
      console.log('   Status:', result.status)
      console.log('')
      console.log('📞 Phone', TEST_PHONE, 'should ring shortly!')
      return true
    } else {
      const error = await response.json()
      console.log('❌ Call failed:', error.message || JSON.stringify(error))
      console.log('')
      console.log('ℹ️  Note: VAPI calls require credits. Check VAPI dashboard.')
      return false
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
    return false
  }
}

createTestCall()
