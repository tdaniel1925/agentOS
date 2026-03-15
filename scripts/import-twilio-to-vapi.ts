/**
 * Import Twilio Number to VAPI
 *
 * This connects your existing A2P 10DLC compliant Twilio number to VAPI
 * so all demo calls come from YOUR number (+16517287626)
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const VAPI_DEMO_ASSISTANT_ID = '35b6ffa0-b893-4da5-8fc1-0e8c38a68a6f';

if (!VAPI_API_KEY || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function importTwilioNumber() {
  console.log('📞 Importing your Twilio number to VAPI...\n');
  console.log(`   Twilio Number: ${TWILIO_PHONE_NUMBER}`);
  console.log(`   Account SID: ${TWILIO_ACCOUNT_SID}\n`);

  try {
    const response = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'twilio',
        number: TWILIO_PHONE_NUMBER,
        twilioAccountSid: TWILIO_ACCOUNT_SID,
        twilioAuthToken: TWILIO_AUTH_TOKEN,
        name: 'AgentOS Demo Line (A2P 10DLC)',
        assistantId: VAPI_DEMO_ASSISTANT_ID
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ VAPI API Error:', errorText);

      // Check if number already exists
      if (errorText.includes('already exists') || errorText.includes('duplicate')) {
        console.log('\n💡 This number might already be imported. Let me check...\n');

        // Get existing phone numbers
        const listResponse = await fetch('https://api.vapi.ai/phone-number', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`
          }
        });

        const phoneNumbers = await listResponse.json();
        const existingNumber = phoneNumbers.find((pn: any) => pn.number === TWILIO_PHONE_NUMBER);

        if (existingNumber) {
          console.log('✅ Your Twilio number is already in VAPI!\n');
          console.log('📋 Phone Number Details:');
          console.log(`   Number: ${existingNumber.number}`);
          console.log(`   ID: ${existingNumber.id}`);
          console.log(`   Provider: ${existingNumber.provider}`);
          console.log(`   Assistant: ${existingNumber.assistantId || 'None'}\n`);

          if (existingNumber.assistantId !== VAPI_DEMO_ASSISTANT_ID) {
            console.log('🔧 Updating to use demo assistant...\n');

            const updateResponse = await fetch(`https://api.vapi.ai/phone-number/${existingNumber.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                assistantId: VAPI_DEMO_ASSISTANT_ID
              })
            });

            if (updateResponse.ok) {
              console.log('✅ Phone number updated to use Jordan!\n');
            }
          }

          console.log('🎉 All set! Demo calls will now come from: ' + TWILIO_PHONE_NUMBER);
          console.log('\n📝 Add this to your .env.local:\n');
          console.log(`VAPI_PHONE_NUMBER_ID=${existingNumber.id}\n`);
          return;
        }
      }

      process.exit(1);
    }

    const phoneNumber = await response.json();

    console.log('✅ Twilio number imported successfully!\n');
    console.log('📋 Phone Number Details:');
    console.log(`   Number: ${phoneNumber.number}`);
    console.log(`   ID: ${phoneNumber.id}`);
    console.log(`   Provider: ${phoneNumber.provider}`);
    console.log(`   Assistant: Jordan (${VAPI_DEMO_ASSISTANT_ID})\n`);

    console.log('🔧 Next Steps:\n');
    console.log('   1. Add this to your .env.local:\n');
    console.log(`      VAPI_PHONE_NUMBER_ID=${phoneNumber.id}\n`);
    console.log('   2. All demo calls will now come from YOUR number!');
    console.log(`      ${TWILIO_PHONE_NUMBER}\n`);
    console.log('   3. This number is A2P 10DLC compliant ✓\n');

  } catch (error) {
    console.error('❌ Error importing number:', error);
    process.exit(1);
  }
}

importTwilioNumber();
