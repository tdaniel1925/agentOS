/**
 * Twilio A2P Helper Functions
 * For managing phone numbers with existing A2P campaign
 */

import { getTwilioClient } from './client'

/**
 * Associate a Twilio phone number with your approved A2P messaging service
 * Call this whenever you purchase a new Twilio number for SMS
 */
export async function associateNumberWithA2P(phoneNumberSid: string): Promise<void> {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  if (!messagingServiceSid) {
    console.warn('⚠️ No TWILIO_MESSAGING_SERVICE_SID configured - skipping A2P association')
    return
  }

  const client = getTwilioClient()

  try {
    console.log(`📞 Associating ${phoneNumberSid} with A2P campaign ${messagingServiceSid}`)

    await client.messaging.v1
      .services(messagingServiceSid)
      .phoneNumbers
      .create({ phoneNumberSid })

    console.log(`✅ Number associated with A2P campaign successfully`)
  } catch (error: any) {
    console.error('❌ A2P association failed:', error)

    // Don't throw if already associated
    if (error.code === 21710) { // Number already in service
      console.log('   Number already associated with messaging service')
      return
    }

    throw error
  }
}

/**
 * Buy a new Twilio number and automatically associate with A2P campaign
 */
export async function buyTwilioNumberWithA2P(options: {
  areaCode?: string
  friendlyName: string
}): Promise<{ phoneNumber: string; sid: string }> {
  const client = getTwilioClient()

  // Search for available numbers
  const availableNumbers = await client.availablePhoneNumbers('US')
    .local
    .list({
      areaCode: options.areaCode,
      smsEnabled: true,
      limit: 1
    })

  if (availableNumbers.length === 0) {
    throw new Error(`No available numbers in area code ${options.areaCode}`)
  }

  const numberToBuy = availableNumbers[0].phoneNumber

  // Purchase the number
  const purchasedNumber = await client.incomingPhoneNumbers.create({
    phoneNumber: numberToBuy,
    friendlyName: options.friendlyName,
    smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio-sms`,
    smsMethod: 'POST',
  })

  console.log(`✅ Purchased Twilio number: ${purchasedNumber.phoneNumber}`)

  // Automatically associate with A2P campaign
  await associateNumberWithA2P(purchasedNumber.sid)

  return {
    phoneNumber: purchasedNumber.phoneNumber,
    sid: purchasedNumber.sid,
  }
}

/**
 * List all phone numbers in your A2P messaging service
 */
export async function listA2PNumbers(): Promise<string[]> {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  if (!messagingServiceSid) {
    throw new Error('TWILIO_MESSAGING_SERVICE_SID not configured')
  }

  const client = getTwilioClient()

  const phoneNumbers = await client.messaging.v1
    .services(messagingServiceSid)
    .phoneNumbers
    .list()

  return phoneNumbers.map(pn => pn.phoneNumber)
}

/**
 * Check if a phone number is associated with your A2P campaign
 */
export async function isNumberInA2PCampaign(phoneNumberSid: string): Promise<boolean> {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  if (!messagingServiceSid) {
    return false
  }

  const client = getTwilioClient()

  try {
    const phoneNumbers = await client.messaging.v1
      .services(messagingServiceSid)
      .phoneNumbers
      .list()

    return phoneNumbers.some(pn => pn.sid === phoneNumberSid)
  } catch (error) {
    console.error('Error checking A2P association:', error)
    return false
  }
}
