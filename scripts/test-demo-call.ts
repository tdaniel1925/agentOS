/**
 * Test Demo Call
 *
 * Triggers a test demo call to verify the VAPI assistant works
 *
 * Usage:
 *   npx tsx scripts/test-demo-call.ts +1XXXXXXXXXX "Your Name"
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_DEMO_ASSISTANT_ID = process.env.VAPI_DEMO_ASSISTANT_ID || '35b6ffa0-b893-4da5-8fc1-0e8c38a68a6f';

const phoneNumber = process.argv[2];
const customerName = process.argv[3] || 'there';

if (!phoneNumber) {
  console.error('❌ Usage: npx tsx scripts/test-demo-call.ts +1XXXXXXXXXX "Your Name"');
  process.exit(1);
}

if (!VAPI_API_KEY) {
  console.error('❌ VAPI_API_KEY not found in .env.local');
  process.exit(1);
}

async function makeTestCall() {
  console.log('📞 Initiating test demo call...\n');
  console.log(`   To: ${phoneNumber}`);
  console.log(`   Name: ${customerName}`);
  console.log(`   Assistant: Jordan (${VAPI_DEMO_ASSISTANT_ID})\n`);

  try {
    // First, get available phone numbers from VAPI
    const phoneNumbersResponse = await fetch('https://api.vapi.ai/phone-number', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`
      }
    });

    const phoneNumbers = await phoneNumbersResponse.json();

    if (!phoneNumbers || phoneNumbers.length === 0) {
      console.error('❌ No phone numbers found in your VAPI account.');
      console.log('\n💡 You need to buy a phone number in VAPI dashboard first:');
      console.log('   https://dashboard.vapi.ai/phone-numbers\n');
      process.exit(1);
    }

    const phoneNumberId = phoneNumbers[0].id;
    console.log(`   Using VAPI phone: ${phoneNumbers[0].number}\n`);

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumberId: phoneNumberId,
        assistantId: VAPI_DEMO_ASSISTANT_ID,
        customer: {
          number: phoneNumber,
          name: customerName
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ VAPI API Error:', errorText);
      process.exit(1);
    }

    const call = await response.json();

    console.log('✅ Call initiated successfully!\n');
    console.log('📋 Call Details:');
    console.log(`   Call ID: ${call.id}`);
    console.log(`   Status: ${call.status}`);
    console.log(`   To: ${call.customer.number}`);
    console.log(`   Name: ${call.customer.name}\n`);
    console.log('📱 Your phone should ring in the next few seconds...\n');
    console.log('💡 During the call, try:');
    console.log('   - Listen to Jordan introduce AgentOS');
    console.log('   - When asked, provide your email address');
    console.log('   - See how Jordan adapts to your questions\n');

  } catch (error) {
    console.error('❌ Error making call:', error);
    process.exit(1);
  }
}

makeTestCall();
