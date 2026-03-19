/**
 * Cleanup Script: Delete test assistants created during development
 * KEEPS: Current production assistant, demo assistant, and real client assistants
 */

const VAPI_API_KEY = '97bc98b8-1ec0-4604-ac4f-8146d477d45b'

// IDs to DELETE (test assistants from development)
const TEST_ASSISTANT_IDS = [
  '4d20a67d-8773-4d6c-8f40-a7d7c55c4297', // #2 WXM Profiles - Jordyn AI Assistant
  'f31e357e-48a7-46bb-9c62-0475005559b5', // #3 BioQuest - Jordyn AI Assistant
  'f67abeb8-3306-413c-a537-3b8e924e0c4e', // #4 BotMakers, Inc. - Jordyn AI Assistant (old)
  '99b9dbb0-81c7-4cd7-8e52-69c83225be48', // #5 BotMakers, Inc. - Jordyn AI Assistant (old)
  '84184b98-225b-4df0-a487-bf6e6bd1f204', // #6 BotMakers, Inc. - Jordyn AI Assistant (old)
  '12dc6fc1-abc1-41dc-a6bd-97b2ef3905b2', // #7 BioQuest - Jordyn AI Assistant
  '8a68fb1d-7378-41ab-ab87-0fef59d639e7', // #8 Jordan - bf91c173
  'b3ed2388-1042-4a99-9ba6-838e511ff691', // #9 Jordan - bf91c173
  'f7c25fad-5c63-4ec4-93bb-5898d08a1fcb', // #10 Jordan - bf91c173
]

// KEEP these (for reference - won't touch):
// 0ab364ef-34e9-4115-840e-2cb380cff5fb - Current BotMakers production
// 35b6ffa0-b893-4da5-8fc1-0e8c38a68a6f - Demo assistant
// All assistants from 2025 (real clients)

async function cleanupTestAssistants() {
  console.log('🧹 Cleaning up test assistants...\n')
  console.log(`Will delete ${TEST_ASSISTANT_IDS.length} test assistants\n`)

  let deleted = 0
  let failed = 0

  for (const id of TEST_ASSISTANT_IDS) {
    try {
      console.log(`Deleting ${id}...`)

      const response = await fetch(`https://api.vapi.ai/assistant/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      })

      if (response.ok) {
        deleted++
        console.log(`  ✅ Deleted`)
      } else {
        const error = await response.text()
        failed++
        console.log(`  ❌ Failed: ${error}`)
      }

      // Rate limit: wait 100ms between deletions
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      failed++
      console.error(`  ❌ Error:`, error.message)
    }
  }

  console.log(`\n✅ Cleanup complete!`)
  console.log(`   Deleted: ${deleted}`)
  console.log(`   Failed: ${failed}`)
  console.log(`\nKept assistants:`)
  console.log(`   - BotMakers, Inc. - Jordyn AI Assistant (production)`)
  console.log(`   - Jordan - AgentOS Demo Assistant`)
  console.log(`   - All real client assistants`)
}

cleanupTestAssistants().catch(console.error)
