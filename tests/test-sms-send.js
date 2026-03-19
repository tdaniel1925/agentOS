/**
 * Test actual SMS sending via Twilio
 */

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+16517287626'
const TO_NUMBER = process.env.TEST_PHONE_NUMBER || '+18148006032'

if (!TWILIO_SID || !TWILIO_TOKEN) {
  console.log('❌ Error: Missing Twilio credentials in environment')
  process.exit(1)
}

async function sendTestSMS() {
  console.log('📱 Sending test SMS...')
  console.log('From:', FROM_NUMBER)
  console.log('To:', TO_NUMBER)
  console.log('')
  
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(TWILIO_SID + ':' + TWILIO_TOKEN).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: TO_NUMBER,
          From: FROM_NUMBER,
          Body: '🎉 TEST: Jordyn system is working! This is an automated test message.'
        })
      }
    )
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ SMS sent successfully!')
      console.log('   Message SID:', result.sid)
      console.log('   Status:', result.status)
      console.log('   To:', result.to)
      console.log('')
      console.log('🔔 Check phone', TO_NUMBER, 'for the message!')
      return true
    } else {
      const error = await response.text()
      console.log('❌ SMS failed:', error)
      return false
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
    return false
  }
}

sendTestSMS()
