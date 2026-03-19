/**
 * Check VAPI Webhook Configuration
 * Verifies webhook URLs are set correctly for call events
 */

require('dotenv').config({ path: '.env.local' })

const VAPI_API_KEY = process.env.VAPI_API_KEY

async function checkWebhooks() {
  console.log('🔍 Checking VAPI webhook configuration...\n')

  try {
    // Check phone numbers for serverUrl (webhook endpoint)
    const phoneResponse = await fetch('https://api.vapi.ai/phone-number', {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
    })

    const phones = await phoneResponse.json()

    if (!Array.isArray(phones)) {
      console.error('❌ Error fetching phone numbers:', phones)
      return
    }

    console.log(`📞 Found ${phones.length} phone number(s)\n`)

    phones.forEach((phone, idx) => {
      console.log(`${idx + 1}. ${phone.number || phone.name}`)
      console.log(`   ID: ${phone.id}`)
      console.log(`   Assistant ID: ${phone.assistantId || 'none'}`)
      console.log(`   Server URL: ${phone.serverUrl || 'NOT SET ❌'}`)
      console.log('')
    })

    // Check if any have the correct webhook URL
    const correctUrl = 'https://jordyn.app/api/webhooks/vapi'
    const hasCorrectWebhook = phones.some(p => p.serverUrl === correctUrl)

    console.log('\n📋 Summary:')
    if (hasCorrectWebhook) {
      console.log('✅ Webhook URL is correctly set on at least one phone number')
    } else {
      console.log('❌ No phone numbers have the correct webhook URL')
      console.log(`   Expected: ${correctUrl}`)
    }

    // Check assistants for serverUrl (some assistants can have their own webhooks)
    console.log('\n\n🤖 Checking assistants for webhook configuration...\n')

    const assistantResponse = await fetch('https://api.vapi.ai/assistant', {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
    })

    const assistants = await assistantResponse.json()

    if (Array.isArray(assistants)) {
      const assistantsWithWebhooks = assistants.filter(a => a.serverUrl || a.server?.url)

      if (assistantsWithWebhooks.length > 0) {
        console.log(`Found ${assistantsWithWebhooks.length} assistant(s) with webhook URLs:\n`)
        assistantsWithWebhooks.forEach(a => {
          console.log(`- ${a.name}`)
          console.log(`  Webhook: ${a.serverUrl || a.server?.url}`)
        })
      } else {
        console.log('No assistants have webhook URLs configured')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkWebhooks()
