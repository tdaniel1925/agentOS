/**
 * Update VAPI Assistant Greeting
 * Updates existing assistants to say "Thank you for calling [Business]"
 * and speak as a receptionist (answering calls) instead of making calls
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const VAPI_API_KEY = process.env.VAPI_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function updateAssistant(assistantId, businessName, botName) {
  const inboundPrompt = `You are ${botName}, the AI receptionist for ${businessName}.

Your role is to answer incoming calls professionally and helpfully. You are ANSWERING the phone for the business.

You can help callers with:
- Answering questions about the business
- Taking messages
- Booking appointments
- Providing information
- Directing calls appropriately
- Capturing lead information

Be professional, friendly, and helpful. You represent ${businessName} to every caller.

Important: You are ANSWERING calls (receptionist), not making them. Speak as if you picked up the phone when someone called the business.`

  const updates = {
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      systemPrompt: inboundPrompt
    },
    firstMessage: `Thank you for calling ${businessName}, this is ${botName}. How can I help you today?`,
    endCallMessage: `Thank you for calling ${businessName}. Have a great day!`
  }

  const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to update assistant: ${error}`)
  }

  return response.json()
}

async function updateAllAssistants() {
  console.log('🔄 Updating all VAPI assistants with new greeting...\n')

  try {
    // Get all subscribers with their assistant IDs
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('id, name, business_name, bot_name, vapi_assistant_id')
      .not('vapi_assistant_id', 'is', null)

    if (error) {
      throw error
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No subscribers found with VAPI assistants')
      return
    }

    console.log(`Found ${subscribers.length} subscriber(s) with assistants\n`)

    for (const subscriber of subscribers) {
      const businessName = subscriber.business_name || subscriber.name || 'the office'
      const botName = subscriber.bot_name || 'Jordan'

      console.log(`Updating ${botName} for ${businessName}...`)
      console.log(`  Assistant ID: ${subscriber.vapi_assistant_id}`)

      try {
        await updateAssistant(subscriber.vapi_assistant_id, businessName, botName)
        console.log(`  ✅ Updated successfully`)
        console.log(`     New greeting: "Thank you for calling ${businessName}, this is ${botName}. How can I help you today?"`)
      } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`)
      }

      console.log('')
    }

    console.log('\n✅ All assistants updated!')
    console.log('\nChanges:')
    console.log('  - First message now says "Thank you for calling [Business]"')
    console.log('  - Speaks as receptionist ANSWERING calls (not making calls)')
    console.log('  - Professional, helpful tone for inbound callers')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

updateAllAssistants()
