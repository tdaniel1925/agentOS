const VAPI_API_KEY = '97bc98b8-1ec0-4604-ac4f-8146d477d45b'

async function listAssistants() {
  const response = await fetch('https://api.vapi.ai/assistant', {
    headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
  })

  const assistants = await response.json()

  console.log('\n=== ALL VAPI ASSISTANTS ===\n')

  assistants.forEach((a, i) => {
    console.log(`${i + 1}. ${a.name}`)
    console.log(`   ID: ${a.id}`)
    console.log(`   Created: ${a.createdAt}`)
    console.log(`   Model: ${a.model?.provider} - ${a.model?.model}`)
    console.log('')
  })

  console.log(`Total: ${assistants.length} assistants`)
}

listAssistants().catch(console.error)
