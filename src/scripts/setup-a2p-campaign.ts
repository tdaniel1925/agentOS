/**
 * ONE-TIME A2P Campaign Setup Script
 *
 * This script registers BotMakers Inc with Twilio A2P and creates
 * a campaign for the Jordyn platform.
 *
 * IMPORTANT: Run this ONCE before going to production
 *
 * Usage:
 *   npx tsx src/scripts/setup-a2p-campaign.ts
 *
 * Prerequisites:
 *   1. Valid Twilio account with SMS enabled
 *   2. Business information (EIN, address, etc.)
 *   3. Environment variables configured
 */

import { setupJordynA2PCampaign } from '../lib/twilio/a2p-registration'
import { getTwilioClient } from '../lib/twilio/client'

async function main() {
  console.log('🚀 Starting Twilio A2P Campaign Setup\n')
  console.log('This will register BotMakers Inc and create the Jordyn SMS campaign.\n')

  try {
    // Step 1: Set up campaign (brand + messaging service)
    console.log('📝 Step 1: Registering brand and creating campaign...\n')
    const { brandSid, campaignSid } = await setupJordynA2PCampaign()

    // Step 2: Associate the SMS phone number with campaign
    console.log('\n📞 Step 2: Associating SMS phone number with campaign...\n')

    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
    if (!twilioPhoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable not set')
    }

    const client = getTwilioClient()

    // Look up the phone number SID
    const phoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: twilioPhoneNumber,
      limit: 1
    })

    if (phoneNumbers.length === 0) {
      throw new Error(`Phone number ${twilioPhoneNumber} not found in Twilio account`)
    }

    const phoneNumberSid = phoneNumbers[0].sid

    // Associate with messaging service (campaign)
    await client.messaging.v1.services(campaignSid)
      .phoneNumbers
      .create({
        phoneNumberSid: phoneNumberSid,
      })

    console.log(`✅ Phone number ${twilioPhoneNumber} associated with campaign`)

    // Step 3: Output results
    console.log('\n' + '='.repeat(60))
    console.log('✅ A2P SETUP COMPLETE!')
    console.log('='.repeat(60))
    console.log('\n📝 Add these to your .env.local file:\n')
    console.log(`TWILIO_A2P_BRAND_SID=${brandSid}`)
    console.log(`TWILIO_MESSAGING_SERVICE_SID=${campaignSid}`)
    console.log('\n📝 Update your production environment variables in Vercel:\n')
    console.log('   vercel env add TWILIO_A2P_BRAND_SID')
    console.log('   vercel env add TWILIO_MESSAGING_SERVICE_SID')
    console.log('\n⚠️  IMPORTANT: Campaign approval can take 1-3 business days')
    console.log('   Monitor status at: https://console.twilio.com/us1/develop/sms/services')
    console.log('\n🎉 Your SMS messages will now be A2P compliant!\n')

  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    console.error('\n📖 Troubleshooting:')
    console.error('   1. Ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set')
    console.error('   2. Verify TWILIO_PHONE_NUMBER is correct')
    console.error('   3. Update business info in src/lib/twilio/a2p-registration.ts')
    console.error('   4. Check Twilio console for error details')
    console.error('   5. Visit https://www.twilio.com/docs/messaging/guides/a2p-10dlc\n')
    process.exit(1)
  }
}

main()
