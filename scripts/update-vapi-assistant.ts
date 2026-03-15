/**
 * Update VAPI Demo Assistant
 * Updates the existing assistant configuration
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_DEMO_ASSISTANT_ID = '35b6ffa0-b893-4da5-8fc1-0e8c38a68a6f';

async function updateAssistant() {
  console.log('🔧 Updating VAPI Demo Assistant...\n');

  const updates = {
    firstMessageMode: 'assistant-waits-for-user', // Don't speak first!
    firstMessage: null // Remove the automatic first message
  };

  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${VAPI_DEMO_ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ VAPI API Error:', errorText);
      process.exit(1);
    }

    const assistant = await response.json();

    console.log('✅ Assistant updated successfully!\n');
    console.log('📋 Changes:');
    console.log('   - First message mode: assistant-waits-for-user');
    console.log('   - Jordan will now wait for the person to say "Hello" first\n');

  } catch (error) {
    console.error('❌ Error updating assistant:', error);
    process.exit(1);
  }
}

updateAssistant();
