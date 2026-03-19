/**
 * Update Crown Heights Transfer Tool - Forward Caller ID
 * Updates the transferCall tool to pass through the original customer's phone number
 * instead of showing the AI agent's phone number when transferring calls.
 */

const VAPI_API_KEY = '97bc98b8-1ec0-4604-ac4f-8146d477d45b'
const TOOL_ID = 'dd1450e9-1b29-454d-b894-45ae6bc50c1b'

async function updateTransferTool() {
  console.log('🔧 Updating Crown Heights transfer tool to forward caller ID...\n')

  // First, fetch current config
  const fetchResponse = await fetch(`https://api.vapi.ai/tool/${TOOL_ID}`, {
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`
    }
  })

  const currentConfig = await fetchResponse.json()
  console.log(`Found ${currentConfig.destinations.length} transfer destinations`)

  // Update each destination to forward caller ID using VAPI template variable
  const updatedDestinations = currentConfig.destinations.map(dest => ({
    ...dest,
    callerId: '{{call.customer.number}}' // VAPI will replace with original caller's number
  }))

  // Update the tool
  const updateResponse = await fetch(`https://api.vapi.ai/tool/${TOOL_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      destinations: updatedDestinations
    })
  })

  if (!updateResponse.ok) {
    const error = await updateResponse.text()
    console.error('❌ Update failed:', error)
    process.exit(1)
  }

  const result = await updateResponse.json()

  console.log('\n✅ Transfer tool updated successfully!')
  console.log('\n📋 Changes:')
  console.log('   - Caller ID mode: forward (shows original customer phone number)')
  console.log(`   - Applied to ${result.destinations.length} destinations`)
  console.log('\n🎯 When Crown Heights AI transfers calls, the recipient will now see')
  console.log('   the customer\'s phone number instead of the AI agent\'s number.')
}

updateTransferTool().catch(console.error)
