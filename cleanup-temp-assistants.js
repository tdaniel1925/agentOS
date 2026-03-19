/**
 * Cleanup Script: Delete all temporary outbound call assistants
 * Run: node cleanup-temp-assistants.js
 */

const VAPI_API_KEY = '97bc98b8-1ec0-4604-ac4f-8146d477d45b'

async function cleanupTempAssistants() {
  console.log('Fetching all VAPI assistants...')

  // Fetch all assistants
  const response = await fetch('https://api.vapi.ai/assistant', {
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`
    }
  })

  const assistants = await response.json()
  console.log(`Found ${assistants.length} total assistants`)

  // Filter for temporary ones (name starts with "ob-")
  const tempAssistants = assistants.filter(a => a.name?.startsWith('ob-'))
  console.log(`Found ${tempAssistants.length} temporary assistants to delete`)

  if (tempAssistants.length === 0) {
    console.log('No temporary assistants to clean up!')
    return
  }

  // Delete each one
  let deleted = 0
  for (const assistant of tempAssistants) {
    try {
      console.log(`Deleting ${assistant.name} (${assistant.id})...`)

      const deleteResponse = await fetch(`https://api.vapi.ai/assistant/${assistant.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      })

      if (deleteResponse.ok) {
        deleted++
        console.log(`  ✅ Deleted`)
      } else {
        const error = await deleteResponse.text()
        console.log(`  ❌ Failed: ${error}`)
      }

      // Rate limit: wait 100ms between deletions
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`  ❌ Error deleting ${assistant.name}:`, error)
    }
  }

  console.log(`\n✅ Cleanup complete! Deleted ${deleted} of ${tempAssistants.length} temporary assistants.`)
}

cleanupTempAssistants().catch(console.error)
