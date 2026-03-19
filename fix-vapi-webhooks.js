/**
 * Fix VAPI Webhook Configuration
 * Sets correct webhook URL on phone numbers
 */

require('dotenv').config({ path: '.env.local' })

const VAPI_API_KEY = process.env.VAPI_API_KEY
const CORRECT_WEBHOOK_URL = 'https://jordyn.app/api/webhooks/vapi'

async function fixWebhooks() {
  console.log('🔧 Fixing VAPI webhook configuration...\n')

  // Phone numbers to update
  const phonesToFix = [
    {
      id: 'fc067291-7039-496a-8d92-10731bb49eb0',
      number: '+18326623168',
      name: 'Main Jordyn number'
    }
  ]

  for (const phone of phonesToFix) {
    console.log(`Updating ${phone.name} (${phone.number})...`)

    try {
      const response = await fetch(`https://api.vapi.ai/phone-number/${phone.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serverUrl: CORRECT_WEBHOOK_URL
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error(`  ❌ Failed: ${error}`)
      } else {
        const result = await response.json()
        console.log(`  ✅ Updated successfully`)
        console.log(`     Webhook URL: ${result.serverUrl}`)
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`)
    }

    console.log('')
  }

  console.log('\n✅ Webhook configuration updated!')
  console.log(`\nAll calls will now send events to: ${CORRECT_WEBHOOK_URL}`)
  console.log('\nThis means:')
  console.log('  - Temporary assistants will be deleted after calls')
  console.log('  - You\'ll receive SMS summaries after outbound calls')
  console.log('  - Call data will be logged to database')
}

fixWebhooks()
