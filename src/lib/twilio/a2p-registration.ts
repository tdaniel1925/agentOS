/**
 * Twilio A2P (Application-to-Person) Campaign Registration
 *
 * Required for sending SMS in the US as of 2024
 * Without A2P registration, SMS messages get blocked by carriers
 *
 * Process:
 * 1. Register Brand (your business)
 * 2. Create Campaign (SMS use case)
 * 3. Associate phone numbers with campaign
 *
 * References:
 * - https://www.twilio.com/docs/messaging/guides/a2p-10dlc
 * - https://www.twilio.com/docs/messaging/guides/a2p-10dlc/get-started
 */

import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export interface BrandRegistration {
  businessName: string
  businessIndustry: string
  businessWebsite: string
  businessAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  businessContactEmail: string
  businessContactPhone: string
  businessTaxId?: string // EIN for US businesses
}

export interface CampaignRegistration {
  brandSid: string
  useCase: string // e.g., 'CUSTOMER_CARE', 'MIXED', 'MARKETING'
  description: string
  messageSamples: string[]
  messageFlow: string
  helpMessage: string
  optInMessage: string
  optOutMessage: string
  optInKeywords: string[]
  optOutKeywords: string[]
  helpKeywords: string[]
}

/**
 * Register your brand with Twilio A2P
 * This should be done ONCE for your business
 *
 * Note: This uses the simplified brand registration API
 * For production, you may need to verify your business with additional documentation
 */
export async function registerBrand(registration: BrandRegistration): Promise<string> {
  try {
    console.log('📝 Registering brand with Twilio A2P...')

    // Create A2P brand registration
    const brand = await twilioClient.messaging.v1.a2p.brandRegistrations.create({
      brandType: 'STARTER', // Use STARTER for small businesses, STANDARD for larger
      displayName: registration.businessName,
      companyName: registration.businessName,
      website: registration.businessWebsite,
      email: registration.businessContactEmail,
      phone: registration.businessContactPhone,
      street: registration.businessAddress.street,
      city: registration.businessAddress.city,
      state: registration.businessAddress.state,
      postalCode: registration.businessAddress.postalCode,
      country: registration.businessAddress.country,
    } as any)

    console.log(`✅ Brand registered: ${brand.sid}`)
    return brand.sid

  } catch (error) {
    console.error('❌ Brand registration failed:', error)
    throw error
  }
}

/**
 * Create SMS campaign (Messaging Service with A2P)
 * Use case: MIXED (customer care + notifications)
 */
export async function createCampaign(campaign: CampaignRegistration): Promise<string> {
  try {
    console.log('📝 Creating A2P campaign (Messaging Service)...')

    // Create the messaging service
    const messagingService = await twilioClient.messaging.v1.services.create({
      friendlyName: 'Jordyn AI Assistant Messaging Service',
    })

    console.log(`   Created messaging service: ${messagingService.sid}`)

    // Register A2P use case for the messaging service
    const usAppToPerson = await twilioClient.messaging.v1
      .services(messagingService.sid)
      .usAppToPerson
      .create({
        brandRegistrationSid: campaign.brandSid,
        description: campaign.description,
        messageFlow: campaign.messageFlow,
        messageSamples: campaign.messageSamples,
        usAppToPersonUsecase: campaign.useCase,
        hasEmbeddedLinks: true,
        hasEmbeddedPhone: true,
      } as any)

    console.log(`   Registered A2P use case: ${usAppToPerson.sid}`)
    console.log(`✅ Campaign created: ${messagingService.sid}`)

    return messagingService.sid

  } catch (error) {
    console.error('❌ Campaign creation failed:', error)
    throw error
  }
}

/**
 * Associate phone number with campaign
 * Call this for each provisioned phone number
 */
export async function associatePhoneWithCampaign(
  phoneNumberSid: string,
  messagingServiceSid: string
): Promise<void> {
  try {
    console.log(`📞 Associating phone ${phoneNumberSid} with campaign...`)

    await twilioClient.messaging.v1.services(messagingServiceSid)
      .phoneNumbers
      .create({
        phoneNumberSid: phoneNumberSid,
      })

    console.log(`✅ Phone number associated with campaign`)

  } catch (error) {
    console.error('❌ Phone association failed:', error)
    throw error
  }
}

/**
 * Get campaign status
 */
export async function getCampaignStatus(messagingServiceSid: string): Promise<string> {
  const service = await twilioClient.messaging.v1.services(messagingServiceSid).fetch()
  return service.sid
}

/**
 * Simplified one-time setup for Jordyn platform
 * Run this ONCE to set up your A2P campaign
 */
export async function setupJordynA2PCampaign(): Promise<{
  brandSid: string
  campaignSid: string
}> {
  // Step 1: Register brand (BotMakers Inc)
  const brandSid = await registerBrand({
    businessName: 'BotMakers Inc',
    businessIndustry: 'TECHNOLOGY',
    businessWebsite: 'https://jordyn.app',
    businessAddress: {
      street: '123 Main St', // Replace with actual address
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
    },
    businessContactEmail: 'support@jordyn.app',
    businessContactPhone: '+15551234567', // Replace with actual phone
    businessTaxId: '12-3456789', // Replace with actual EIN
  })

  // Step 2: Create campaign
  const campaignSid = await createCampaign({
    brandSid,
    useCase: 'MIXED', // Customer care + notifications
    description: 'Jordyn AI receptionist sends appointment reminders, call summaries, and responds to customer inquiries',
    messageSamples: [
      'Hi! This is Jordyn from {BusinessName}. Your appointment is confirmed for tomorrow at 2pm. Reply CANCEL to cancel.',
      'Call summary: Spoke with John about insurance quote. He requested callback next week.',
      'Welcome to Jordyn! Your AI receptionist is ready. Text me anytime for help.',
    ],
    messageFlow: 'Customer subscribes to Jordyn service → Receives notifications and can text commands → Can opt-out anytime',
    helpMessage: 'Text HELP for assistance. Reply STOP to unsubscribe.',
    optInMessage: 'Welcome to Jordyn! You will receive notifications and can text commands. Reply STOP to opt-out.',
    optOutMessage: 'You have been unsubscribed from Jordyn notifications. Text START to re-subscribe.',
    optInKeywords: ['START', 'YES', 'UNSTOP'],
    optOutKeywords: ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'],
    helpKeywords: ['HELP', 'INFO', 'SUPPORT'],
  })

  // Store these in your .env:
  // TWILIO_A2P_BRAND_SID=BN...
  // TWILIO_A2P_CAMPAIGN_SID=CS...

  console.log(`\n✅ A2P Setup Complete!`)
  console.log(`   Brand SID: ${brandSid}`)
  console.log(`   Campaign SID: ${campaignSid}`)
  console.log(`\n📝 Add these to your .env:`)
  console.log(`   TWILIO_A2P_BRAND_SID=${brandSid}`)
  console.log(`   TWILIO_A2P_CAMPAIGN_SID=${campaignSid}`)

  return { brandSid, campaignSid }
}
