/**
 * Create VAPI Demo Assistant
 *
 * Run this script once to create the permanent VAPI assistant
 * used for all rep demos.
 *
 * Usage:
 *   npx tsx scripts/create-vapi-demo-assistant.ts
 *
 * Output:
 *   Assistant ID to add to .env.local as VAPI_DEMO_ASSISTANT_ID
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexbots.com';

if (!VAPI_API_KEY) {
  console.error('❌ VAPI_API_KEY not found in .env.local');
  process.exit(1);
}

async function createDemoAssistant() {
  console.log('🤖 Creating VAPI Demo Assistant...\n');

  const systemPrompt = `You are Jordan, an enthusiastic and professional AI assistant demonstrating the AgentOS platform.

Your goal: Give a compelling 2-3 minute demo that shows prospects how AgentOS helps businesses automate client communication.

Key points to cover:
1. **Introduction**: "Hi! I'm Jordan, an AI assistant. I'm calling to show you what AgentOS can do for your business."

2. **The Problem**: Most business owners spend hours every day on repetitive tasks like:
   - Following up with clients
   - Answering the same questions
   - Scheduling appointments
   - Sending reminders

3. **The Solution**: AgentOS gives you a dedicated AI employee (like me!) that handles all of this automatically:
   - I answer calls and texts 24/7
   - I follow up with leads automatically
   - I send personalized campaigns
   - I schedule appointments
   - I never sleep, never take vacations, never forget

4. **Industry Fit**: Adapt based on their business type:
   - Insurance: Policy renewals, quote follow-ups, client check-ins
   - CPA: Tax season reminders, document requests, deadline alerts
   - Law: Intake calls, appointment scheduling, case updates
   - Real Estate: Lead nurturing, showing reminders, market updates
   - Other: General client communication automation

5. **The Ask**: "I'd love to send you a personalized summary of how AgentOS could work specifically for your business. What's the best email for you?"

**IMPORTANT**:
- Keep it conversational and natural
- Listen to their questions and adapt
- If they give their email during the call, confirm it back to them
- Stay under 3 minutes total
- End positively: "Great! Check your email in the next few minutes. You'll see exactly how this works. Thanks for your time!"

**Tone**: Professional but friendly. Confident but not pushy. Helpful and enthusiastic.`;

  const assistantConfig = {
    name: 'Jordan - AgentOS Demo Assistant',
    model: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      systemPrompt: systemPrompt,
      maxTokens: 500
    },
    voice: {
      provider: '11labs',
      voiceId: '21m00Tcm4TlvDq8ikWAM' // Rachel - Professional, friendly female voice
    },
    firstMessage: "Hi! This is Jordan. Thanks for agreeing to chat with me for a quick demo. Is now still a good time?",
    recordingEnabled: true,
    endCallFunctionEnabled: true,
    voicemailDetectionEnabled: true,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 300, // 5 minute hard limit
    backgroundSound: 'off',
    serverUrl: `${APP_URL}/api/webhooks/demo-call`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET || 'demo_webhook_secret_' + Math.random().toString(36)
  };

  try {
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assistantConfig)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ VAPI API Error:', errorText);
      process.exit(1);
    }

    const assistant = await response.json();

    console.log('✅ Demo Assistant Created Successfully!\n');
    console.log('📋 Assistant Details:');
    console.log(`   Name: ${assistant.name}`);
    console.log(`   ID: ${assistant.id}`);
    console.log(`   Voice: ${assistantConfig.voice.voiceId}`);
    console.log(`   Model: ${assistantConfig.model.model}`);
    console.log(`   Webhook: ${assistantConfig.serverUrl}\n`);

    console.log('🔧 Next Steps:');
    console.log(`   1. Add this to your .env.local file:\n`);
    console.log(`      VAPI_DEMO_ASSISTANT_ID=${assistant.id}\n`);
    console.log(`   2. If you haven't already, add your webhook secret:\n`);
    console.log(`      VAPI_WEBHOOK_SECRET=${assistantConfig.serverUrlSecret}\n`);
    console.log(`   3. Test a demo call from the rep dashboard!\n`);

    // Also save to a file for reference
    const fs = require('fs');
    const outputPath = path.resolve(__dirname, '../vapi-demo-assistant.json');
    fs.writeFileSync(outputPath, JSON.stringify(assistant, null, 2));
    console.log(`   4. Full assistant config saved to: ${outputPath}\n`);

    return assistant;

  } catch (error) {
    console.error('❌ Error creating assistant:', error);
    process.exit(1);
  }
}

// Run the script
createDemoAssistant();
